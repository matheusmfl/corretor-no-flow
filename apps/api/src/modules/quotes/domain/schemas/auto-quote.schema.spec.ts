import { UnprocessableEntityException } from '@nestjs/common';
import { parseAutoQuoteData } from './auto-quote.schema';

const validData = {
  coverages: [{ name: 'Colisão', description: 'Danos por colisão' }],
  totalPremium: 1200.5,
};

describe('parseAutoQuoteData', () => {
  it('retorna dados válidos quando o JSON está correto', () => {
    const result = parseAutoQuoteData(validData);
    expect(result).toMatchObject(validData);
  });

  it('aceita campos opcionais quando presentes', () => {
    const data = {
      ...validData,
      plate: 'ABC-1234',
      vehicleModel: 'HB20',
      vehicleYear: 2022,
      validUntil: '2026-05-01',
      installments: [{ number: 1, amount: 600.25, dueDate: '2026-05-01' }],
      coverages: [
        {
          name: 'Colisão',
          description: 'Danos por colisão',
          limit: 'R$ 50.000',
          deductible: 'R$ 2.000',
        },
      ],
    };
    const result = parseAutoQuoteData(data);
    expect(result).toMatchObject(data);
  });

  it('lança UnprocessableEntityException quando coverages está ausente', () => {
    const { coverages: _, ...withoutCoverages } = validData as any;
    expect(() => parseAutoQuoteData(withoutCoverages)).toThrow(UnprocessableEntityException);
  });

  it('lança UnprocessableEntityException quando totalPremium está ausente', () => {
    const { totalPremium: _, ...withoutPremium } = validData as any;
    expect(() => parseAutoQuoteData(withoutPremium)).toThrow(UnprocessableEntityException);
  });

  it('lança UnprocessableEntityException quando coverages não é array', () => {
    expect(() => parseAutoQuoteData({ ...validData, coverages: 'invalido' })).toThrow(
      UnprocessableEntityException,
    );
  });

  it('lança UnprocessableEntityException quando totalPremium não é número', () => {
    expect(() => parseAutoQuoteData({ ...validData, totalPremium: 'mil reais' })).toThrow(
      UnprocessableEntityException,
    );
  });

  it('lança UnprocessableEntityException quando coverage não tem name ou description', () => {
    expect(() =>
      parseAutoQuoteData({ ...validData, coverages: [{ name: 'Colisão' }] }),
    ).toThrow(UnprocessableEntityException);
  });

  it('lança UnprocessableEntityException quando o input não é objeto', () => {
    expect(() => parseAutoQuoteData(null)).toThrow(UnprocessableEntityException);
    expect(() => parseAutoQuoteData('string')).toThrow(UnprocessableEntityException);
  });
});
