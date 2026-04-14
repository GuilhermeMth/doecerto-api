import {
  IsOptional,
  IsString,
  IsUrl,
  IsArray,
  IsNumber,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CreateOngsBankAccountDto } from '../../ongs-bank-account/dto/create-ongs-bank-account.dto';
/**
 * DTO para atualização de perfil da ONG.
 * Como o perfil já nasce com a ONG, usamos este DTO para complementar
 * ou editar as informações de vitrine e causas.
 */
export class UpdateOngProfileDto {
  @IsOptional()
  @IsString({ message: 'A description deve ser um texto' })
  @MaxLength(500, { message: 'A description não pode exceder 500 caracteres' })
  description?: string;

  @IsOptional()
  @IsInt({ message: 'yearsOfOperation deve ser um número inteiro' })
  @Min(0, { message: 'yearsOfOperation não pode ser negativo' })
  yearsOfOperation?: number;

  @IsOptional()
  @IsString({ message: 'O número de contato deve ser um texto' })
  @MaxLength(20, { message: 'O número de contato é muito longo' })
  contactNumber?: string;

  @IsOptional()
  @IsString({ message: 'O endereço deve ser um texto' })
  @MaxLength(255, { message: 'O endereço é muito longo' })
  address?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (Array.isArray(value)) return value;

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return undefined;

      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          return [trimmed];
        }
      }

      if (trimmed.includes(',')) {
        return trimmed
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }

      return [trimmed];
    }

    return value;
  })
  @IsArray({ message: 'website deve ser um array de URLs' })
  @IsUrl({}, { each: true, message: 'Cada website deve ser uma URL válida' })
  website?: string[];

  /**
   * IDs das categorias (causas) que a ONG atende.
   * Ex: [1, 5, 12]
   */
  @IsOptional()
  @IsArray({ message: 'categoryIds deve ser um array' })
  @IsNumber(
    {},
    { each: true, message: 'Cada ID de categoria deve ser um número' },
  )
  categoryIds?: number[];

  /**
   * Dados da conta bancária para criação ou atualização.
   */
  @IsOptional()
  bankAccount?: CreateOngsBankAccountDto;
}
