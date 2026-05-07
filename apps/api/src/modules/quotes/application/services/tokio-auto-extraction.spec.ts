import { getTokioProductLabel } from './quote-filename';
import { parseAutoQuoteData } from '../../domain/schemas/auto-quote.schema';

// Payloads representativos dos 5 produtos Tokio Marine, baseados nos PDFs reais.
// Os campos são os que a IA extrairia e o Zod validaria.

const AUTO_AI_RESPONSE = {
  vehicle: {
    plate: 'OKB-0A62',
    model: 'VOLKSWAGEN GOL CITY/TREND 1.0 MI TOTAL FLEX 8V 2P',
    yearManufacture: 2014,
    yearModel: 2014,
    chassis: '9BWAA45U3EP506205',
    fipeCode: '005227-2',
    fipeValue: 29659,
  },
  driver: {
    name: 'DIVA CALIXTO DE MELO',
    cpf: '624.282.924-04',
    birthDate: null,
    gender: null,
    maritalStatus: 'Casado(a) ou vive em união estável',
  },
  quoteNumber: '1016728949',
  insurer: 'Tokio Marine',
  segment: 'Auto',
  validFrom: '06/05/2026',
  validUntil: '06/05/2027',
  bonusClass: '2',
  coverage: {
    vehicle: {
      fipePercentage: 100,
      deductible: 5164,
      deductibleType: 'Básica',
    },
    rcf: {
      propertyDamage: 50000,
      bodilyInjury: 50000,
      moralDamages: null,
      combinedSingle: null,
    },
    app: {
      death: 5000,
      disability: 5000,
      medical: null,
      passengerCount: 5,
    },
    assistance: {
      towing: true,
      glassProtection: true,
      replacementVehicle: true,
      replacementDays: 15,
    },
  },
  deductibles: [{ item: 'Veículo', value: 5164 }],
  premium: {
    base: 3013.84,
    iof: null,
    total: 3236.26,
  },
  paymentMethods: [],
};

const AUTO_CLASSICO_AI_RESPONSE = {
  ...AUTO_AI_RESPONSE,
  insurer: 'Tokio Marine',
  segment: 'Auto Clássico',
  coverage: {
    ...AUTO_AI_RESPONSE.coverage,
    assistance: {
      ...AUTO_AI_RESPONSE.coverage.assistance,
      replacementDays: 7,
    },
  },
  premium: { ...AUTO_AI_RESPONSE.premium, total: 3053.38 },
};

const ROUBO_RASTREADOR_AI_RESPONSE = {
  ...AUTO_AI_RESPONSE,
  insurer: 'Tokio Marine',
  segment: 'Auto Roubo + Rastreador',
  coverage: {
    ...AUTO_AI_RESPONSE.coverage,
    vehicle: {
      fipePercentage: 100,
      deductible: 6196.80,
      deductibleType: 'Básica',
    },
    assistance: {
      ...AUTO_AI_RESPONSE.coverage.assistance,
      glassProtection: false,
      replacementDays: 7,
    },
  },
  premium: { ...AUTO_AI_RESPONSE.premium, total: 2476.32 },
};

const PROTECAO_MENSAL_AI_RESPONSE = {
  ...AUTO_AI_RESPONSE,
  insurer: 'Tokio Marine',
  segment: 'Auto Proteção Mensal',
  coverage: {
    ...AUTO_AI_RESPONSE.coverage,
    vehicle: {
      fipePercentage: 90,
      deductible: 5164,
      deductibleType: 'Básica',
    },
    rcf: {
      propertyDamage: 25000,
      bodilyInjury: 25000,
      moralDamages: null,
      combinedSingle: null,
    },
    assistance: {
      towing: true,
      glassProtection: false,
      replacementVehicle: false,
      replacementDays: null,
    },
  },
  premium: { ...AUTO_AI_RESPONSE.premium, total: 2731.41 },
};

// Assistência Exclusiva: sem casco, sem RCF, sem APP — apenas assistência 24h
const ASSISTENCIA_EXCLUSIVA_AI_RESPONSE = {
  vehicle: AUTO_AI_RESPONSE.vehicle,
  driver: AUTO_AI_RESPONSE.driver,
  quoteNumber: '1016728949',
  insurer: 'Tokio Marine',
  segment: 'Assistência Exclusiva',
  validFrom: '06/05/2026',
  validUntil: '06/05/2027',
  bonusClass: '2',
  coverage: {
    assistance: {
      towing: true,
      glassProtection: false,
      replacementVehicle: false,
      replacementDays: null,
    },
  },
  deductibles: [],
  premium: {
    base: 354.58,
    iof: null,
    total: 380.75,
  },
  paymentMethods: [],
};

describe('Tokio Marine AUTO — getTokioProductLabel', () => {
  it('retorna "Auto" para segment "Auto"', () => {
    expect(getTokioProductLabel({ segment: 'Auto' })).toBe('Auto');
  });

  it('retorna "Auto Clássico" para segment "Auto Clássico"', () => {
    expect(getTokioProductLabel({ segment: 'Auto Clássico' })).toBe('Auto Clássico');
  });

  it('retorna "Roubo + Rastreador" para segment "Auto Roubo + Rastreador"', () => {
    expect(getTokioProductLabel({ segment: 'Auto Roubo + Rastreador' })).toBe('Roubo + Rastreador');
  });

  it('retorna "Proteção Mensal · 90% FIPE" para segment Proteção Mensal com 90% FIPE extraído', () => {
    expect(getTokioProductLabel({ segment: 'Auto Proteção Mensal', coverage: { vehicle: { fipePercentage: 90 } } })).toBe('Proteção Mensal · 90% FIPE');
  });

  it('retorna "Proteção Mensal" para segment Proteção Mensal sem fipePercentage extraído', () => {
    expect(getTokioProductLabel({ segment: 'Auto Proteção Mensal' })).toBe('Proteção Mensal');
  });

  it('retorna "Assistência Exclusiva" para segment "Assistência Exclusiva"', () => {
    expect(getTokioProductLabel({ segment: 'Assistência Exclusiva' })).toBe('Assistência Exclusiva');
  });

  it('retorna undefined para segment não reconhecido', () => {
    expect(getTokioProductLabel({ segment: 'Desconhecido' })).toBeUndefined();
  });

  it('retorna undefined sem segment', () => {
    expect(getTokioProductLabel({})).toBeUndefined();
  });
});

// Fixture baseada no PDF de referência positiva:
// .ai/pdf-lab/output/auto_tokio_services_positive_reference.json
// Representa o que a IA retornaria ao processar o PDF com serviços contratados.
const SERVICES_POSITIVE_AI_RESPONSE = {
  ...AUTO_AI_RESPONSE,
  coverage: {
    ...AUTO_AI_RESPONSE.coverage,
    assistance: {
      towing: true,
      glassProtection: true,
      replacementVehicle: true,
      replacementDays: 15,
    },
  },
  coverageDetails: {
    assistance: {
      planName: 'Completa',
      towingKmBase: 200,
      towingKmAdditional: 100,
      towingKmTotal: 300,
    },
    glass: { tier: 'Completo' },
    replacementVehicle: { category: 'Básico (Mecânico)' },
    services: {
      martelinho: true,
      latariaEPintura: true,
      rodaPneuSuspensao: true,
      logoMarcaVidros: false,
    },
    repair: {
      shopType: 'Livre Escolha',
      partsType: 'Novas originais',
    },
  },
};

describe('Tokio Marine AUTO — parseAutoQuoteData (validação Zod)', () => {
  it('valida payload do produto Auto sem erros Zod', () => {
    expect(() => parseAutoQuoteData(AUTO_AI_RESPONSE as any)).not.toThrow();
  });

  it('valida payload do produto Auto Clássico sem erros Zod', () => {
    expect(() => parseAutoQuoteData(AUTO_CLASSICO_AI_RESPONSE as any)).not.toThrow();
  });

  it('valida payload do produto Auto Roubo + Rastreador sem erros Zod', () => {
    expect(() => parseAutoQuoteData(ROUBO_RASTREADOR_AI_RESPONSE as any)).not.toThrow();
  });

  it('valida payload do produto Auto Proteção Mensal sem erros Zod', () => {
    expect(() => parseAutoQuoteData(PROTECAO_MENSAL_AI_RESPONSE as any)).not.toThrow();
  });

  it('valida payload de Assistência Exclusiva (sem coverage.vehicle) sem erros Zod', () => {
    expect(() => parseAutoQuoteData(ASSISTENCIA_EXCLUSIVA_AI_RESPONSE as any)).not.toThrow();
  });

  it('Assistência Exclusiva não tem coverage.vehicle no payload validado', () => {
    const data = parseAutoQuoteData(ASSISTENCIA_EXCLUSIVA_AI_RESPONSE as any);
    expect(data.coverage?.vehicle).toBeUndefined();
  });

  it('Proteção Mensal tem fipePercentage 90 após validação', () => {
    const data = parseAutoQuoteData(PROTECAO_MENSAL_AI_RESPONSE as any);
    expect(data.coverage?.vehicle?.fipePercentage).toBe(90);
  });

  it('valida fixture de referência positiva (serviços contratados) sem erros Zod', () => {
    expect(() => parseAutoQuoteData(SERVICES_POSITIVE_AI_RESPONSE as any)).not.toThrow();
  });

  it('referência positiva: martelinho = true após validação', () => {
    const data = parseAutoQuoteData(SERVICES_POSITIVE_AI_RESPONSE as any);
    expect(data.coverageDetails?.services?.martelinho).toBe(true);
  });

  it('referência positiva: latariaEPintura = true após validação', () => {
    const data = parseAutoQuoteData(SERVICES_POSITIVE_AI_RESPONSE as any);
    expect(data.coverageDetails?.services?.latariaEPintura).toBe(true);
  });

  it('referência positiva: rodaPneuSuspensao = true após validação', () => {
    const data = parseAutoQuoteData(SERVICES_POSITIVE_AI_RESPONSE as any);
    expect(data.coverageDetails?.services?.rodaPneuSuspensao).toBe(true);
  });

  it('referência positiva: logoMarcaVidros = false (Não possui) após validação', () => {
    const data = parseAutoQuoteData(SERVICES_POSITIVE_AI_RESPONSE as any);
    expect(data.coverageDetails?.services?.logoMarcaVidros).toBe(false);
  });

  it('referência positiva: towingKmTotal = 300 após validação', () => {
    const data = parseAutoQuoteData(SERVICES_POSITIVE_AI_RESPONSE as any);
    expect(data.coverageDetails?.assistance?.towingKmTotal).toBe(300);
  });

  it('referência positiva: glass.tier = Completo após validação', () => {
    const data = parseAutoQuoteData(SERVICES_POSITIVE_AI_RESPONSE as any);
    expect(data.coverageDetails?.glass?.tier).toBe('Completo');
  });

  it('referência positiva: repair.shopType = Livre Escolha após validação', () => {
    const data = parseAutoQuoteData(SERVICES_POSITIVE_AI_RESPONSE as any);
    expect(data.coverageDetails?.repair?.shopType).toBe('Livre Escolha');
  });

  it('referência positiva: replacementVehicle.category = Básico (Mecânico) após validação', () => {
    const data = parseAutoQuoteData(SERVICES_POSITIVE_AI_RESPONSE as any);
    expect(data.coverageDetails?.replacementVehicle?.category).toBe('Básico (Mecânico)');
  });
});
