import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/cache/cache.service';
import { GetCatalogDto } from './dto/get-catalog.dto';
import { CatalogSectionDto, NgoItemDto } from './dto/catalog-response.dto';
import { sortCatalogItems } from 'src/common/utils/sorting.util';

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
  private readonly CACHE_TTL = 300; // 5 minutos

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async getCatalog(
    filters: GetCatalogDto,
    userId: number,
  ): Promise<CatalogSectionDto[] | CatalogSectionDto> {
    const cached = await this.cacheService.get<
      CatalogSectionDto[] | CatalogSectionDto
    >(filters, userId);

    if (cached) {
      return cached;
    }

    let result: CatalogSectionDto[] | CatalogSectionDto;

    if (filters.searchTerm && filters.searchTerm.trim()) {
      const searchResults = await this.searchCatalog(filters);
      result = {
        title: `Resultados para "${filters.searchTerm}"`,
        type: 'search',
        items: this.sanitizeForResponse(searchResults),
      };
    } else {
      const [topRated, newest, oldest, mostDonated, leastDonated] =
        await Promise.all([
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

      try {
        const nearby = await this.getNearby(filters, userId);
        if (nearby.length > 0) {
          sections[2].items = this.sanitizeForResponse(nearby);
        } else {
          sections[2] = {
            title: 'Você precisa cadastrar seu endereço para ver ONGs próximas',
            type: 'nearby',
            items: [],
          };
        }
      } catch {
        sections[2] = {
          title: 'Erro ao buscar ONGs próximas',
          type: 'nearby',
          items: [],
        };
      }

      result = sections;
    }

    await this.cacheService.set(filters, userId, result, this.CACHE_TTL);

    return result;
  }

  private async searchCatalog(filters: GetCatalogDto): Promise<NgoItemWithMatch[]> {
    const { searchTerm, categoryIds } = filters;
    const take = filters.limit || 20;
    const skip = filters.offset || 0;

    const whereClause: any = {
      verificationStatus: 'verified',
      OR: [
        { user: { name: { search: searchTerm } } },
        {
          profile: {
            categories: {
              some: { name: { contains: searchTerm } },
            },
          },
        },
      ],
    };

    if (categoryIds?.length) {
      whereClause.profile = {
        categories: { some: { id: { in: categoryIds } } },
      };
    }

    const ongs = await this.prisma.ong.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true } },
        profile: { include: { categories: true } },
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

  private async getOldest(filters: GetCatalogDto) {
    return this.findWithPriority(filters, 'createdAt', 'createdAt', 'asc', false, true);
  }

  private async getMostDonated(filters: GetCatalogDto) {
    return this.findWithDonationCount(filters, 'desc');
  }

  private async getLeastDonated(filters: GetCatalogDto) {
    return this.findWithDonationCount(filters, 'asc');
  }

  private async getNearby(filters: GetCatalogDto, userId: number) {
    const NEARBY_RADIUS_KM = 10;
    const take = filters.limit || 10;
    const skip = filters.offset || 0;

    const address = await this.prisma.address.findFirst({
      where: { OR: [{ donorId: userId }, { ongId: userId }] },
    });

    if (!address?.latitude || !address?.longitude) {
      return [];
    }

    const ongs = await this.prisma.ong.findMany({
      where: {
        verificationStatus: 'verified',
        address: {
          latitude: { not: null },
          longitude: { not: null },
        },
      },
      include: {
        user: { select: { id: true, name: true } },
        profile: { select: { categories: true, avatarUrl: true, bannerUrl: true } },
        address: true,
      },
    });

    return ongs
      .map((ong) => ({
        ong,
        distance: this.calculateDistance(
          address.latitude!,
          address.longitude!,
          ong.address!.latitude!,
          ong.address!.longitude!,
        ),
      }))
      .filter(({ distance }) => distance <= NEARBY_RADIUS_KM)
      .sort((a, b) => a.distance - b.distance)
      .slice(skip, skip + take)
      .map(({ ong, distance }) =>
        this.mapToDto(ong, filters.categoryIds, Math.round(distance * 100) / 100),
      );
  }

  private async findWithPriority(
    filters: GetCatalogDto,
    prismaField: string,
    dtoField: string,
    order: 'asc' | 'desc',
    includeRating = false,
    includeFormattedDate = false,
  ): Promise<NgoItemWithMatch[]> {
    const { categoryIds } = filters;
    const take = filters.limit || 10;
    const skip = filters.offset || 0;

    const where: any = { verificationStatus: 'verified' };
    if (categoryIds?.length) {
      where.profile = { categories: { some: { id: { in: categoryIds } } } };
    }

    const shouldFetchMore = categoryIds?.length;
    const fetchLimit = shouldFetchMore ? Math.max(take * 5, 50) : take;

    const ongs = await this.prisma.ong.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        profile: { select: { categories: true, avatarUrl: true, bannerUrl: true } },
      },
      orderBy: [{ [prismaField]: order }, { userId: 'asc' }],
      skip: shouldFetchMore ? 0 : skip,
      take: fetchLimit,
    });

    let results = ongs.map((ong) =>
      this.mapToDto(ong, categoryIds, undefined, includeRating, false, includeFormattedDate),
    );

    if (shouldFetchMore) {
      results = sortCatalogItems(results, dtoField, order).slice(skip, skip + take);
    }

    return results;
  }

  private async findWithDonationCount(
    filters: GetCatalogDto,
    order: 'asc' | 'desc',
  ): Promise<NgoItemWithMatch[]> {
    const take = filters.limit || 10;
    const skip = filters.offset || 0;

    const ongs = await this.prisma.ong.findMany({
      where: { verificationStatus: 'verified' },
      include: {
        user: { select: { id: true, name: true } },
        profile: { select: { categories: true, avatarUrl: true, bannerUrl: true } },
        _count: { select: { donations: true } },
      },
      orderBy: [{ donations: { _count: order } }, { userId: 'asc' }],
      skip,
      take,
    });

    return ongs.map((ong) =>
      this.mapToDto(ong, filters.categoryIds, undefined, false, true),
    );
  }

  private mapToDto(
    ong: any,
    filterCategoryIds?: number[],
    distance?: number,
    includeRating = false,
    includeDonationCount = false,
    includeFormattedDate = false,
  ): NgoItemWithMatch {
    const categories = ong.profile?.categories || [];
    const matchCount = filterCategoryIds
      ? categories.filter((c) => filterCategoryIds.includes(c.id)).length
      : 0;

    let formattedDate: string | undefined;
    if (includeFormattedDate && ong.createdAt) {
      const d = new Date(ong.createdAt);
      formattedDate = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    }

    return {
      id: ong.userId,
      name: ong.user?.name ?? 'ONG sem nome',
      avatarUrl: ong.profile?.avatarUrl ?? null,
      bannerUrl: ong.profile?.bannerUrl ?? null,
      categories: categories.map((c) => ({ id: c.id, name: c.name })),
      createdAt: ong.createdAt,
      distance,
      averageRating: includeRating ? ong.averageRating ?? 0 : undefined,
      numberOfRatings: includeRating ? ong.numberOfRatings ?? 0 : undefined,
      donationCount: includeDonationCount ? ong._count?.donations ?? 0 : undefined,
      formattedDate,
      matchCount,
    };
  }

  private sanitizeForResponse(items: NgoItemWithMatch[]): NgoItemDto[] {
    return items.map(({ matchCount, ...rest }) => rest);
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
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
