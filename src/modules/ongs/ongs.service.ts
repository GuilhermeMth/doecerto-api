import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '../users/dto/create-user.dto';
import { CreateOngDto } from './dto/create-ong.dto';
import { UpdateOngDto } from './dto/update-ong.dto';
import { GetNearbyOngDto, NearbyOngResponseDto } from './dto/nearby-ong.dto';
import { excludePassword } from 'src/common/utils/exclude-password.util';
import { ValidationUtil } from 'src/common/utils/validation.util';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class OngsService {
  private readonly SALT_ROUNDS = 10;

  private readonly ongSelect = {
    userId: true,
    cnpj: true,
    verificationStatus: true,
    verifiedAt: true,
    verifiedById: true,
    rejectionReason: true,
    user: {
      select: { id: true, name: true, email: true },
    },
  } as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async create(createOngDto: CreateOngDto) {
    const { name, email, password, cnpj } = createOngDto;

    await ValidationUtil.validateUniqueCnpj(this.prisma, cnpj);
    await ValidationUtil.validateUniqueEmail(this.prisma, email);

    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: UserRole.ong,
        },
      });

      const ong = await tx.ong.create({
        data: {
          cnpj,
          userId: user.id,
        },
      });

      return { user, ong };
    });

    // invalidação do catálogo
    await this.cacheService.delByPrefix('catalog:');

    return {
      user: excludePassword(result.user),
      ong: result.ong,
    };
  }

  async findAll(skip = 0, take = 20) {
    const validTake = Math.min(Math.max(take, 1), 100);
    const validSkip = Math.max(skip, 0);

    const [ongs, total] = await Promise.all([
      this.prisma.ong.findMany({
        select: this.ongSelect,
        skip: validSkip,
        take: validTake,
        orderBy: { userId: 'desc' },
      }),
      this.prisma.ong.count(),
    ]);

    return {
      data: ongs,
      pagination: {
        skip: validSkip,
        take: validTake,
        total,
        pages: Math.ceil(total / validTake),
      },
    };
  }

  async findOne(id: number) {
    const ong = await this.prisma.ong.findUnique({
      where: { userId: id },
      select: this.ongSelect,
    });

    if (!ong) {
      throw new NotFoundException(`ONG with id ${id} not found`);
    }

    return ong;
  }

  async update(id: number, updateOngDto: UpdateOngDto) {
    const ong = await this.prisma.ong.findUnique({ where: { userId: id } });
    if (!ong) {
      throw new NotFoundException(`ONG with id ${id} not found`);
    }

    if (updateOngDto.cnpj && updateOngDto.cnpj !== ong.cnpj) {
      await ValidationUtil.validateUniqueCnpj(
        this.prisma,
        updateOngDto.cnpj,
        id,
      );
    }

    const updated = await this.prisma.ong.update({
      where: { userId: id },
      data: updateOngDto,
    });

    // invalidação do catálogo
    await this.cacheService.delByPrefix('catalog:');

    return updated;
  }

  async remove(id: number) {
    const ong = await this.prisma.ong.findUnique({ where: { userId: id } });
    if (!ong) {
      throw new NotFoundException(`ONG with id ${id} not found`);
    }

    const deleted = await this.prisma.ong.delete({ where: { userId: id } });

    // invalidação do catálogo
    await this.cacheService.delByPrefix('catalog:');

    return deleted;
  }

  async buscarOngsPorNomeOuCnpj(termo: string) {
    return this.prisma.ong.findMany({
      where: {
        OR: [
          { cnpj: { contains: termo } },
          {
            user: {
              name: { search: termo },
            },
          },
        ],
      },
      select: this.ongSelect,
    });
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

  async getNearbyWithUserAddress(userId: number) {
    const address = await this.prisma.address.findFirst({
      where: {
        OR: [{ donorId: userId }, { ongId: userId }],
      },
    });

    if (!address || !address.latitude || !address.longitude) {
      throw new BadRequestException(
        'Você precisa ter um endereço com localização configurado para buscar ONGs próximas',
      );
    }

    return this.getNearby({
      latitude: address.latitude,
      longitude: address.longitude,
      skip: 0,
      take: 20,
    });
  }

  async getNearby(filters: GetNearbyOngDto) {
    const NEARBY_RADIUS_KM = 10;
    const skip = filters.skip || 0;
    const take = filters.take || 20;

    const validTake = Math.min(Math.max(take, 1), 100);
    const validSkip = Math.max(skip, 0);

    const ongs = await this.prisma.ong.findMany({
      where: {
        verificationStatus: 'verified',
        address: {
          AND: [
            { latitude: { not: null } },
            { longitude: { not: null } },
          ],
        },
      },
      include: {
        user: { select: { id: true, name: true } },
        profile: {
          select: { avatarUrl: true, bio: true, bannerUrl: true },
        },
        address: {
          select: {
            street: true,
            number: true,
            neighborhood: true,
            city: true,
            state: true,
            zipCode: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    const ongsWithDistance = ongs
      .map((ong) => {
        const distance = this.calculateDistance(
          filters.latitude,
          filters.longitude,
          ong.address!.latitude!,
          ong.address!.longitude!,
        );

        return { ong, distance };
      })
      .filter(({ distance }) => distance <= NEARBY_RADIUS_KM)
      .sort((a, b) => a.distance - b.distance);

    const paginatedOngs = ongsWithDistance.slice(
      validSkip,
      validSkip + validTake,
    );

    const data: NearbyOngResponseDto[] = paginatedOngs.map(
      ({ ong, distance }) => ({
        id: ong.userId,
        userId: ong.userId,
        name: ong.user.name,
        avatarUrl: ong.profile?.avatarUrl || null,
        bannerUrl: ong.profile?.bannerUrl || null,
        bio: ong.profile?.bio || null,
        averageRating: ong.averageRating || 0,
        numberOfRatings: ong.numberOfRatings || 0,
        distance: Math.round(distance * 100) / 100,
        address: {
          street: ong.address!.street,
          number: ong.address!.number,
          neighborhood: ong.address!.neighborhood,
          city: ong.address!.city,
          state: ong.address!.state,
          zipCode: ong.address!.zipCode,
        },
      }),
    );

    return {
      data,
      pagination: {
        skip: validSkip,
        take: validTake,
        total: ongsWithDistance.length,
        pages: Math.ceil(ongsWithDistance.length / validTake),
      },
    };
  }
}
