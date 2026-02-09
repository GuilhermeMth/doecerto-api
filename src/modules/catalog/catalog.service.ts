import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetCatalogDto } from './dto/get-catalog.dto';
import { CatalogSectionDto, NgoItemDto } from './dto/catalog-response.dto';
import { sortCatalogItems } from 'src/common/utils/sorting.util';

// Tipo interno que inclui matchCount para ordenação
type NgoItemWithMatch = NgoItemDto & { 
  matchCount: number; 
  distance?: number;
  averageRating?: number;
  numberOfRatings?: number;
  donationCount?: number;
  formattedDate?: string;
};

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Método principal que orquestra as diferentes seções do catálogo
   * Se houver searchTerm, retorna uma única lista filtrada
   * Caso contrário, retorna 4 listas com ordenações diferentes
   */
  async getCatalog(filters: GetCatalogDto, userId: number): Promise<CatalogSectionDto[] | CatalogSectionDto> {
    // Se houver termo de pesquisa, retorna uma única lista filtrada
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const searchResults = await this.searchCatalog(filters);
      return {
        title: `Resultados para "${filters.searchTerm}"`,
        type: 'search',
        items: this.sanitizeForResponse(searchResults),
      };
    }

    // Executa as queries em paralelo, mas trata nearby separadamente
    const [topRated, newest, oldest, mostDonated, leastDonated] = await Promise.all([
      this.getTopRated(filters),
      this.getNewest(filters),
      this.getOldest(filters),
      this.getMostDonated(filters),
      this.getLeastDonated(filters),
    ]);

    const sections: CatalogSectionDto[] = [
      { title: 'Melhor Avaliadas', type: 'topRated', items: this.sanitizeForResponse(topRated) },
      { title: 'Mais Recentes', type: 'newest', items: this.sanitizeForResponse(newest) },
      { title: 'Próximas a Você', type: 'nearby', items: [] },
      { title: 'Mais Antigas', type: 'oldest', items: this.sanitizeForResponse(oldest) },
      { title: 'Mais Doações Recebidas', type: 'mostDonated', items: this.sanitizeForResponse(mostDonated) },
      { title: 'Menos Doações Recebidas', type: 'leastDonated', items: this.sanitizeForResponse(leastDonated) },
    ];

    // Tenta adicionar nearby, mas se falhar, mantém a seção com mensagem
    try {
      const nearby = await this.getNearby(filters, userId);
      if (nearby.length > 0) {
        sections[2].items = this.sanitizeForResponse(nearby);
      } else {
        // Se não há items nearby, significa que usuário não tem endereço
        sections[2] = {
          title: 'Você precisa cadastrar seu endereço na plataforma para aparecer as ONGs mais próximas',
          type: 'nearby',
          items: []
        };
      }
    } catch (error) {
      // Se erro, mantém a seção com mensagem
      sections[2] = {
        title: 'Erro ao buscar ONGs próximas',
        type: 'nearby',
        items: []
      };
    }

    return sections;
  }

  // --- MÉTODOS DE ACESSO PÚBLICO PARA SEÇÕES ESPECÍFICAS ---

  /**
   * Busca no catálogo por termo (nome de ONG ou categoria)
   */
  private async searchCatalog(filters: GetCatalogDto): Promise<NgoItemWithMatch[]> {
    const { searchTerm, categoryIds } = filters;
    const take = filters.limit || 20;
    const skip = filters.offset || 0;

    const whereClause: any = {
      verificationStatus: 'verified',
      OR: [
        {
          user: {
            name: { search: searchTerm },
          },
        },
        {
          profile: {
            categories: {
              some: {
                name: { contains: searchTerm },
              },
            },
          },
        },
      ],
    };

    // Se houver filtro de categorias, adiciona AND com as categorias
    if (categoryIds && categoryIds.length > 0) {
      whereClause.profile = {
        categories: {
          some: { id: { in: categoryIds } },
        },
      };
    }

    const ongs = await this.prisma.ong.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true },
        },
        profile: {
          include: { categories: true },
        },
      },
      orderBy: [{ averageRating: 'desc' }, { userId: 'asc' }],
      skip,
      take,
    });

    return ongs.map((ong) => this.mapToDto(ong, categoryIds));
  }

  private async getTopRated(filters: GetCatalogDto) {
    return this.findWithPriority(filters, 'averageRating', 'rating.average', 'desc', true);
  }

  private async getNewest(filters: GetCatalogDto) {
    return this.findWithPriority(filters, 'createdAt', 'createdAt', 'desc', false, true);
  }

  private async getNearby(filters: GetCatalogDto, userId: number) {
    const NEARBY_RADIUS_KM = 10;
    const take = filters.limit || 10;
    const skip = filters.offset || 0;

    // Busca o endereço do usuário
    const address = await this.prisma.address.findFirst({
      where: {
        OR: [{ donorId: userId }, { ongId: userId }],
      },
    });

    if (!address || !address.latitude || !address.longitude) {
      // Se não houver endereço, retorna lista vazia
      return [];
    }

    const { categoryIds } = filters;

    // Busca ONGs verificadas com endereço
    const ongs = await this.prisma.ong.findMany({
      where: {
        verificationStatus: 'verified',
        address: {
          AND: [
            { latitude: { not: null } },
            { longitude: { not: null } },
          ],
        },
        ...(categoryIds && categoryIds.length > 0 && {
          profile: {
            categories: {
              some: { id: { in: categoryIds } },
            },
          },
        }),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        profile: {
          select: { categories: true, avatarUrl: true, bannerUrl: true },
        },
        address: true,
      },
    });

    // Calcula distância e filtra
    const ongsWithDistance = ongs
      .map((ong) => {
        const distance = this.calculateDistance(
          address.latitude!,
          address.longitude!,
          ong.address!.latitude!,
          ong.address!.longitude!,
        );
        return { ong, distance };
      })
      .filter(({ distance }) => distance <= NEARBY_RADIUS_KM)
      .sort(({ distance: distA }, { distance: distB }) => distA - distB)
      .slice(skip, skip + take);

    return ongsWithDistance.map(({ ong, distance }) => this.mapToDto(ong, categoryIds, Math.round(distance * 100) / 100));
  }

  private async getOldest(filters: GetCatalogDto) {
    return this.findWithPriority(filters, 'createdAt', 'createdAt', 'asc', false, true);
  }

  private async getMostDonated(filters: GetCatalogDto) {
    return this.findWithDonationCount(filters, 'desc');
  }

  private async getLeastDonated(filters: GetCatalogDto) {
    return this.findWithDonationCount(filters, 'asc');
  }

  /**
   * Lógica central de busca com ranking de prioridade por causas/categorias
   * @param prismaField - Campo do modelo Prisma (banco de dados)
   * @param dtoField - Campo do DTO (para re-ordenação em memória)
   */
  private async findWithPriority(
    filters: GetCatalogDto,
    prismaField: string,
    dtoField: string,
    orderByDirection: 'asc' | 'desc',
    includeRating: boolean = false,
    includeFormattedDate: boolean = false,
  ): Promise<NgoItemWithMatch[]> {
    const { categoryIds } = filters;
    const take = filters.limit || 10;
    const skip = filters.offset || 0;

    // 1. Construção do Filtro
    const whereClause: any = {
      verificationStatus: 'verified',
    };

    if (categoryIds && categoryIds.length > 0) {
      whereClause.profile = {
        categories: {
          some: { id: { in: categoryIds } },
        },
      };
    }

    // 2. Busca no Prisma
    // Se houver filtros de categorias, buscamos amostra maior para re-ranquear no código
    const shouldFetchMore = categoryIds && categoryIds.length > 0;
    const fetchLimit = shouldFetchMore ? Math.max(take * 5, 50) : take;

    const ongs = await this.prisma.ong.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        profile: {
          select: { categories: true, avatarUrl: true, bannerUrl: true },
        },
      },
      orderBy: [
        { [prismaField]: orderByDirection },
        { userId: 'asc' }, // Desempate determinístico usando PK
      ],
      // Paginação no DB apenas se não houver ranking de match
      skip: shouldFetchMore ? 0 : skip,
      take: fetchLimit,
    });

    // 3. Mapeamento para DTO
    let mappedResults = ongs.map((ong) => this.mapToDto(ong, categoryIds, undefined, includeRating, false, includeFormattedDate));

    // 4. Re-ordenação por Prioridade + Paginação Manual (Se houver filtro)
    if (shouldFetchMore) {
      mappedResults = sortCatalogItems(mappedResults, dtoField, orderByDirection);
      mappedResults = mappedResults.slice(skip, skip + take);
    }

    return mappedResults;
  }

  /**
   * Busca ONGs ordenadas por quantidade de doações recebidas
   */
  private async findWithDonationCount(
    filters: GetCatalogDto,
    orderByDirection: 'asc' | 'desc',
  ): Promise<NgoItemWithMatch[]> {
    const { categoryIds } = filters;
    const take = filters.limit || 10;
    const skip = filters.offset || 0;

    // 1. Construção do Filtro
    const whereClause: any = {
      verificationStatus: 'verified',
    };

    if (categoryIds && categoryIds.length > 0) {
      whereClause.profile = {
        categories: {
          some: { id: { in: categoryIds } },
        },
      };
    }

    // 2. Busca no Prisma com contagem de doações
    const ongs = await this.prisma.ong.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        profile: {
          select: { categories: true, avatarUrl: true, bannerUrl: true },
        },
        _count: {
          select: { donations: true },
        },
      },
      orderBy: [
        { donations: { _count: orderByDirection } },
        { userId: 'asc' }, // Desempate determinístico usando PK
      ],
      skip,
      take,
    });

    // 3. Mapeamento para DTO
    return ongs.map((ong) => this.mapToDto(ong, categoryIds, undefined, false, true));
  }

  /**
   * Transforma a entidade do Prisma para o DTO de Resposta
   * Retorna também o matchCount internamente para ordenação
   */
  private mapToDto(
    ong: any, 
    filterCategoryIds?: number[], 
    distance?: number,
    includeRating: boolean = false,
    includeDonationCount: boolean = false,
    includeFormattedDate: boolean = false
  ): NgoItemWithMatch {
    const categories = ong.profile?.categories || [];
    
    // Calcula quantos IDs batem com o filtro para o ranking (uso interno)
    const matchCount = filterCategoryIds?.length
      ? categories.filter((c) => filterCategoryIds.includes(c.id)).length
      : 0;

    // Formatar data se solicitado
    let formattedDate: string | undefined;
    if (includeFormattedDate && ong.createdAt) {
      const date = new Date(ong.createdAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      formattedDate = `${year}/${month}/${day}`;
    }

    return {
      id: ong.userId,
      name: ong.user?.name || 'ONG sem nome',
      avatarUrl: ong.profile?.avatarUrl || null,
      bannerUrl: ong.profile?.bannerUrl || null,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
      })),
      createdAt: ong.createdAt,
      distance, // Distância opcional
      averageRating: includeRating ? (ong.averageRating || 0) : undefined,
      numberOfRatings: includeRating ? (ong.numberOfRatings || 0) : undefined,
      donationCount: includeDonationCount ? (ong._count?.donations || 0) : undefined,
      formattedDate,
      matchCount, // Usado apenas para ordenação interna
    };
  }

  /**
   * Remove campos internos antes de retornar ao cliente
   */
  private sanitizeForResponse(items: NgoItemWithMatch[]): NgoItemDto[] {
    return items.map(({ matchCount, ...item }) => item);
  }

  /**
   * Calcula a distância entre duas coordenadas usando a fórmula de Haversine
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Raio da Terra em km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}