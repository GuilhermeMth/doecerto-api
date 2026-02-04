import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DonorsService } from './donors.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('DonorsService', () => {
  let service: DonorsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    donorProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    donor: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonorsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DonorsService>(DonorsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated donors', async () => {
      const mockDonors = [
        {
          userId: 1,
          cpf: '12345678901',
          user: { id: 1, name: 'Donor 1', email: 'donor1@test.com' },
        },
        {
          userId: 2,
          cpf: '12345678902',
          user: { id: 2, name: 'Donor 2', email: 'donor2@test.com' },
        },
      ];

      mockPrismaService.donor.findMany.mockResolvedValue(mockDonors);
      mockPrismaService.donor.count.mockResolvedValue(2);

      const result = await service.findAll(0, 20);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should return a donor by id', async () => {
      const mockDonor = {
        userId: 1,
        cpf: '12345678901',
        user: { id: 1, name: 'Donor 1', email: 'donor1@test.com' },
      };

      mockPrismaService.donor.findUnique.mockResolvedValue(mockDonor);

      const result = await service.findOne(1);

      expect(result).toEqual(mockDonor);
    });

    it('should throw NotFoundException when donor not found', async () => {
      mockPrismaService.donor.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
