import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OngProfilesService } from './ong-profiles.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('OngProfileService', () => {
  let service: OngProfilesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    ongProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OngProfilesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OngProfilesService>(OngProfilesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return ONG profile by id', async () => {
      const mockProfile = {
        id: 1,
        ongId: 1,
        bio: 'Helping people in need',
        website: 'https://example.com',
      };

      mockPrismaService.ongProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.findOne(1);

      expect(result).toEqual(mockProfile);
    });

    it('should throw NotFoundException when profile not found', async () => {
      mockPrismaService.ongProfile.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
