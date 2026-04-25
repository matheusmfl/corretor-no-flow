import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuoteResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() companyId: string;
  @ApiProperty({ enum: ['auto'] }) product: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() clientName: string | null;
  @ApiPropertyOptional() clientPhone: string | null;
  @ApiPropertyOptional() publicToken: string | null;
  @ApiPropertyOptional() publicUrl: string | null;
  @ApiPropertyOptional() expiresAt: Date | null;
  @ApiPropertyOptional({ type: Object }) extractedData: Record<string, unknown> | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
