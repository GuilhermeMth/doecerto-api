import { 
  IsOptional, 
  IsString, 
  IsUrl, 
  IsArray, 
  IsNumber, 
  Min,
  Max,
  MaxLength 
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOngsBankAccountDto } from '../../ongs-bank-account/dto/create-ongs-bank-account.dto';
/**
 * DTO para atualização de perfil da ONG.
 * Como o perfil já nasce com a ONG, usamos este DTO para complementar
 * ou editar as informações de vitrine e causas.
 */
export class UpdateOngProfileDto {
  @IsOptional()
  @IsString({ message: 'A bio deve ser um texto' })
  @MaxLength(500, { message: 'A bio não pode exceder 500 caracteres' })
  bio?: string;

  @IsOptional()
  @IsString({ message: 'O número de contato deve ser um texto' })
  @MaxLength(20, { message: 'O número de contato é muito longo' })
  contactNumber?: string;

  @IsOptional()
  @IsString({ message: 'O endereço deve ser um texto' })
  @MaxLength(255, { message: 'O endereço é muito longo' })
  address?: string;

  @IsOptional()
  @IsUrl({}, { message: 'O websiteUrl deve ser uma URL válida' })
  websiteUrl?: string;

  /**
   * IDs das categorias (causas) que a ONG atende.
   * Ex: [1, 5, 12]
   */
  @IsOptional()
  @IsArray({ message: 'categoryIds deve ser um array' })
  @IsNumber({}, { each: true, message: 'Cada ID de categoria deve ser um número' })
  categoryIds?: number[];

  /**
   * Dados da conta bancária para criação ou atualização.
   */
  @IsOptional()
  bankAccount?: CreateOngsBankAccountDto;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'bannerCropX deve ser um número' })
  @Min(0, { message: 'bannerCropX não pode ser menor que 0' })
  @Max(100, { message: 'bannerCropX não pode ser maior que 100' })
  bannerCropX?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'bannerCropY deve ser um número' })
  @Min(0, { message: 'bannerCropY não pode ser menor que 0' })
  @Max(100, { message: 'bannerCropY não pode ser maior que 100' })
  bannerCropY?: number;
}