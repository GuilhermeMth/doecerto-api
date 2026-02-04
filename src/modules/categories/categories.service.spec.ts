import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all categories with pagination', async () => {
      const mockCategories = [
        { id: 1, name: 'Food', description: 'Food donations', createdAt: new Date() },
        { id: 2, name: 'Clothing', description: 'Clothing donations', createdAt: new Date() },
      ];

      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);
      mockPrismaService.category.count.mockResolvedValue(2);

      const result = await service.findAll(0, 10);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      const mockCategory = {
        id: 1,
        name: 'Food',
        description: 'Food donations',
      };

      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.findOne(1);

      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when category not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
