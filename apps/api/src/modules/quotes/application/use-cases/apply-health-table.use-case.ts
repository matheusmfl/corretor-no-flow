import { Injectable } from '@nestjs/common';
import type { HealthManualTableSource, HealthMemberLife, HealthQuoteOption } from '@corretor/types';
import { HealthManualTablePricingService } from '../services/health-manual-table-pricing.service';

@Injectable()
export class ApplyHealthTableUseCase {
  constructor(private readonly pricing: HealthManualTablePricingService) {}

  execute(table: HealthManualTableSource, lives: HealthMemberLife[]): HealthQuoteOption {
    return this.pricing.applyTable(table, lives);
  }
}
