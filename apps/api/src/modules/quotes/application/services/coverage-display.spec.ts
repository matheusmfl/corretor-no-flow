import type { AutoQuoteData } from '@corretor/types';
import { buildCoverageDisplay } from './coverage-display';

function makeData(overrides: Partial<AutoQuoteData> = {}): AutoQuoteData {
  return {
    vehicle: { model: 'Ford Ka 2020' },
    driver: {},
    insurer: 'TOKIO_MARINE',
    coverage: {},
    deductibles: [],
    premium: { total: 3000 },
    paymentMethods: [],
    ...overrides,
  };
}

// ── Tokio Assistência Exclusiva: sem casco, sem rcf, sem app ─────────────────
describe('buildCoverageDisplay — Assistência Exclusiva (sem casco)', () => {
  let display: ReturnType<typeof buildCoverageDisplay>;

  beforeAll(() => {
    display = buildCoverageDisplay(
      makeData({
        segment: 'ASSISTÊNCIA EXCLUSIVA',
        coverage: {
          assistance: {
            towing: true,
            glassProtection: true,
            replacementVehicle: true,
            replacementDays: 6,
          },
        },
      }),
    );
  });

  it('vehicle = not_applicable', () => expect(display.vehicle.status).toBe('not_applicable'));
  it('rcf = not_applicable', () => expect(display.rcf.status).toBe('not_applicable'));
  it('app = not_applicable', () => expect(display.app.status).toBe('not_applicable'));
  it('towing = contracted', () => expect(display.towing.status).toBe('contracted'));
  it('glass = contracted', () => expect(display.glass.status).toBe('contracted'));
  it('replacementVehicle = contracted com 6 dias', () => {
    expect(display.replacementVehicle.status).toBe('contracted');
    expect(display.replacementVehicle.days).toBe(6);
  });
  it('martelinho = not_found (não extraído)', () => {
    expect(display.martelinho.status).toBe('not_found');
  });
});

// ── Tokio Auto: casco 100% FIPE, rcf, app ────────────────────────────────────
describe('buildCoverageDisplay — Auto (casco 100% FIPE)', () => {
  let display: ReturnType<typeof buildCoverageDisplay>;

  beforeAll(() => {
    display = buildCoverageDisplay(
      makeData({
        segment: 'AUTO',
        coverage: {
          vehicle: { fipePercentage: 100, deductible: 3000, deductibleType: 'Normal' },
          rcf: { propertyDamage: 50000, bodilyInjury: 50000 },
          app: { death: 10000, disability: 10000, passengerCount: 5 },
          assistance: { towing: true, replacementVehicle: true, replacementDays: 15 },
        },
      }),
    );
  });

  it('vehicle = contracted', () => expect(display.vehicle.status).toBe('contracted'));
  it('vehicle.fipePercentage = 100', () => expect(display.vehicle.fipePercentage).toBe(100));
  it('vehicle.deductible = 3000', () => expect(display.vehicle.deductible).toBe(3000));
  it('vehicle.deductibleType = Normal', () => expect(display.vehicle.deductibleType).toBe('Normal'));
  it('rcf = contracted', () => expect(display.rcf.status).toBe('contracted'));
  it('rcf.propertyDamage = 50000', () => expect(display.rcf.propertyDamage).toBe(50000));
  it('app = contracted', () => expect(display.app.status).toBe('contracted'));
  it('app.death = 10000', () => expect(display.app.death).toBe(10000));
  it('app.passengerCount = 5', () => expect(display.app.passengerCount).toBe(5));
  it('towing = contracted', () => expect(display.towing.status).toBe('contracted'));
  it('replacementVehicle = contracted com 15 dias', () => {
    expect(display.replacementVehicle.status).toBe('contracted');
    expect(display.replacementVehicle.days).toBe(15);
  });
  it('glass = not_found (não extraído)', () => expect(display.glass.status).toBe('not_found'));
});

// ── Tokio Auto Proteção Mensal: casco 90% FIPE, sem vidros/reserva ───────────
describe('buildCoverageDisplay — Auto Proteção Mensal (casco 90% FIPE, coberturas reduzidas)', () => {
  let display: ReturnType<typeof buildCoverageDisplay>;

  beforeAll(() => {
    display = buildCoverageDisplay(
      makeData({
        segment: 'AUTO PROTEÇÃO MENSAL',
        coverage: {
          vehicle: { fipePercentage: 90, deductible: 2500, deductibleType: 'Franquia' },
          rcf: { propertyDamage: 25000 },
          assistance: { towing: true, glassProtection: false, replacementVehicle: false },
        },
      }),
    );
  });

  it('vehicle = contracted', () => expect(display.vehicle.status).toBe('contracted'));
  it('vehicle.fipePercentage = 90', () => expect(display.vehicle.fipePercentage).toBe(90));
  it('rcf = contracted', () => expect(display.rcf.status).toBe('contracted'));
  it('glass = not_contracted (explicitamente false)', () => {
    expect(display.glass.status).toBe('not_contracted');
  });
  it('replacementVehicle = not_contracted', () => {
    expect(display.replacementVehicle.status).toBe('not_contracted');
  });
  it('replacementVehicle.days = undefined', () => {
    expect(display.replacementVehicle.days).toBeUndefined();
  });
});

// ── Semântica de undefined vs false ──────────────────────────────────────────
describe('buildCoverageDisplay — semântica undefined vs false', () => {
  it('towing undefined → not_found', () => {
    const d = makeData({ coverage: { vehicle: { fipePercentage: 100 }, assistance: {} } });
    expect(buildCoverageDisplay(d).towing.status).toBe('not_found');
  });

  it('towing false → not_contracted', () => {
    const d = makeData({
      coverage: { vehicle: { fipePercentage: 100 }, assistance: { towing: false } },
    });
    expect(buildCoverageDisplay(d).towing.status).toBe('not_contracted');
  });

  it('vehicle undefined sem segment exclusivo → not_found', () => {
    const d = makeData({ coverage: {} });
    expect(buildCoverageDisplay(d).vehicle.status).toBe('not_found');
  });

  it('rcf undefined em produto com casco → not_found', () => {
    const d = makeData({ coverage: { vehicle: { fipePercentage: 100 } } });
    expect(buildCoverageDisplay(d).rcf.status).toBe('not_found');
  });

  it('app undefined em produto com casco → not_found', () => {
    const d = makeData({ coverage: { vehicle: { fipePercentage: 100 } } });
    expect(buildCoverageDisplay(d).app.status).toBe('not_found');
  });
});

// ── Tokio Auto Roubo + Rastreador: só roubo/incêndio, sem cobertura compreensiva ─
describe('buildCoverageDisplay — Auto Roubo + Rastreador (apenas roubo/incêndio)', () => {
  let display: ReturnType<typeof buildCoverageDisplay>;

  beforeAll(() => {
    display = buildCoverageDisplay(
      makeData({
        segment: 'AUTO ROUBO + RASTREADOR',
        coverage: {
          vehicle: { fipePercentage: 100, deductible: 0 },
          rcf: { propertyDamage: 50000 },
          assistance: { towing: true, glassProtection: false, replacementVehicle: false },
        },
      }),
    );
  });

  it('vehicle = contracted (casco parcial — roubo/incêndio extraído)', () => {
    expect(display.vehicle.status).toBe('contracted');
  });
  it('glass = not_contracted', () => expect(display.glass.status).toBe('not_contracted'));
  it('replacementVehicle = not_contracted', () => {
    expect(display.replacementVehicle.status).toBe('not_contracted');
  });
});

// ── Bradesco: sem segment, com casco + vidros ────────────────────────────────
describe('buildCoverageDisplay — Bradesco (sem segment, casco + vidros)', () => {
  let display: ReturnType<typeof buildCoverageDisplay>;

  beforeAll(() => {
    display = buildCoverageDisplay(
      makeData({
        insurer: 'BRADESCO',
        segment: undefined,
        coverage: {
          vehicle: { fipePercentage: 100, deductible: 3500, deductibleType: 'Reduzida' },
          rcf: { propertyDamage: 100000, bodilyInjury: 100000, moralDamages: 10000 },
          app: { death: 20000, disability: 20000 },
          assistance: {
            towing: true,
            glassProtection: true,
            replacementVehicle: true,
            replacementDays: 10,
          },
        },
      }),
    );
  });

  it('vehicle = contracted', () => expect(display.vehicle.status).toBe('contracted'));
  it('rcf.moralDamages = 10000', () => expect(display.rcf.moralDamages).toBe(10000));
  it('glass = contracted', () => expect(display.glass.status).toBe('contracted'));
  it('replacementVehicle.days = 10', () => expect(display.replacementVehicle.days).toBe(10));
  it('martelinho = not_found (não extraído para Bradesco ainda)', () => {
    expect(display.martelinho.status).toBe('not_found');
  });
  it('Bradesco sem glassTier → glass.tooltip = undefined', () => {
    expect(display.glass.tooltip).toBeUndefined();
  });
});

// ── Tokio Auto: serviços enriquecidos (referência positiva) ──────────────────
describe('buildCoverageDisplay — Tokio Auto enriquecido (referência positiva)', () => {
  let display: ReturnType<typeof buildCoverageDisplay>;

  beforeAll(() => {
    display = buildCoverageDisplay(
      makeData({
        insurer: 'TOKIO_MARINE',
        segment: 'AUTO',
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
      }),
    );
  });

  it('towing.kmTotal = 300', () => expect(display.towing.kmTotal).toBe(300));
  it('towing.planName = Completa', () => expect(display.towing.planName).toBe('Completa'));
  it('towing.tooltip contém texto do catálogo Tokio Completa', () => {
    expect(display.towing.tooltip).toContain('200 km de reboque');
  });

  it('glass.tier = Completo', () => expect(display.glass.tier).toBe('Completo'));
  it('glass.tooltip contém texto do catálogo Tokio Completo', () => {
    expect(display.glass.tooltip).toContain('faróis');
  });

  it('replacementVehicle.days = 15', () => expect(display.replacementVehicle.days).toBe(15));
  it('replacementVehicle.category = Básico (Mecânico)', () => {
    expect(display.replacementVehicle.category).toBe('Básico (Mecânico)');
  });

  it('martelinho = contracted (Possui no PDF)', () => {
    expect(display.martelinho.status).toBe('contracted');
  });
  it('latariaEPintura = contracted', () => {
    expect(display.latariaEPintura.status).toBe('contracted');
  });
  it('rodaPneuSuspensao = contracted', () => {
    expect(display.rodaPneuSuspensao.status).toBe('contracted');
  });
  it('logoMarcaVidros = not_contracted (Não possui no PDF)', () => {
    expect(display.logoMarcaVidros.status).toBe('not_contracted');
  });

  it('repairShopType = Livre Escolha', () => {
    expect(display.repairShopType).toBe('Livre Escolha');
  });
  it('partsType = Novas originais', () => {
    expect(display.partsType).toBe('Novas originais');
  });
});

// ── Tokio Auto Proteção Mensal: serviços not_contracted explícitos ────────────
describe('buildCoverageDisplay — Tokio Proteção Mensal (serviços não contratados)', () => {
  let display: ReturnType<typeof buildCoverageDisplay>;

  beforeAll(() => {
    display = buildCoverageDisplay(
      makeData({
        insurer: 'TOKIO_MARINE',
        segment: 'AUTO PROTEÇÃO MENSAL',
        coverage: {
          vehicle: { fipePercentage: 90 },
          rcf: { propertyDamage: 25000, bodilyInjury: 25000 },
          assistance: {
            towing: true,
            glassProtection: false,
            replacementVehicle: false,
          },
        },
        coverageDetails: {
          assistance: { planName: 'Completa' },
          glass: { tier: 'Não possui' },
          services: { martelinho: false, latariaEPintura: false, rodaPneuSuspensao: false, logoMarcaVidros: false },
          repair: { shopType: 'Rede Referenciada', partsType: 'Novas Compatíveis' },
        },
      }),
    );
  });

  it('glass.status = not_contracted (glassProtection=false)', () => {
    expect(display.glass.status).toBe('not_contracted');
  });
  it('glass.tier = Não possui (extraído do PDF)', () => {
    expect(display.glass.tier).toBe('Não possui');
  });
  it('glass.tooltip = undefined (tier Não possui não tem catálogo)', () => {
    expect(display.glass.tooltip).toBeUndefined();
  });
  it('replacementVehicle = not_contracted', () => {
    expect(display.replacementVehicle.status).toBe('not_contracted');
  });
  it('replacementVehicle.category = undefined', () => {
    expect(display.replacementVehicle.category).toBeUndefined();
  });
  it('martelinho = not_contracted', () => {
    expect(display.martelinho.status).toBe('not_contracted');
  });
  it('repairShopType = Rede Referenciada', () => {
    expect(display.repairShopType).toBe('Rede Referenciada');
  });
});

// ── triState: campo ausente vs false ─────────────────────────────────────────
describe('buildCoverageDisplay — triState semântica (serviços opcionais)', () => {
  it('martelinho undefined → not_found', () => {
    const d = makeData({ coverage: { assistance: { towing: true } } });
    expect(buildCoverageDisplay(d).martelinho.status).toBe('not_found');
  });

  it('martelinho false → not_contracted', () => {
    const d = makeData({ coverageDetails: { services: { martelinho: false } } });
    expect(buildCoverageDisplay(d).martelinho.status).toBe('not_contracted');
  });

  it('martelinho true → contracted', () => {
    const d = makeData({ coverageDetails: { services: { martelinho: true } } });
    expect(buildCoverageDisplay(d).martelinho.status).toBe('contracted');
  });

  it('towing.tooltip = undefined quando planName não está no catálogo', () => {
    const d = makeData({
      insurer: 'TOKIO_MARINE',
      coverage: { assistance: { towing: true } },
      coverageDetails: { assistance: { planName: 'Desconhecido' } },
    });
    expect(buildCoverageDisplay(d).towing.tooltip).toBeUndefined();
  });

  it('towing.tooltip = undefined quando insurer não é Tokio', () => {
    const d = makeData({
      insurer: 'BRADESCO',
      coverage: { assistance: { towing: true } },
      coverageDetails: { assistance: { planName: 'Completa' } },
    });
    expect(buildCoverageDisplay(d).towing.tooltip).toBeUndefined();
  });

  it('towing.tooltip correto para Tokio VIP assistência', () => {
    const d = makeData({
      insurer: 'TOKIO_MARINE',
      coverage: { assistance: { towing: true } },
      coverageDetails: { assistance: { planName: 'VIP' } },
    });
    expect(buildCoverageDisplay(d).towing.tooltip).toContain('leva e traz');
  });
});

// ── towing.footnote: nota de rodapé estruturada para PDF ─────────────────────
describe('buildCoverageDisplay — towing.footnote', () => {
  it('footnote contém breakdown de km quando base/adicional/total estão presentes', () => {
    const d = makeData({
      insurer: 'TOKIO_MARINE',
      coverage: { assistance: { towing: true } },
      coverageDetails: {
        assistance: { planName: 'Completa', towingKmBase: 200, towingKmAdditional: 100, towingKmTotal: 300 },
      },
    });
    const { footnote } = buildCoverageDisplay(d).towing;
    expect(footnote).toContain('200 km padrão');
    expect(footnote).toContain('100 km adicional');
    expect(footnote).toContain('totalizando 300 km');
  });

  it('footnote não menciona "200 km de reboque" como texto fixo quando breakdown está disponível', () => {
    const d = makeData({
      insurer: 'TOKIO_MARINE',
      coverage: { assistance: { towing: true } },
      coverageDetails: {
        assistance: { planName: 'Completa', towingKmBase: 200, towingKmAdditional: 100, towingKmTotal: 300 },
      },
    });
    const { footnote } = buildCoverageDisplay(d).towing;
    // Não deve exibir o texto do catálogo literal "200 km de reboque" que causava contradição visual
    expect(footnote).not.toContain('200 km de reboque com possibilidade');
  });

  it('footnote contém serviços do plano Completa quando breakdown presente', () => {
    const d = makeData({
      insurer: 'TOKIO_MARINE',
      coverage: { assistance: { towing: true } },
      coverageDetails: {
        assistance: { planName: 'Completa', towingKmBase: 200, towingKmAdditional: 100, towingKmTotal: 300 },
      },
    });
    const { footnote } = buildCoverageDisplay(d).towing;
    expect(footnote).toMatch(/mecânico|hospedagem|chaveiro/);
  });

  it('footnote usa texto de catálogo quando km base/adicional não estão disponíveis', () => {
    const d = makeData({
      insurer: 'TOKIO_MARINE',
      coverage: { assistance: { towing: true } },
      coverageDetails: {
        assistance: { planName: 'Completa', towingKmTotal: 300 },
      },
    });
    const { footnote } = buildCoverageDisplay(d).towing;
    // Sem breakdown → usa catálogo
    expect(footnote).toContain('Plano Completa');
    expect(footnote).toContain('200 km de reboque');
  });

  it('footnote = undefined quando planName não está no catálogo', () => {
    const d = makeData({
      insurer: 'TOKIO_MARINE',
      coverage: { assistance: { towing: true } },
      coverageDetails: { assistance: { planName: 'Desconhecido' } },
    });
    expect(buildCoverageDisplay(d).towing.footnote).toBeUndefined();
  });

  it('footnote = undefined para seguradora sem catálogo (Bradesco)', () => {
    const d = makeData({
      insurer: 'BRADESCO',
      coverage: { assistance: { towing: true } },
      coverageDetails: { assistance: { planName: 'Completa' } },
    });
    expect(buildCoverageDisplay(d).towing.footnote).toBeUndefined();
  });

  it('towing.kmBase e towing.kmAdditional são populados do coverageDetails', () => {
    const d = makeData({
      insurer: 'TOKIO_MARINE',
      coverage: { assistance: { towing: true } },
      coverageDetails: {
        assistance: { planName: 'Completa', towingKmBase: 200, towingKmAdditional: 100, towingKmTotal: 300 },
      },
    });
    const towing = buildCoverageDisplay(d).towing;
    expect(towing.kmBase).toBe(200);
    expect(towing.kmAdditional).toBe(100);
  });
});
