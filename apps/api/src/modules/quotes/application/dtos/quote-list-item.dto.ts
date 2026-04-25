import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuoteListItemDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: ['auto'] }) product: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() clientName: string | null;
  @ApiPropertyOptional() publicToken: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class QuoteListResponseDto {
  @ApiProperty({ type: [QuoteListItemDto] }) items: QuoteListItemDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
}
