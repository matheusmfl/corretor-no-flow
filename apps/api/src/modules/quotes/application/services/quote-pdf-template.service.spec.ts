import { QuotePdfTemplateService } from './quote-pdf-template.service';

const service = new QuotePdfTemplateService();

const BASE_QUOTE = {
  insurer: 'PORTO_SEGURO' as const,
  name: 'Porto Seguro',
  extractedData: {
    vehicle: { model: 'JEEP COMPASS', yearModel: 2026 },
    driver: {},
    coverage: {
      vehicle: { fipePercentage: 100, deductible: 6205, deductibleType: 'Normal' },
    },
    deductibles: [{ item: 'Veículo', value: 6205 }],
    premium: { total: 4226.40 },
    paymentMethods: [],
  },
};

function render(coverageOverride: Record<string, unknown>) {
  return service.render({
    ...BASE_QUOTE,
    extractedData: {
      ...BASE_QUOTE.extractedData,
      coverage: {
        ...BASE_QUOTE.extractedData.coverage,
        ...coverageOverride,
      },
    },
  });
}

describe('QuotePdfTemplateService — grupos de cobertura condicionais', () => {
  describe('APP', () => {
    it('não renderiza bloco APP quando coverage.app está ausente', () => {
      const html = render({});
      expect(html).not.toContain('APP — Acidentes Pessoais');
    });

    it('não renderiza bloco APP quando coverage.app = {}', () => {
      const html = render({ app: {} });
      expect(html).not.toContain('APP — Acidentes Pessoais');
    });

    it('não renderiza bloco APP quando todos os valores são 0', () => {
      const html = render({ app: { death: 0, disability: 0, medical: 0 } });
      expect(html).not.toContain('APP — Acidentes Pessoais');
    });

    it('renderiza bloco APP quando há ao menos um valor positivo', () => {
      const html = render({ app: { death: 50000 } });
      expect(html).toContain('APP — Acidentes Pessoais');
    });

    it('renderiza bloco APP quando passengerCount está definido', () => {
      const html = render({ app: { passengerCount: 5 } });
      expect(html).toContain('APP — Acidentes Pessoais');
    });
  });

  describe('RCF', () => {
    it('não renderiza bloco RCF quando coverage.rcf está ausente', () => {
      const html = render({});
      expect(html).not.toContain('Responsabilidade Civil Facultativa');
    });

    it('não renderiza bloco RCF quando coverage.rcf = {}', () => {
      const html = render({ rcf: {} });
      expect(html).not.toContain('Responsabilidade Civil Facultativa');
    });

    it('renderiza bloco RCF quando propertyDamage está definido', () => {
      const html = render({ rcf: { propertyDamage: 100000 } });
      expect(html).toContain('Responsabilidade Civil Facultativa');
    });
  });

  describe('Assistências', () => {
    it('não renderiza bloco Assistências quando coverage.assistance está ausente', () => {
      const html = render({});
      expect(html).not.toContain('cob-group-title">Assistências');
    });

    it('não renderiza bloco Assistências quando coverage.assistance = {}', () => {
      const html = render({ assistance: {} });
      expect(html).not.toContain('cob-group-title">Assistências');
    });

    it('não renderiza bloco Assistências quando todos os campos são false', () => {
      const html = render({ assistance: { towing: false, glassProtection: false } });
      expect(html).not.toContain('cob-group-title">Assistências');
    });

    it('renderiza bloco Assistências quando towing = true', () => {
      const html = render({ assistance: { towing: true } });
      expect(html).toContain('cob-group-title">Assistências');
    });
  });
});
