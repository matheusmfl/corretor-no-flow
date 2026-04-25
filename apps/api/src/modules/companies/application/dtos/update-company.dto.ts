import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsUrl } from 'class-validator';
import { CreateCompanyDto } from './create-company.dto';

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {
  @ApiPropertyOptional({ description: 'URL pública da logo (gerenciada via upload separado)' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;
}
