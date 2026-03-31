import {
  IsNotEmpty,
  IsEmail,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum Role {
  USER = 'USER',
  DONOR = 'DONOR',
  ONG = 'ONG',
  ADMIN = 'ADMIN',
}

export class CreateDonorDto {
  // Campos do usuário
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password is too long' })
  password: string;

  // Campos do donor
  @IsNotEmpty({ message: 'CPF is required' })
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, {
    message: 'CPF must be valid: XXX.XXX.XXX-XX or only digits',
  })
  cpf: string;

  role?: Role = Role.DONOR;
}
