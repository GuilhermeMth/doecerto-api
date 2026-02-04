import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WhishlistItemService } from './whishlist-item.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('WhishlistItemService', () => {
  let service: WhishlistItemService;
  let prisma: PrismaService;

  const mockPrismaService = {
    wishlistItem: {
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
        WhishlistItemService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WhishlistItemService>(WhishlistItemService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByOng', () => {
    it('should return wishlist items for an ONG', async () => {
      const mockItems = [
        { id: 1, ongId: 1, description: 'Food supplies', quantity: 10 },
        { id: 2, ongId: 1, description: 'Medical supplies', quantity: 5 },
      ];

      mockPrismaService.wishlistItem.findMany.mockResolvedValue(mockItems);

      const result = await service.findAllByOng(1);

      expect(result).toHaveLength(2);
      expect(result[0].description).toBe('Food supplies');
    });

    it('should return empty array when ONG has no wishlist items', async () => {
      mockPrismaService.wishlistItem.findMany.mockResolvedValue([]);

      const result = await service.findAllByOng(999);

      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a wishlist item by id', async () => {
      const mockItem = {
        id: 1,
        ongId: 1,
        description: 'Food supplies',
        quantity: 10,
      };

      mockPrismaService.wishlistItem.findUnique.mockResolvedValue(mockItem);

      const result = await service.findOne(1);

      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPrismaService.wishlistItem.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
