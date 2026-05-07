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
  it('fastRepair = not_found (produto não expõe)', () => {
    expect(display.fastRepair.status).toBe('not_found');
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
});
