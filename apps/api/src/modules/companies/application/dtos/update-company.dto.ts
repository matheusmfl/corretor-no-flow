import { ApiPropertyOptional } from '@nestjs/swagger';
import { TeamSize, InsuranceProduct } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsHexColor,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
} from 'class-validator';
import type { UpdateCompanyDto as IUpdateCompanyDto } from '@corretor/types';

export class UpdateCompanyDto implements IUpdateCompanyDto {
  @ApiPropertyOptional({ example: 'Ramos Seguros' })
  @IsOptional()
  @IsString()
  tradeName?: string;

  @ApiPropertyOptional({ example: 'Ramos Seguros' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: 'Especialistas em AUTO e Residencial há 10 anos.' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'URL pública da logo (gerenciada via upload separado)' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ example: '#3E1010' })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiPropertyOptional({ example: '11999990000' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10,11}$/, { message: 'WhatsApp deve ter 10 ou 11 dígitos (com DDD).' })
  whatsapp?: string;

  @ApiPropertyOptional({ example: 'contato@ramosseguros.com.br' })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '@ramosseguros' })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional({ example: 'https://ramosseguros.com.br' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ example: '01310-100' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ example: 'Av. Paulista, 1000 — sala 12' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ example: 'Bela Vista' })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ enum: TeamSize })
  @IsOptional()
  @IsEnum(TeamSize)
  teamSize?: TeamSize;

  @ApiPropertyOptional({ enum: InsuranceProduct, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(InsuranceProduct, { each: true })
  specialties?: InsuranceProduct[];
}
