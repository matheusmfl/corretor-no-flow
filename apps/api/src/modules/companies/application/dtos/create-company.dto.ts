import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';
import {
  IsEnum,
  IsHexColor,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import type { CreateCompanyDto as ICreateCompanyDto } from '@corretor/types';

export class CreateCompanyDto implements ICreateCompanyDto {
  @ApiProperty({ enum: AccountType, example: AccountType.INDIVIDUAL })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiProperty({ example: 'Ramos Corretora de Seguros Ltda' })
  @IsString()
  @MinLength(3)
  legalName: string;

  @ApiPropertyOptional({ example: 'Ramos Seguros' })
  @IsOptional()
  @IsString()
  tradeName?: string;

  @ApiProperty({ example: 'Ramos Seguros', description: 'Nome exibido publicamente' })
  @IsString()
  @MinLength(2)
  displayName: string;

  @ApiProperty({ example: '12345678000190', description: 'CPF ou CNPJ sem máscara' })
  @IsString()
  @Matches(/^\d{11}$|^\d{14}$/, { message: 'Documento deve ser CPF (11 dígitos) ou CNPJ (14 dígitos) sem máscara.' })
  document: string;

  @ApiProperty({ example: '12345678', description: 'Número SUSEP do corretor' })
  @IsString()
  susepNumber: string;

  @ApiProperty({ example: '11999990000', description: 'WhatsApp com DDD, sem máscara' })
  @IsString()
  @Matches(/^\d{10,11}$/, { message: 'WhatsApp deve ter 10 ou 11 dígitos (com DDD).' })
  whatsapp: string;

  @ApiPropertyOptional({ example: 'contato@ramosseguros.com.br' })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '#3E1010', default: '#003B0F' })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  city?: string;
}
