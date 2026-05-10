import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class SelectQuotesDto {
  @ApiPropertyOptional({ type: [String], description: 'IDs das cotações a incluir no material final' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  quoteIds?: string[];
}
