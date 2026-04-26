import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InsuranceProduct, Insurer } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import type { CreateQuoteProcessDto as ICreateQuoteProcessDto } from '@corretor/types';

export class CreateQuoteProcessDto implements ICreateQuoteProcessDto {
  @ApiProperty({ enum: InsuranceProduct, description: 'Ramo da cotação' })
  @IsEnum(InsuranceProduct)
  product: InsuranceProduct;

  @ApiProperty({ enum: Insurer, isArray: true, description: 'Seguradoras selecionadas' })
  @IsArray()
  @IsEnum(Insurer, { each: true })
  insurers: Insurer[];

  @ApiPropertyOptional({ description: 'Nome do cliente' })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional({ description: 'Telefone do cliente' })
  @IsOptional()
  @IsString()
  clientPhone?: string;
}
