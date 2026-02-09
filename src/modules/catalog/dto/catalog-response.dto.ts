// src/catalog/dto/catalog-response.dto.ts

export class CategoryDto {
  id: number;
  name: string;
}

export class NgoItemDto {
  id: number;
  name: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  categories: CategoryDto[];
  createdAt: Date;
  distance?: number; // Distância em km (para nearby)
  averageRating?: number; // Avaliação média (para topRated)
  numberOfRatings?: number; // Número de avaliações (para topRated)
  donationCount?: number; // Número de doações recebidas (para most/least donated)
  formattedDate?: string; // Data formatada yyyy/mm/dd (para newest/oldest)
}

export class CatalogSectionDto {
  title: string;
  type: string;
  items: NgoItemDto[];
}