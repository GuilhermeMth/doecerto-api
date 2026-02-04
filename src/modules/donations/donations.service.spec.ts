import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { DonationType } from './dto/create-donation.dto';

describe('DonationsService', () => {
  let service: DonationsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    donation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    ong: {
      findUnique: jest.fn(),
    },
    donorProfile: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DonationsService>(DonationsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated donations', async () => {
      const mockDonations = [
        {
          id: 1,
          donationType: DonationType.monetary,
          monetaryAmount: 100,
          createdAt: new Date(),
        },
        {
          id: 2,
          donationType: DonationType.material,
          materialDescription: 'Food',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.donation.findMany.mockResolvedValue(mockDonations);
      mockPrismaService.donation.count.mockResolvedValue(2);

      const result = await service.findAll(0, 20);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should validate pagination parameters', async () => {
      mockPrismaService.donation.findMany.mockResolvedValue([]);
      mockPrismaService.donation.count.mockResolvedValue(0);

      await service.findAll(-10, 200);

      expect(mockPrismaService.donation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 100,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a donation by id', async () => {
      const mockDonation = {
        id: 1,
        donationType: DonationType.monetary,
        monetaryAmount: 100,
        createdAt: new Date(),
      };

      mockPrismaService.donation.findUnique.mockResolvedValue(mockDonation);

      const result = await service.findOne(1);

      expect(result).toEqual(mockDonation);
    });

    it('should throw NotFoundException when donation not found', async () => {
      mockPrismaService.donation.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
