import { ApiProperty } from '@nestjs/swagger';
import type { PublicProcessResponse, PublicQuoteItem, PublicCompany } from '@corretor/types';

class PublicProcessDto {
  @ApiProperty() id: string;
  @ApiProperty() product: string;
  @ApiProperty({ nullable: true }) clientName: string | null;
  @ApiProperty() expiresAt: string;
}

class PublicQuoteDto implements PublicQuoteItem {
  @ApiProperty() id: string;
  @ApiProperty() insurer: string;
  @ApiProperty({ nullable: true }) name: string | null;
  @ApiProperty({ nullable: true }) extractedData: Record<string, unknown> | null;
}

class PublicCompanyDto implements PublicCompany {
  @ApiProperty() displayName: string;
  @ApiProperty() slug: string;
  @ApiProperty({ nullable: true }) logoUrl: string | null;
  @ApiProperty() primaryColor: string;
  @ApiProperty() whatsapp: string;
  @ApiProperty({ nullable: true }) bio: string | null;
  @ApiProperty({ nullable: true }) contactEmail: string | null;
  @ApiProperty({ nullable: true }) instagram: string | null;
  @ApiProperty({ nullable: true }) website: string | null;
  @ApiProperty({ nullable: true }) city: string | null;
  @ApiProperty({ nullable: true }) state: string | null;
  @ApiProperty({ nullable: true }) street: string | null;
  @ApiProperty({ nullable: true }) neighborhood: string | null;
  @ApiProperty({ nullable: true }) zipCode: string | null;
}

export class PublicProcessResponseDto implements PublicProcessResponse {
  @ApiProperty({ type: PublicProcessDto }) process: PublicProcessDto;
  @ApiProperty({ type: [PublicQuoteDto] }) quotes: PublicQuoteDto[];
  @ApiProperty({ type: PublicCompanyDto }) company: PublicCompanyDto;
}
