import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { DonorsService } from '../donors/donors.service';
import { OngsService } from '../ongs/ongs.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailerService } from 'src/common/services/mailer.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockDonorsService = {
    create: jest.fn(),
  };

  const mockOngsService = {
    create: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: DonorsService,
          useValue: mockDonorsService,
        },
        {
          provide: OngsService,
          useValue: mockOngsService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    it('should return access token and user data on successful login', async () => {
      const loginDto = { email: 'test@test.com', password: 'password123' };
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        password: '$2b$10$hashedPassword',
        role: 'donor',
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('test-token');
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);

      const result = await service.signIn(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@test.com');
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      const loginDto = { email: 'invalid@test.com', password: 'password123' };

      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.signIn(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
