import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateOngProfileDto } from './dto/update-ong-profile.dto';
import { OngsBankAccountService } from 'src/modules/ongs-bank-account/ongs-bank-account.service';
import { Prisma } from 'generated/prisma';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class OngProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ongsBankAccountService: OngsBankAccountService,
    private readonly cacheService: CacheService,
  ) {}
  /**
   * Centralizamos o select para garantir consistência em todos os métodos de busca.
   * Inclui dados do Perfil, Categorias, ONG (CNPJ/Ratings) e Usuário Base.
   */
  private readonly profileSelect = {
    id: true,
    ongId: true,
    description: true,
    yearsOfOperation: true,
    avatarUrl: true,
    bannerUrl: true,
    contactNumber: true,
    websiteUrls: true,
    // Relacionamento Many-to-Many com Categorias (Causas)
    categories: {
      select: {
        id: true,
        name: true,
      },
    },
    // Relacionamento One-to-One com a entidade ONG
    ong: {
      select: {
        userId: true,
        cnpj: true,
        averageRating: true,
        numberOfRatings: true,
        // Dados do Usuário associado (Nome/Email)
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        // Endereço pertence à ONG, não ao OngProfile
        address: true,
      },
    },
  } as const;

  /**
   * Cria ou atualiza o perfil da ONG (Upsert).
   * @param userId ID do usuário extraído do JWT (segurança contra IDOR)
   * @param dto Dados de atualização vindos do Body
   * @param avatarPath Caminho da imagem de avatar já processada pelo ImageProcessingService
   * @param bannerPath Caminho da imagem de banner já processada pelo ImageProcessingService
   */
  async createOrUpdate(
    userId: number,
    dto: UpdateOngProfileDto,
    avatarPath?: string,
    bannerPath?: string,
  ) {
    const { categoryIds, bankAccount, website, bannerCropX, bannerCropY, ...profileData } = dto;

    const hasWebsiteField = Object.prototype.hasOwnProperty.call(
      dto,
      'website',
    );
    const websiteUrlsValue =
      website && website.length > 0 ? website : Prisma.DbNull;

    // 1. Validar se a ONG (entidade principal) existe
    const ongExists = await this.prisma.ong.findUnique({
      where: { userId },
    });

    if (!ongExists) {
      throw new NotFoundException(`ONG com userId ${userId} não encontrada.`);
    }

    // 2. Preparar objeto de dados para atualização (Update)
    const updateData = {
      ...profileData,
      ...(hasWebsiteField && { websiteUrls: websiteUrlsValue }),
      // Só sobrescreve as URLs se novas imagens foram enviadas
      ...(avatarPath && { avatarUrl: avatarPath }),
      ...(bannerPath && { bannerUrl: bannerPath }),
      categories: {
        set: categoryIds?.map((id) => ({ id })),
      },
    };

    // 3. Preparar objeto de dados para criação (Create)
    const createData = {
      ongId: userId,
      ...profileData,
      websiteUrls: websiteUrlsValue,
      avatarUrl: avatarPath || null,
      bannerUrl: bannerPath || null,
      categories: {
        connect: categoryIds?.map((id) => ({ id })),
      },
    };

    try {
      // 4. Executa a operação de Upsert (Update or Insert)
      const profile = await this.prisma.ongProfile.upsert({
        where: { ongId: userId },
        create: createData,
        update: updateData,
        select: this.profileSelect,
      });

      await this.cacheService.delByPrefix('catalog:');

      // 5. Se vier dados de conta bancária, faz create/update da conta bancária
      if (bankAccount) {
        await this.ongsBankAccountService.create(bankAccount, userId);
      }

      return profile;
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao processar a atualização do perfil. Verifique se os dados estão corretos.',
      );
    }
  }

  /**
   * Busca os detalhes do perfil da ONG autenticada.
   * Sempre retorna um objeto de perfil (fallback quando ainda não existe ong_profile).
   */
  async findMyProfile(userId: number) {
    // Busca o perfil da ONG
    const profile = await this.prisma.ongProfile.findUnique({
      where: { ongId: userId },
      select: this.profileSelect,
    });
    if (!profile) {
      const ong = await this.prisma.ong.findUnique({
        where: { userId },
        select: {
          userId: true,
          averageRating: true,
          numberOfRatings: true,
          user: {
            select: {
              name: true,
              email: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          address: true,
        },
      });

      if (!ong) {
        throw new NotFoundException(`ONG com userId ${userId} não encontrada.`);
      }

      const receivedDonations = await this.prisma.donation.count({
        where: { ongId: userId },
      });

      const address = await this.getOngAddress(ong.address);

      return this.buildMyProfileFallback(ong, receivedDonations, address);
    }

    // Busca a quantidade de doações recebidas
    const receivedDonations = await this.prisma.donation.count({
      where: { ongId: userId },
    });

    // Busca o endereço detalhado, se existir
    const address = await this.getOngAddress(profile.ong?.address);

    // Busca dados públicos da conta bancária de forma assíncrona
    const bankAccounts =
      await this.ongsBankAccountService.getPublicBankAccounts(userId);
    // Se houver apenas uma conta, adiciona pixKey no root do perfil para facilitar acesso rápido
    const pixKey =
      Array.isArray(bankAccounts) && bankAccounts.length === 1
        ? bankAccounts[0].pixKey
        : undefined;
    // Retorna perfil + dados bancários
    return {
      ...this.cleanProfileResponse(profile, receivedDonations, address),
      bankAccounts,
      pixKey,
    };
  }

  /**
   * Busca o perfil público da ONG.
   * Quando o perfil ainda não existe, retorna fallback ao invés de 404.
   */
  async findPublicProfile(userId: number) {
    return this.findMyProfile(userId);
  }

  async findPublicProfileOrThrow(userId: number) {
    return this.findPublicProfile(userId);
  }

  private buildMyProfileFallback(
    ong: {
      userId: number;
      averageRating: number | null;
      numberOfRatings: number;
      user: {
        name: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
      } | null;
    },
    receivedDonations: number,
    address: {
      street: string;
      number: string;
      complement: string | null;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      latitude: number | null;
      longitude: number | null;
    } | null,
  ) {
    return {
      id: ong.userId,
      name: ong.user?.name || null,
      email: ong.user?.email || null,
      avatarUrl: null,
      bannerUrl: null,
      description: null,
      yearsOfOperation: null,
      contactNumber: null,
      website: [],
      receivedDonations,
      rating: {
        average: ong.averageRating || 0,
        count: ong.numberOfRatings || 0,
      },
      categories: [],
      address: address ?? null,
      bankAccounts: [],
      pixKey: undefined,
      createdAt: ong.user?.createdAt || null,
      updatedAt: ong.user?.updatedAt || null,
    };
  }

  /**
   * Busca e normaliza o endereço da ONG
   */
  private async getOngAddress(rawAddress: any): Promise<{
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
  } | null> {
    if (!rawAddress || typeof rawAddress !== 'object') return null;
    // Se já está populado
    if ('street' in rawAddress) {
      const {
        street = '',
        number = '',
        complement = null,
        neighborhood = '',
        city = '',
        state = '',
        zipCode = '',
        country = '',
        latitude = null,
        longitude = null,
      } = rawAddress;
      return {
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipCode,
        country,
        latitude,
        longitude,
      };
    }
    // Se só tem id, busca do banco
    if ('id' in rawAddress && rawAddress.id) {
      return await this.prisma.address.findUnique({
        where: { id: rawAddress.id },
        select: {
          street: true,
          number: true,
          complement: true,
          neighborhood: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          latitude: true,
          longitude: true,
        },
      });
    }
    return null;
  }

  /**
   * Limpa e organiza a resposta do perfil da ONG para evitar dados duplicados e redundantes
   */
  private cleanProfileResponse(
    profile: any,
    receivedDonations = 0,
    address?: {
      street: string;
      number: string;
      complement: string | null;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      latitude: number | null;
      longitude: number | null;
    } | null,
  ) {
    if (!profile) return null;
    const {
      ongId,
      description,
      yearsOfOperation,
      avatarUrl,
      bannerUrl,
      contactNumber,
      websiteUrls,
      categories,
      ong,
    } = profile;

    const website = this.normalizeWebsiteUrls(websiteUrls);

    return {
      id: ongId,
      name: ong?.user?.name || null,
      email: ong?.user?.email || null,
      avatarUrl: avatarUrl || null,
      bannerUrl: bannerUrl || null,
      description: description || null,
      yearsOfOperation: yearsOfOperation ?? null,
      contactNumber: contactNumber || null,
      website,
      receivedDonations,
      rating: {
        average: ong?.averageRating || 0,
        count: ong?.numberOfRatings || 0,
      },
      categories:
        categories?.map((c: any) => ({ id: c.id, name: c.name })) || [],
      address: address ?? null,
      createdAt: ong?.user?.createdAt || null,
      updatedAt: ong?.user?.updatedAt || null,
    };
  }

  private normalizeWebsiteUrls(
    value: Prisma.JsonValue | null | undefined,
  ): string[] {
    if (!value) return [];

    if (Array.isArray(value)) {
      return value.filter(
        (item): item is string =>
          typeof item === 'string' && item.trim().length > 0,
      );
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      return [value];
    }

    return [];
  }
}
