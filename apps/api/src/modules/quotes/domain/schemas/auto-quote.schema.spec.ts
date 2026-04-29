import { UnprocessableEntityException } from '@nestjs/common';
import { parseAutoQuoteData } from './auto-quote.schema';

const validData = {
  vehicle: { model: 'Jeep Compass Sport 1.3', plate: 'PCI4A59' },
  driver: { name: 'Fabiano Alves da Silveira' },
  insurer: 'Bradesco Auto/RE',
  coverage: {
    vehicle: { fipePercentage: 100, deductible: 3866.5, deductibleType: 'Reduzida' },
    rcf: { propertyDamage: 100000, bodilyInjury: 100000, moralDamages: 10000 },
    app: { death: 5000, disability: 5000, passengerCount: 5 },
  },
  deductibles: [
    { item: 'Veículo', value: 3866.5, type: 'Reduzida' },
    { item: 'Vidro Dianteiro', value: 721 },
  ],
  premium: { base: 2404.44, iof: 237, total: 3448.53 },
  paymentMethods: [
    {
      type: 'debit' as const,
      label: 'Débito',
      installments: [{ number: 1, amount: 3448.5, total: 3448.5 }],
    },
  ],
};

describe('parseAutoQuoteData', () => {
  it('retorna dados válidos quando o JSON está correto', () => {
    const result = parseAutoQuoteData(validData);
    expect(result).toMatchObject(validData);
  });

  it('aceita campos opcionais quando presentes', () => {
    const data = {
      ...validData,
      quoteNumber: '0788270607/03',
      validFrom: '11/03/2026',
      validUntil: '18/03/2026',
      bonusClass: '10% - Sem Sinistro',
      vehicle: {
        ...validData.vehicle,
        yearManufacture: 2025,
        yearModel: 2026,
        chassis: '988675CA2TKV89231',
        fipeCode: '13398',
        fipeValue: 7866.5,
      },
    };
    const result = parseAutoQuoteData(data);
    expect(result).toMatchObject(data);
  });

  it('lança UnprocessableEntityException quando vehicle está ausente', () => {
    const { vehicle: _, ...withoutVehicle } = validData as any;
    expect(() => parseAutoQuoteData(withoutVehicle)).toThrow(UnprocessableEntityException);
  });

  it('lança UnprocessableEntityException quando premium.total está ausente', () => {
    const data = { ...validData, premium: { base: 2404 } };
    expect(() => parseAutoQuoteData(data)).toThrow(UnprocessableEntityException);
  });

  it('lança UnprocessableEntityException quando paymentMethods tem type inválido', () => {
    const data = {
      ...validData,
      paymentMethods: [{ type: 'pix', label: 'Pix', installments: [] }],
    };
    expect(() => parseAutoQuoteData(data)).toThrow(UnprocessableEntityException);
  });

  it('lança UnprocessableEntityException quando o input não é objeto', () => {
    expect(() => parseAutoQuoteData(null)).toThrow(UnprocessableEntityException);
    expect(() => parseAutoQuoteData('string')).toThrow(UnprocessableEntityException);
  });
});
