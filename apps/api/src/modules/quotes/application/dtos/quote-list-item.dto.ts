import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuoteProcessListItemDto {
  @ApiProperty() id: string;
  @ApiProperty() product: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() clientName: string | null;
  @ApiPropertyOptional() publicToken: string | null;
  @ApiPropertyOptional() openedAt: Date | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class QuoteProcessListResponseDto {
  @ApiProperty({ type: [QuoteProcessListItemDto] }) items: QuoteProcessListItemDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
}
