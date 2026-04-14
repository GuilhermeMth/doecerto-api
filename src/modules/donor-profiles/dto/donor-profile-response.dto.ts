export class DonorProfileResponseDto {
  id: number;
  donorId: number;
  description?: string;
  avatarUrl?: string;
  contactNumber?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  donor: {
    userId: number;
    cpf: string;
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
}
