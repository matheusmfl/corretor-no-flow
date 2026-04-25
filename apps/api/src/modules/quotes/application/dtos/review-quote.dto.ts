import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';
import type { ReviewQuoteDto as IReviewQuoteDto } from '@corretor/types';

export class ReviewQuoteDto implements IReviewQuoteDto {
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
