import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import type { User } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/modules/users/users.service';
import { DonorsService } from 'src/modules/donors/donors.service';
import { OngsService } from 'src/modules/ongs/ongs.service';
import { MailerService } from 'src/common/services/mailer.service';
import { CacheService } from 'src/cache/cache.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDonorDto } from './dto/register-donor.dto';
import { RegisterOngDto } from './dto/register-ong.dto';
import type { UserResponseDto } from 'src/modules/users/dto/user-response.dto';

interface AuthResponse {
  accessToken: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  profile?: any;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly donorsService: DonorsService,
    private readonly ongsService: OngsService,
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
    private readonly cacheService: CacheService,
  ) {}

  async signIn(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);
    const userResponse = this.formatUserResponse(user);

    return { accessToken: token, user: userResponse };
  }

  async signUpDonor(registerDonorDto: RegisterDonorDto): Promise<AuthResponse> {
    await this.checkEmailAvailability(registerDonorDto.email);

    const { user: newUser, donor: newDonorProfile } =
      await this.donorsService.create(registerDonorDto);

    const token = this.generateToken(newUser);
    const userResponse = this.formatUserResponse(newUser);

    return {
      accessToken: token,
      user: userResponse,
      profile: newDonorProfile,
    };
  }

  async signUpOng(registerOngDto: RegisterOngDto): Promise<AuthResponse> {
    await this.checkEmailAvailability(registerOngDto.email);

    const { user: newUser, ong: newOngProfile } =
      await this.ongsService.create(registerOngDto);

    // invalidação do cache do catálogo
    await this.cacheService.delByPrefix('catalog:');

    const token = this.generateToken(newUser);
    const userResponse = this.formatUserResponse(newUser);

    return {
      accessToken: token,
      user: userResponse,
      profile: newOngProfile,
    };
  }

  private async checkEmailAvailability(email: string): Promise<void> {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }
  }

  private generateToken(user: User | UserResponseDto): string {
    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  private formatUserResponse(user: User | UserResponseDto) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async forgotPassword(email: string): Promise<void> {
    this.logger.log(`Forgot password requested for ${email}`);
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      this.logger.warn(`Forgot password: user not found for ${email}`);
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await this.prisma.passwordResetToken.create({
      data: {
        email,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    await this.mailerService.sendPasswordResetEmail(email, token, user.name);
  }

  async validateResetToken(token: string): Promise<boolean> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken) return false;

    if (resetToken.expiresAt < new Date()) {
      await this.prisma.passwordResetToken.delete({
        where: { tokenHash },
      });
      return false;
    }

    if (resetToken.used) return false;

    return true;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken || !(await this.validateResetToken(token))) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { tokenHash },
        data: {
          used: true,
          usedAt: new Date(),
        },
      }),
    ]);
  }
}
