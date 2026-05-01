import { buildQuotePdfFilename } from './quote-filename';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const bradescoReduzida = {
  vehicle: { model: 'JEEP COMPASS SPORT T270 1.3 TB 4X2', plate: 'PCI4A59' },
  coverage: { vehicle: { deductibleType: 'Reduzida', deductible: 3866.5 } },
  premium:  { total: 4200 },
};

const portoNormal = {
  vehicle:  { model: 'JEEP COMPASS' },
  coverage: { vehicle: { deductibleType: 'Normal', deductible: 6205 } },
  premium:  { total: 4226.40 },
};

const portoCompreensiva = {
  vehicle:  { model: 'JEEP COMPASS' },
  coverage: { vehicle: { deductibleType: 'Compreensiva', deductible: 6205 } },
  premium:  { total: 4226.40 },
};

// ── Formato geral ─────────────────────────────────────────────────────────────

describe('buildQuotePdfFilename', () => {
  it('Bradesco Reduzida: usa veiculo, seguradora, tipo de franquia e premio total', () => {
    expect(buildQuotePdfFilename('BRADESCO', bradescoReduzida as any))
      .toBe('JEEP_COMPASS_Bradesco_Reduzida(4200).pdf');
  });

  it('modelo com duas palavras curtas (sem marca explícita)', () => {
    const data = { vehicle: { model: 'COMPASS TURBO' }, coverage: { vehicle: { deductibleType: 'Reduzida' } }, premium: { total: 3500 } };
    expect(buildQuotePdfFilename('BRADESCO', data as any))
      .toBe('COMPASS_TURBO_Bradesco_Reduzida(3500).pdf');
  });

  it('omite parenteses quando premio nao esta disponivel', () => {
    const data = { vehicle: { model: 'FIAT PULSE' }, coverage: { vehicle: { deductibleType: 'Reduzida' } } };
    expect(buildQuotePdfFilename('BRADESCO', data as any))
      .toBe('FIAT_PULSE_Bradesco_Reduzida.pdf');
  });

  it('omite tipo quando franquia esta ausente', () => {
    const data = { vehicle: { model: 'FIAT PULSE' }, coverage: {}, premium: { total: 2000 } };
    expect(buildQuotePdfFilename('BRADESCO', data as any))
      .toBe('FIAT_PULSE_Bradesco(2000).pdf');
  });

  it('usa apenas seguradora quando modelo do veiculo esta vazio', () => {
    expect(buildQuotePdfFilename('ALLIANZ', {} as any))
      .toBe('Allianz.pdf');
  });

  it('usa apenas o primeiro token quando modelo tem uma so palavra', () => {
    const data = { vehicle: { model: 'GOLFINHO' } };
    expect(buildQuotePdfFilename('SUHAI', data as any))
      .toBe('GOLFINHO_Suhai.pdf');
  });

  it('formata premio inteiro sem casas decimais', () => {
    expect(buildQuotePdfFilename('PORTO_SEGURO', portoNormal as any))
      .toBe('JEEP_COMPASS_Porto_Normal(4226.4).pdf');
  });

  it('sanitiza espacos e caracteres especiais', () => {
    const data = { vehicle: { model: 'VW GOL 1.0 AT' }, premium: { total: 2000 } };
    const result = buildQuotePdfFilename('BRADESCO', data as any);
    expect(result).not.toMatch(/[<>:"/\\|?*\s]/);
    expect(result.endsWith('.pdf')).toBe(true);
  });

  // ── Porto: filtro de Compreensiva ──────────────────────────────────────────

  it('Porto Normal: inclui tipo de franquia no nome', () => {
    expect(buildQuotePdfFilename('PORTO_SEGURO', portoNormal as any))
      .toBe('JEEP_COMPASS_Porto_Normal(4226.4).pdf');
  });

  it('Porto Compreensiva: omite tipo pois nao e nome de franquia', () => {
    expect(buildQuotePdfFilename('PORTO_SEGURO', portoCompreensiva as any))
      .toBe('JEEP_COMPASS_Porto(4226.4).pdf');
  });

  it('Porto Compreensiva: nao usa valor da franquia como identificador principal', () => {
    const result = buildQuotePdfFilename('PORTO_SEGURO', portoCompreensiva as any);
    expect(result).not.toContain('6205');   // valor da franquia fora do nome
    expect(result).toContain('4226');       // premio total presente
  });
});
