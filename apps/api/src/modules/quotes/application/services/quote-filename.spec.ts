import { buildQuotePdfFilename } from './quote-filename';

const bradescoData = {
  vehicle: { model: 'JEEP COMPASS SPORT T270 1.3 TB 4X2', plate: 'PCI4A59' },
  coverage: {
    vehicle: { deductibleType: 'Reduzida', deductible: 3866.5 },
  },
};

describe('buildQuotePdfFilename', () => {
  it('usa as duas primeiras palavras do modelo (marca + nome)', () => {
    expect(buildQuotePdfFilename('BRADESCO', bradescoData as any))
      .toBe('JEEP_COMPASS_Bradesco_Reduzida(3866.5).pdf');
  });

  it('funciona quando modelo já vem sem a marca (ex: extração da IA retorna só o modelo)', () => {
    const data = { vehicle: { model: 'COMPASS TURBO' }, coverage: { vehicle: { deductibleType: 'Reduzida', deductible: 1500 } } };
    expect(buildQuotePdfFilename('BRADESCO', data as any))
      .toBe('COMPASS_TURBO_Bradesco_Reduzida(1500).pdf');
  });

  it('formata valor de franquia inteiro sem casas decimais', () => {
    const data = { vehicle: { model: 'HONDA CIVIC' }, coverage: { vehicle: { deductibleType: 'Normal', deductible: 4000 } } };
    expect(buildQuotePdfFilename('PORTO_SEGURO', data as any))
      .toBe('HONDA_CIVIC_Porto_Normal(4000).pdf');
  });

  it('omite tipo e valor de franquia quando ausentes', () => {
    const data = { vehicle: { model: 'FIAT PULSE' }, coverage: {} };
    expect(buildQuotePdfFilename('BRADESCO', data as any))
      .toBe('FIAT_PULSE_Bradesco.pdf');
  });

  it('usa seguradora como fallback quando modelo do veículo está vazio', () => {
    expect(buildQuotePdfFilename('ALLIANZ', {} as any))
      .toBe('Allianz.pdf');
  });

  it('usa apenas o primeiro token quando modelo tem uma só palavra', () => {
    const data = { vehicle: { model: 'GOLFINHO' } };
    expect(buildQuotePdfFilename('SUHAI', data as any))
      .toBe('GOLFINHO_Suhai.pdf');
  });

  it('sanitiza espaços e caracteres especiais do nome do modelo', () => {
    const data = { vehicle: { model: 'VW GOL 1.0 AT' }, coverage: { vehicle: { deductible: 2000 } } };
    const result = buildQuotePdfFilename('BRADESCO', data as any);
    expect(result).not.toMatch(/[<>:"/\\|?*\s]/);
    expect(result.endsWith('.pdf')).toBe(true);
  });
});
