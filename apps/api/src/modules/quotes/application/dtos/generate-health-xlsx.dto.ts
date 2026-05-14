import { Allow, IsBoolean, IsOptional } from 'class-validator';

export class GenerateHealthXlsxDto {
  @Allow()
  draft: unknown;

  @IsBoolean()
  @IsOptional()
  forceGenerate?: boolean;
}
