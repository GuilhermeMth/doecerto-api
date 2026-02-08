export class MetricItemDto {
  id: number;
  name: string;
  email?: string;
  value: number;
  category?: string;
}

export class CategoryStatsDto {
  name: string;
  count: number;
  percentage: number;
}

export class GeneralStatsDto {
  totalOngs: number;
  totalDonors: number;
}

export class MetricsResponseDto {
  topOngsByDonationCount: MetricItemDto[];
  topDonorsByFrequency: MetricItemDto[];
  topPositiveRatings: MetricItemDto[];
  topNegativeRatings: MetricItemDto[];
  categoriesStats: CategoryStatsDto[];
  generalStats: GeneralStatsDto;
}