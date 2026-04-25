import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class ReviewQuoteDto {
  @ApiPropertyOptional({ description: 'Dados extraídos corrigidos pelo corretor' })
  @IsOptional()
  @IsObject()
  extractedData?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientPhone?: string;
}
