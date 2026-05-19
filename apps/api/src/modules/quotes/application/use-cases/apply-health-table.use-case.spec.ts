import { UnprocessableEntityException } from '@nestjs/common';
import type { HealthManualTableSource, HealthMemberLife } from '@corretor/types';
import { ApplyHealthTableUseCase } from './apply-health-table.use-case';
import { HealthManualTablePricingService } from '../services/health-manual-table-pricing.service';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TABLE: HealthManualTableSource = {
  sourceName: 'Unimed PE',
  planName: 'Enfermaria',
  accommodation: 'Enfermaria',
  coparticipation: 'Sem coparticipação',
  validUntil: '2026-06-30',
  reviewedByBroker: false,
  ageBandPrices: [
    { bandLabel: '0 a 18',  minAge: 0,  maxAge: 18,  pricePerLife: 210 },
    { bandLabel: '19 a 23', minAge: 19, maxAge: 23,  pricePerLife: 250 },
    { bandLabel: '34 a 38', minAge: 34, maxAge: 38,  pricePerLife: 355 },
    { bandLabel: '39 a 43', minAge: 39, maxAge: 43,  pricePerLife: 430 },
  ],
};

const LIVES: HealthMemberLife[] = [
  { age: 34, name: 'Ana Souza', source: 'extracted', needsReview: false },
  { age: 41, source: 'manual',  needsReview: false },
  { age: 9,  name: 'Lucas',     source: 'extracted', needsReview: false },
];

// ─── ApplyHealthTableUseCase ──────────────────────────────────────────────────

describe('ApplyHealthTableUseCase', () => {
  let useCase: ApplyHealthTableUseCase;

  beforeEach(() => {
    useCase = new ApplyHealthTableUseCase(new HealthManualTablePricingService());
  });

  it('retorna HealthQuoteOption com preços por vida', () => {
    const option = useCase.execute(TABLE, LIVES);
    expect(option.perLifePrices).toHaveLength(3);
    expect(option.perLifePrices![0].price).toBe(355);  // Ana, 34
    expect(option.perLifePrices![1].price).toBe(430);  // vida 41
    expect(option.perLifePrices![2].price).toBe(210);  // Lucas, 9
  });

  it('calcula monthlyTotal corretamente', () => {
    const option = useCase.execute(TABLE, LIVES);
    expect(option.monthlyTotal).toBeCloseTo(995, 2);
  });

  it('retorna sourceType manual_table', () => {
    const option = useCase.execute(TABLE, LIVES);
    expect(option.sourceType).toBe('manual_table');
  });

  it('propaga UnprocessableEntityException quando idade não coberta', () => {
    const livesWithUncovered: HealthMemberLife[] = [
      { age: 70, source: 'extracted', needsReview: false },
    ];
    expect(() => useCase.execute(TABLE, livesWithUncovered)).toThrow(UnprocessableEntityException);
  });
});
