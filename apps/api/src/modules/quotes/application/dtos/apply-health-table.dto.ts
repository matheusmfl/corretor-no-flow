import { Allow } from 'class-validator';

export class ApplyHealthTableDto {
  @Allow()
  table: unknown;

  @Allow()
  lives: unknown;
}
