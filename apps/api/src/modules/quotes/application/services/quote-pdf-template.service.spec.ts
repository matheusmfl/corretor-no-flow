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

    it('renderiza bloco Assistências com badge "Detalhes" e "Não contratado" quando todos são false (anyKnown)', () => {
      const html = render({ assistance: { towing: false, glassProtection: false } });
      expect(html).toContain('cob-group-title">Assistências');
      expect(html).toContain('Não contratado');
      expect(html).toContain('cob-group-badge">Detalhes');
      expect(html).not.toContain('cob-group-badge">Contratado');
    });

    it('renderiza bloco Assistências com badge "Contratado" quando towing = true', () => {
      const html = render({ assistance: { towing: true } });
      expect(html).toContain('cob-group-title">Assistências');
      expect(html).toContain('cob-group-badge">Contratado');
    });
  });

  describe('Cobertura do Veículo (casco / FIPE)', () => {
    it('renderiza quando há fipePercentage no payload (layout padrão)', () => {
      const html = render({});
      expect(html).toContain('Cobertura do Veículo');
      expect(html).toContain('100%');
      expect(html).toContain('do valor da tabela FIPE está coberto');
    });

    it('não renderiza quando coverage.vehicle está ausente (ex.: Assistência 24h sem casco)', () => {
      const html = service.render({
        insurer: 'ITAU',
        name:    'Itaú',
        extractedData: {
          vehicle: { model: 'JEEP COMPASS' },
          driver:  {},
          coverage: {
            app:        { death: 5000, passengerCount: 5 },
            assistance: { towing: true },
          },
          deductibles:    [],
          premium:        { total: 457.95 },
          paymentMethods: [],
        },
      });
      expect(html).not.toContain('Cobertura do Veículo');
      expect(html).not.toContain('do valor da tabela FIPE está coberto');
    });

    it('não renderiza quando vehicle existe mas fipePercentage ausente (evita “—% FIPE”)', () => {
      const html = service.render({
        insurer: 'ITAU',
        name:    'Itaú',
        extractedData: {
          vehicle: { model: 'JEEP COMPASS' },
          driver:  {},
          coverage: {
            vehicle: { deductible: 6516, deductibleType: '50% da Obrigatória' },
            rcf:     { propertyDamage: 100_000 },
          },
          deductibles:    [],
          premium:        { total: 4095.25 },
          paymentMethods: [],
        },
      });
      expect(html).not.toContain('Cobertura do Veículo');
    });
  });
});

describe('QuotePdfTemplateService — Tokio Marine enriquecido', () => {
  const TOKIO_BASE = {
    insurer: 'TOKIO_MARINE' as const,
    name: 'Tokio Marine Auto',
    extractedData: {
      vehicle: { model: 'VOLKSWAGEN GOL 2014', plate: 'OKB-0A62' },
      driver: {},
      insurer: 'Tokio Marine',
      segment: 'Auto',
      coverage: {
        vehicle: { fipePercentage: 100, deductible: 2582 },
        rcf: { propertyDamage: 50000, bodilyInjury: 50000 },
        app: { death: 5000, disability: 5000, passengerCount: 5 },
        assistance: {
          towing: true,
          glassProtection: true,
          replacementVehicle: true,
          replacementDays: 15,
        },
      },
      coverageDetails: {
        assistance: { planName: 'Completa', towingKmBase: 200, towingKmAdditional: 100, towingKmTotal: 300 },
        glass: { tier: 'Completo' },
        replacementVehicle: { category: 'Básico (Mecânico)' },
        services: { martelinho: true, latariaEPintura: true, rodaPneuSuspensao: true, logoMarcaVidros: false },
        repair: { shopType: 'Livre Escolha', partsType: 'Novas originais' },
      },
      deductibles: [],
      premium: { total: 3675.43 },
      paymentMethods: [],
    },
  };

  it('exibe km total de reboque (300 km)', () => {
    const html = service.render(TOKIO_BASE);
    expect(html).toContain('300 km');
  });

  it('exibe plano de assistência (Completa)', () => {
    const html = service.render(TOKIO_BASE);
    expect(html).toContain('Completa');
  });

  it('exibe tier de vidros (Completo) em vez de "Incluso"', () => {
    const html = service.render(TOKIO_BASE);
    expect(html).toContain('Completo');
  });

  it('exibe dias e categoria do carro reserva (15 dias · Básico (Mecânico))', () => {
    const html = service.render(TOKIO_BASE);
    expect(html).toContain('15 dias');
    expect(html).toContain('Básico (Mecânico)');
  });

  it('exibe martelinho e para-choque como contratado', () => {
    const html = service.render(TOKIO_BASE);
    expect(html).toContain('Martelinho');
  });

  it('exibe lataria e pintura como contratado', () => {
    const html = service.render(TOKIO_BASE);
    expect(html).toContain('Lataria');
  });

  it('exibe roda, pneu e suspensão como contratado', () => {
    const html = service.render(TOKIO_BASE);
    expect(html).toContain('Roda');
  });

  it('exibe logomarca (vidros) como não contratado', () => {
    const html = service.render(TOKIO_BASE);
    expect(html).toContain('Logomarca');
    expect(html).toContain('Não contratado');
  });

  it('exibe tipo de oficina (Livre Escolha)', () => {
    const html = service.render(TOKIO_BASE);
    expect(html).toContain('Livre Escolha');
  });

  it('exibe tipo de peça (Novas originais)', () => {
    const html = service.render(TOKIO_BASE);
    expect(html).toContain('Novas originais');
  });

  it('Proteção Mensal: vidro not_contracted mostra "Não contratado"', () => {
    const html = service.render({
      insurer: 'TOKIO_MARINE' as const,
      name: 'Proteção Mensal',
      extractedData: {
        ...TOKIO_BASE.extractedData,
        segment: 'Auto Proteção Mensal',
        coverage: {
          vehicle: { fipePercentage: 90 },
          assistance: {
            towing: true,
            glassProtection: false,
            replacementVehicle: false,
          },
        },
        coverageDetails: {
          glass: { tier: 'Não possui' },
        },
      },
    });
    expect(html).toContain('Não contratado');
  });

  it('não há elemento inline class="cob-note" antigo no PDF (substituído por cob-notes externo)', () => {
    const html = service.render(TOKIO_BASE);
    // '"cob-note"' sem 's' no final — garante que a classe antiga não está presente
    expect(html).not.toContain('"cob-note"');
  });

  it('marcador de rodapé (cob-fn) presente quando planName+km estão disponíveis', () => {
    const html = service.render(TOKIO_BASE);
    expect(html).toContain('cob-fn');
  });

  it('notas ficam em área <div class="cob-notes"> fora dos cob-groups de coberturas', () => {
    const html = service.render(TOKIO_BASE);
    // Verifica presença do elemento HTML (não só do seletor CSS)
    expect(html).toContain('<div class="cob-notes">');
    // Notas devem aparecer DEPOIS do último row de Assistências (Veículo Reserva)
    const lastAssistRow = html.lastIndexOf('Veículo Reserva');
    const notesDiv = html.indexOf('<div class="cob-notes">');
    expect(notesDiv).toBeGreaterThan(lastAssistRow);
  });

  it('área de notas tem label "Notas"', () => {
    const html = service.render(TOKIO_BASE);
    expect(html).toContain('cob-notes-label');
    expect(html).toContain('Notas');
  });

  it('rodapé contém breakdown de km (200 padrão + 100 adicional = 300)', () => {
    const html = service.render(TOKIO_BASE);
    expect(html).toContain('200 km padrão');
    expect(html).toContain('100 km adicional');
    expect(html).toContain('totalizando 300 km');
  });

  it('rodapé não exibe texto literal "200 km de reboque" que causava contradição', () => {
    const html = service.render(TOKIO_BASE);
    expect(html).not.toContain('200 km de reboque com possibilidade');
  });

  it('Tokio Marine usa cor verde institucional (não vermelho)', () => {
    const html = service.render(TOKIO_BASE);
    expect(html).toContain('#005C35');
    expect(html).not.toContain('#d4001a');
  });

  it('campo ausente (not_found) não aparece no HTML de serviços', () => {
    const html = service.render({
      insurer: 'TOKIO_MARINE' as const,
      name: 'Tokio sem serviços',
      extractedData: {
        ...TOKIO_BASE.extractedData,
        coverage: {
          vehicle: { fipePercentage: 100 },
          assistance: { towing: true },
        },
        coverageDetails: undefined, // sem enrichment → serviços not_found → não aparecem
      },
    });
    // martelinho não extraído → not_found → não aparece no HTML
    expect(html).not.toContain('Martelinho');
    expect(html).not.toContain('Lataria');
  });
});

describe('QuotePdfTemplateService — franquia principal', () => {
  function renderVehicle(vehicleOverride: Record<string, unknown>) {
    return service.render({
      ...BASE_QUOTE,
      extractedData: {
        ...BASE_QUOTE.extractedData,
        coverage: {
          vehicle: { ...BASE_QUOTE.extractedData.coverage.vehicle, ...vehicleOverride },
        },
      },
    });
  }

  it('exibe label "Franquia principal" sem parênteses quando deductibleType é Compreensiva', () => {
    const html = renderVehicle({ deductible: 6205, deductibleType: 'Compreensiva' });
    expect(html).toContain('Franquia principal');
    expect(html).not.toContain('Compreensiva');
  });

  it('exibe label "Franquia principal" sem parênteses quando deductibleType é compreensiva (lowercase)', () => {
    const html = renderVehicle({ deductible: 6205, deductibleType: 'compreensiva' });
    expect(html).not.toContain('compreensiva');
  });

  it('exibe valor da franquia mesmo quando deductibleType é não confiável', () => {
    const html = renderVehicle({ deductible: 6205, deductibleType: 'Compreensiva' });
    expect(html).toContain('6.205');
  });

  it('exibe deductibleType confiável entre parênteses', () => {
    const html = renderVehicle({ deductible: 4000, deductibleType: 'Reduzida' });
    expect(html).toContain('Reduzida');
    expect(html).toContain('4.000');
  });

  it('exibe deductibleType "Normal" entre parênteses', () => {
    const html = renderVehicle({ deductible: 5000, deductibleType: 'Normal' });
    expect(html).toContain('Normal');
  });

  it('exibe label sem parênteses quando deductibleType está ausente', () => {
    const html = renderVehicle({ deductible: 3000, deductibleType: undefined });
    expect(html).toContain('Franquia principal');
    // label não deve conter parênteses com tipo de franquia
    expect(html).not.toMatch(/Franquia principal.*\(/);
  });
});
