import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('RatingsService', () => {
  let service: RatingsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    rating: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      upsert: jest.fn(),
    },
    ong: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    donation: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RatingsService>(RatingsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('rateOng', () => {
    it('should create or update a rating for an ONG', async () => {
      const ratingDto = { score: 5, comment: 'Great ONG' };
      const mockRating = {
        id: 1,
        ongId: 1,
        donorId: 1,
        score: 5,
        comment: 'Great ONG',
        createdAt: new Date(),
      };

      mockPrismaService.ong.findUnique.mockResolvedValue({ userId: 1 });
      mockPrismaService.donation.count.mockResolvedValue(1);
      mockPrismaService.$transaction.mockResolvedValue(mockRating);

      const result = await service.rateOng(ratingDto, 1, 1);

      expect(result).toEqual(mockRating);
    });
  });

  describe('getOngRatings', () => {
    it('should return ratings for an ONG', async () => {
      const mockRatings = [
        {
          score: 5,
          comment: 'Great ONG',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.ong.findUnique.mockResolvedValue({ userId: 1 });
      mockPrismaService.rating.findMany.mockResolvedValue(mockRatings);

      const result = await service.getOngRatings(1);

      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(5);
    });
  });
});
