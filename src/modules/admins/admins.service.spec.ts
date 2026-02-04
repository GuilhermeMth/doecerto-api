import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('AdminsService', () => {
  let service: AdminsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    admin: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    ong: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminsService>(AdminsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAdmin', () => {
    it('should create a new admin', async () => {
      const createAdminDto = { name: 'Admin 1', email: 'admin1@test.com', password: 'password123' };
      const mockAdmin = {
        userId: 1,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 1,
        name: 'Admin 1',
        email: 'admin1@test.com',
        role: 'admin',
      });
      mockPrismaService.admin.create.mockResolvedValue(mockAdmin);

      const result = await service.createAdmin(createAdminDto);

      expect(result).toBeDefined();
    });
  });

  describe('approveOng', () => {
    it('should approve an ONG', async () => {
      const mockApprovedOng = {
        userId: 1,
        cnpj: '12345678901234',
        verificationStatus: 'verified',
      };

      mockPrismaService.admin.findUnique.mockResolvedValue({ userId: 1 });
      mockPrismaService.ong.findUnique.mockResolvedValue({ userId: 1, cnpj: '12345678901234' });
      mockPrismaService.ong.update.mockResolvedValue(mockApprovedOng);

      const result = await service.approveOng(1, 1);

      expect(result.verificationStatus).toBe('verified');
    });
  });

  describe('deleteAdmin', () => {
    it('should delete an admin', async () => {
      const mockAdmin = {
        userId: 1,
        user: { id: 1, name: 'Admin 1', email: 'admin1@test.com' },
      };

      mockPrismaService.admin.findUnique.mockResolvedValue(mockAdmin);
      mockPrismaService.user.delete.mockResolvedValue({
        id: 1,
        name: 'Admin 1',
        email: 'admin1@test.com',
      });

      const result = await service.deleteAdmin(1);

      expect(result).toBeDefined();
      expect(mockPrismaService.user.delete).toHaveBeenCalled();
    });
  });
});
