import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuoteProcessResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() companyId: string;
  @ApiProperty() product: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() clientName: string | null;
  @ApiPropertyOptional() clientPhone: string | null;
  @ApiPropertyOptional() publicToken: string | null;
  @ApiPropertyOptional() expiresAt: Date | null;
  @ApiPropertyOptional() openedAt: Date | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
