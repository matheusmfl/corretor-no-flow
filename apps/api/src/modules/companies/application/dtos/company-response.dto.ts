import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ description: 'Slug único usado na URL pública: /c/{slug}' }) slug: string;
  @ApiPropertyOptional() cnpj: string | null;
  @ApiPropertyOptional() phone: string | null;
  @ApiPropertyOptional() logoUrl: string | null;
  @ApiProperty() primaryColor: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
