import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OngsService } from './ongs.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('OngsService', () => {
  let service: OngsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    ong: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    user: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OngsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OngsService>(OngsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated verified ONGs', async () => {
      const mockOngs = [
        {
          userId: 1,
          cnpj: '12345678901234',
          verificationStatus: 'VERIFIED',
          user: { id: 1, name: 'ONG 1', email: 'ong1@test.com' },
        },
        {
          userId: 2,
          cnpj: '12345678901235',
          verificationStatus: 'VERIFIED',
          user: { id: 2, name: 'ONG 2', email: 'ong2@test.com' },
        },
      ];

      mockPrismaService.ong.findMany.mockResolvedValue(mockOngs);
      mockPrismaService.ong.count.mockResolvedValue(2);

      const result = await service.findAll(0, 20);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should validate pagination parameters', async () => {
      mockPrismaService.ong.findMany.mockResolvedValue([]);
      mockPrismaService.ong.count.mockResolvedValue(0);

      await service.findAll(-5, 150);

      expect(mockPrismaService.ong.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 100,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an ONG by id', async () => {
      const mockOng = {
        userId: 1,
        cnpj: '12345678901234',
        verificationStatus: 'VERIFIED',
        user: { id: 1, name: 'ONG 1', email: 'ong1@test.com' },
      };

      mockPrismaService.ong.findUnique.mockResolvedValue(mockOng);

      const result = await service.findOne(1);

      expect(result).toEqual(mockOng);
    });

    it('should throw NotFoundException when ONG not found', async () => {
      mockPrismaService.ong.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
