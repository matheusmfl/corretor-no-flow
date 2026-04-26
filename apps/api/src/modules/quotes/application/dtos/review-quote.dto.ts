import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';
import type { ReviewQuoteDto as IReviewQuoteDto } from '@corretor/types';

export class ReviewQuoteDto implements IReviewQuoteDto {
  @ApiPropertyOptional({ description: 'Nome editado da cotação' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Dados extraídos corrigidos pelo corretor' })
  @IsOptional()
  @IsObject()
  extractedData?: Record<string, unknown>;
}
