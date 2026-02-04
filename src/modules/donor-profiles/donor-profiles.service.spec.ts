import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DonorProfilesService } from './donor-profiles.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('DonorProfilesService', () => {
  let service: DonorProfilesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    donorProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonorProfilesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DonorProfilesService>(DonorProfilesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return donor profile by id', async () => {
      const mockProfile = {
        userId: 1,
        cpf: '12345678901',
        phone: '11999999999',
      };

      mockPrismaService.donorProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.findOne(1);

      expect(result).toEqual(mockProfile);
    });

    it('should throw NotFoundException when profile not found', async () => {
      mockPrismaService.donorProfile.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
