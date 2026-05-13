import { UnprocessableEntityException } from '@nestjs/common';
import type { HealthManualTableSource, HealthMemberLife } from '@corretor/types';
import {
  findAgeBandPrice,
  HealthManualTablePricingService,
  parseAgeBandLabel,
} from './health-manual-table-pricing.service';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const UNIMED_PE_ENF: HealthManualTableSource = {
  sourceName: 'Unimed PE',
  planName: 'Unimed PE Enfermaria',
  accommodation: 'Enfermaria',
  coparticipation: 'Sem coparticipação',
  validUntil: '2026-06-30',
  reviewedByBroker: true,
  ageBandPrices: [
    { bandLabel: '0 a 18',    minAge: 0,  maxAge: 18,       pricePerLife: 210.00 },
    { bandLabel: '19 a 23',   minAge: 19, maxAge: 23,       pricePerLife: 220.00 },
    { bandLabel: '24 a 28',   minAge: 24, maxAge: 28,       pricePerLife: 255.00 },
    { bandLabel: '29 a 33',   minAge: 29, maxAge: 33,       pricePerLife: 295.00 },
    { bandLabel: '34 a 38',   minAge: 34, maxAge: 38,       pricePerLife: 355.00 },
    { bandLabel: '39 a 43',   minAge: 39, maxAge: 43,       pricePerLife: 430.00 },
    { bandLabel: '44 a 48',   minAge: 44, maxAge: 48,       pricePerLife: 530.00 },
    { bandLabel: '49 a 53',   minAge: 49, maxAge: 53,       pricePerLife: 650.00 },
    { bandLabel: '54 a 58',   minAge: 54, maxAge: 58,       pricePerLife: 815.00 },
    { bandLabel: '59 ou mais', minAge: 59, maxAge: 999, pricePerLife: 995.00 },
  ],
};

const UNIMED_PE_APT: HealthManualTableSource = {
  ...UNIMED_PE_ENF,
  planName: 'Unimed PE Apartamento',
  accommodation: 'Apartamento',
  ageBandPrices: UNIMED_PE_ENF.ageBandPrices.map((b) => ({
    ...b,
    pricePerLife: parseFloat((b.pricePerLife * 1.3).toFixed(2)),
  })),
};

const TABLE_NO_VALIDITY: HealthManualTableSource = {
  ...UNIMED_PE_ENF,
  validUntil: undefined,
  validFrom: undefined,
};

function life(age: number, source: HealthMemberLife['source'] = 'extracted'): HealthMemberLife {
  return { age, source, needsReview: source === 'inferred' };
}

// ─── parseAgeBandLabel ────────────────────────────────────────────────────────

describe('parseAgeBandLabel', () => {
  it.each([
    ['0 a 18',    { minAge: 0,  maxAge: 18  }],
    ['19 a 23',   { minAge: 19, maxAge: 23  }],
    ['54 a 58',   { minAge: 54, maxAge: 58  }],
    ['0-18',      { minAge: 0,  maxAge: 18  }],
    ['19-23',     { minAge: 19, maxAge: 23  }],
    ['ate 18',    { minAge: 0,  maxAge: 18  }],
    ['até 18',    { minAge: 0,  maxAge: 18  }],
    ['59+',       { minAge: 59, maxAge: 999 }],
    ['59 ou mais',{ minAge: 59, maxAge: 999 }],
    ['63 ou mais',{ minAge: 63, maxAge: 999 }],
  ])('parseia "%s"', (label, expected) => {
    expect(parseAgeBandLabel(label)).toEqual(expected);
  });

  it('lança para rótulo não reconhecido', () => {
    expect(() => parseAgeBandLabel('jovem')).toThrow();
  });
});

// ─── findAgeBandPrice ─────────────────────────────────────────────────────────

describe('findAgeBandPrice', () => {
  const bands = UNIMED_PE_ENF.ageBandPrices;

  it('encontra faixa exata pelo age', () => {
    expect(findAgeBandPrice(34, bands)?.pricePerLife).toBe(355.00);
    expect(findAgeBandPrice(38, bands)?.pricePerLife).toBe(355.00);
    expect(findAgeBandPrice(39, bands)?.pricePerLife).toBe(430.00);
  });

  it('retorna null para idade sem cobertura', () => {
    const bandsWithGap = [
      { bandLabel: '20 a 30', minAge: 20, maxAge: 30, pricePerLife: 300 },
    ];
    expect(findAgeBandPrice(18, bandsWithGap)).toBeNull();
  });

  it('faixa aberta superior cobre qualquer idade >= minAge até teto 999', () => {
    expect(findAgeBandPrice(59, bands)?.pricePerLife).toBe(995.00);
    expect(findAgeBandPrice(75, bands)?.pricePerLife).toBe(995.00);
    expect(findAgeBandPrice(100, bands)?.pricePerLife).toBe(995.00);
  });

  it('boundary inferior incluso', () => {
    expect(findAgeBandPrice(0, bands)?.pricePerLife).toBe(210.00);
    expect(findAgeBandPrice(19, bands)?.pricePerLife).toBe(220.00);
  });
});

// ─── HealthManualTablePricingService ─────────────────────────────────────────

describe('HealthManualTablePricingService', () => {
  const service = new HealthManualTablePricingService();

  describe('cálculo correto', () => {
    it('gera perLifePrices com lifeIndex, price e bandLabel', () => {
      const lives = [life(34), life(41), life(9)];
      const option = service.applyTable(UNIMED_PE_ENF, lives);

      expect(option.perLifePrices).toHaveLength(3);
      expect(option.perLifePrices![0]).toMatchObject({ lifeIndex: 0, price: 355.00, bandLabel: '34 a 38' });
      expect(option.perLifePrices![1]).toMatchObject({ lifeIndex: 1, price: 430.00, bandLabel: '39 a 43' });
      expect(option.perLifePrices![2]).toMatchObject({ lifeIndex: 2, price: 210.00, bandLabel: '0 a 18' });
    });

    it('monthlyTotal é a soma exata dos perLifePrices', () => {
      const lives = [life(34), life(41), life(9)];
      const option = service.applyTable(UNIMED_PE_ENF, lives);

      const expected = 355.00 + 430.00 + 210.00;
      expect(option.monthlyTotal).toBeCloseTo(expected, 2);
    });

    it('vida sem nome mas com age é precificada normalmente', () => {
      const lives = [{ age: 36, source: 'inferred' as const, needsReview: true }];
      const option = service.applyTable(UNIMED_PE_ENF, lives);

      expect(option.perLifePrices![0].price).toBe(355.00);
    });

    it('vida manual confirmada pela corretora é precificada normalmente', () => {
      const lives = [{ age: 42, name: 'João', source: 'manual' as const, needsReview: false }];
      const option = service.applyTable(UNIMED_PE_ENF, lives);

      expect(option.perLifePrices![0].price).toBe(430.00);
    });

    it('tabela apartamento gera preços distintos da enfermaria', () => {
      const lives = [life(34)];
      const optEnf = service.applyTable(UNIMED_PE_ENF, lives);
      const optApt = service.applyTable(UNIMED_PE_APT, lives);

      expect(optApt.monthlyTotal).toBeGreaterThan(optEnf.monthlyTotal!);
    });

    it('faixa aberta (59 ou mais) é coberta', () => {
      const lives = [life(62), life(80)];
      const option = service.applyTable(UNIMED_PE_ENF, lives);

      option.perLifePrices!.forEach((p) => expect(p.price).toBe(995.00));
    });
  });

  describe('campos da opção gerada', () => {
    it('sourceType é manual_table', () => {
      expect(service.applyTable(UNIMED_PE_ENF, [life(34)]).sourceType).toBe('manual_table');
    });

    it('accommodation vem da tabela com source table_lookup', () => {
      const option = service.applyTable(UNIMED_PE_ENF, [life(34)]);

      expect(option.accommodation.value).toBe('Enfermaria');
      expect(option.accommodation.source).toBe('table_lookup');
      expect(option.accommodation.needsReview).toBe(false);
    });

    it('coparticipation vem da tabela com source table_lookup', () => {
      const option = service.applyTable(UNIMED_PE_ENF, [life(34)]);

      expect(option.coparticipation.value).toBe('Sem coparticipação');
      expect(option.coparticipation.source).toBe('table_lookup');
    });

    it('validUntil vem da tabela com source table_lookup', () => {
      const option = service.applyTable(UNIMED_PE_ENF, [life(34)]);

      expect(option.validUntil.value).toBe('2026-06-30');
      expect(option.validUntil.source).toBe('table_lookup');
      expect(option.validUntil.needsReview).toBe(false);
    });

    it('campo ausente na tabela vira not_found com needsReview true', () => {
      const tableNoAccommodation: HealthManualTableSource = { ...UNIMED_PE_ENF, accommodation: undefined };
      const option = service.applyTable(tableNoAccommodation, [life(34)]);

      expect(option.accommodation.value).toBeNull();
      expect(option.accommodation.source).toBe('not_found');
      expect(option.accommodation.needsReview).toBe(true);
    });

    it('ageBandPrices da opção vem da tabela', () => {
      const option = service.applyTable(UNIMED_PE_ENF, [life(34)]);

      expect(option.ageBandPrices).toHaveLength(UNIMED_PE_ENF.ageBandPrices.length);
    });

    // P2 — region
    it('copia region da tabela para a opção quando presente', () => {
      const tableWithRegion: HealthManualTableSource = { ...UNIMED_PE_ENF, region: 'PE' };
      const option = service.applyTable(tableWithRegion, [life(34)]);

      expect(option.region).toBe('PE');
    });

    it('não define region na opção quando tabela não tem region', () => {
      const option = service.applyTable(UNIMED_PE_ENF, [life(34)]);

      expect(option.region).toBeUndefined();
    });

    // P1 — maxAge não deve ser Infinity (não serializável em JSON)
    it('ageBandPrices da opção não contém maxAge Infinity', () => {
      const option = service.applyTable(UNIMED_PE_ENF, [life(62)]);

      option.ageBandPrices!.forEach((b) => {
        expect(isFinite(b.maxAge)).toBe(true);
        expect(JSON.stringify(b)).not.toContain('null');
      });
    });
  });

  describe('tabela sem validade', () => {
    it('validUntil é not_found quando tabela não tem validUntil', () => {
      const option = service.applyTable(TABLE_NO_VALIDITY, [life(34)]);

      expect(option.validUntil.value).toBeNull();
      expect(option.validUntil.source).toBe('not_found');
      expect(option.validUntil.needsReview).toBe(true);
    });

    it('adiciona warning quando tabela não tem validUntil', () => {
      const option = service.applyTable(TABLE_NO_VALIDITY, [life(34)]);

      expect(option.warnings?.some((w) => /validade/i.test(w))).toBe(true);
    });
  });

  describe('erros', () => {
    it('lança UnprocessableEntityException quando idade não tem faixa', () => {
      const tablePartial: HealthManualTableSource = {
        ...UNIMED_PE_ENF,
        ageBandPrices: [{ bandLabel: '20 a 30', minAge: 20, maxAge: 30, pricePerLife: 300 }],
      };
      expect(() => service.applyTable(tablePartial, [life(15)])).toThrow(UnprocessableEntityException);
    });

    it('mensagem de erro identifica a idade sem cobertura', () => {
      const tablePartial: HealthManualTableSource = {
        ...UNIMED_PE_ENF,
        ageBandPrices: [{ bandLabel: '20 a 30', minAge: 20, maxAge: 30, pricePerLife: 300 }],
      };
      expect(() => service.applyTable(tablePartial, [life(15)])).toThrow(/15/);
    });
  });
});
