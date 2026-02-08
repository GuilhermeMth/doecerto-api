import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  MetricsResponseDto,
  MetricItemDto,
  CategoryStatsDto,
  GeneralStatsDto,
} from './dto/metric-response.dto';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(): Promise<MetricsResponseDto> {
    // Executar todas as queries em paralelo
    const [
      topOngsByDonationCount,
      topDonorsByFrequency,
      topPositiveRatings,
      topNegativeRatings,
      categoriesStats,
      generalStats,
    ] = await Promise.all([
      this.getTopOngsByDonationCount(),
      this.getTopDonorsByFrequency(),
      this.getTopPositiveRatings(),
      this.getTopNegativeRatings(),
      this.getCategoriesStats(),
      this.getGeneralStats(),
    ]);

    return {
      topOngsByDonationCount,
      topDonorsByFrequency,
      topPositiveRatings,
      topNegativeRatings,
      categoriesStats,
      generalStats,
    };
  }

  /**
   * ONGs que mais receberam doações (por quantidade)
   */
  private async getTopOngsByDonationCount(): Promise<MetricItemDto[]> {
    const result = await this.prisma.donation.groupBy({
      by: ['ongId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    // Buscar detalhes das ONGs
    const ongsWithCounts = await Promise.all(
      result.map(async (item) => {
        const ong = await this.prisma.ong.findUnique({
          where: { userId: item.ongId },
          include: {
            user: {
              select: { name: true, email: true },
            },
            profile: {
              include: {
                categories: {
                  take: 1,
                  select: { name: true },
                },
              },
            },
          },
        });

        return {
          id: item.ongId,
          name: ong?.user?.name || 'ONG sem nome',
          email: ong?.user?.email || '',
          value: item._count.id,
          category: ong?.profile?.categories?.[0]?.name || '',
        };
      }),
    );

    return ongsWithCounts;
  }

  /**
   * Doadores que mais doaram (por frequência/quantidade de doações)
   */
  private async getTopDonorsByFrequency(): Promise<MetricItemDto[]> {
    const result = await this.prisma.donation.groupBy({
      by: ['donorId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    // Buscar detalhes dos doadores
    const donorsWithCounts = await Promise.all(
      result.map(async (item) => {
        const donor = await this.prisma.donor.findUnique({
          where: { userId: item.donorId },
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        });

        return {
          id: item.donorId,
          name: donor?.user?.name || 'Doador sem nome',
          email: donor?.user?.email || '',
          value: item._count.id,
        };
      }),
    );

    return donorsWithCounts;
  }

  /**
   * ONGs com melhor avaliação (rating mais alto)
   */
  private async getTopPositiveRatings(): Promise<MetricItemDto[]> {
    const ongs = await this.prisma.ong.findMany({
      where: {
        numberOfRatings: {
          gt: 0, // Apenas ONGs que têm avaliações
        },
      },
      orderBy: {
        averageRating: 'desc',
      },
      take: 5,
      include: {
        user: {
          select: { name: true, email: true },
        },
        profile: {
          include: {
            categories: {
              take: 1,
              select: { name: true },
            },
          },
        },
      },
    });

    return ongs.map((ong) => ({
      id: ong.userId,
      name: ong.user?.name || 'ONG sem nome',
      email: ong.user?.email || '',
      value: ong.averageRating ? Number(ong.averageRating) : 0,
      category: ong.profile?.categories?.[0]?.name || '',
    }));
  }

  /**
   * ONGs com pior avaliação (rating mais baixo)
   */
  private async getTopNegativeRatings(): Promise<MetricItemDto[]> {
    const ongs = await this.prisma.ong.findMany({
      where: {
        numberOfRatings: {
          gt: 0, // Apenas ONGs que têm avaliações
        },
      },
      orderBy: {
        averageRating: 'asc',
      },
      take: 5,
      include: {
        user: {
          select: { name: true, email: true },
        },
        profile: {
          include: {
            categories: {
              take: 1,
              select: { name: true },
            },
          },
        },
      },
    });

    return ongs.map((ong) => ({
      id: ong.userId,
      name: ong.user?.name || 'ONG sem nome',
      email: ong.user?.email || '',
      value: ong.averageRating ? Number(ong.averageRating) : 0,
      category: ong.profile?.categories?.[0]?.name || '',
    }));
  }

  /**
   * Distribuição de ONGs por categoria
   */
  private async getCategoriesStats(): Promise<CategoryStatsDto[]> {
    // Buscar todas as categorias com suas ONGs usando Prisma ORM
    const categories = await this.prisma.category.findMany({
      include: {
        profiles: {
          select: {
            id: true,
          },
        },
      },
    });

    // Calcular total de ONGs (considerando que uma ONG pode ter múltiplas categorias)
    const totalOngs = await this.prisma.ong.count();

    // Mapear e calcular estatísticas
    const stats = categories.map((category) => {
      const count = category.profiles.length;
      return {
        name: category.name,
        count,
        percentage: totalOngs > 0 ? Math.round((count / totalOngs) * 100) : 0,
      };
    });

    // Filtrar categorias sem ONGs e ordenar por count decrescente
    return stats
      .filter((stat) => stat.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Estatísticas gerais
   */
  private async getGeneralStats(): Promise<GeneralStatsDto> {
    const [totalOngs, totalDonors] = await Promise.all([
      this.prisma.ong.count(),
      this.prisma.donor.count(),
    ]);

    return {
      totalOngs,
      totalDonors,
    };
  }
}