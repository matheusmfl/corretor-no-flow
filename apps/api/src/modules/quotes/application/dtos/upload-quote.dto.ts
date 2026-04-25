import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InsuranceProduct } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { UploadQuoteDto as IUploadQuoteDto } from '@corretor/types';

export class UploadQuoteDto implements IUploadQuoteDto {
  @ApiProperty({ enum: InsuranceProduct, description: 'Tipo de produto da cotação' })
  @IsEnum(InsuranceProduct)
  product: InsuranceProduct;

  @ApiPropertyOptional({ description: 'Nome do cliente (preenchido manualmente ou extraído)' })
  @IsOptional()
  @IsString()
  clientName?: string;
}
