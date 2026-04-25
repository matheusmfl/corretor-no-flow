import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class UploadQuoteDto {
  @ApiProperty({ enum: ['AUTO'], description: 'Tipo de produto da cotação' })
  @IsString()
  @IsIn(['AUTO'])
  product: string;

  @ApiPropertyOptional({ description: 'Nome do cliente (preenchido manualmente ou extraído)' })
  @IsOptional()
  @IsString()
  clientName?: string;
}
