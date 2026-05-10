import { buildQuotePdfFilename, getBradescoProductLabel } from './quote-filename';

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

// ── getBradescoProductLabel ───────────────────────────────────────────────────

describe('getBradescoProductLabel', () => {
  it('Tradicional → Tradicional', () => {
    expect(getBradescoProductLabel({ segment: 'Tradicional' } as any)).toBe('Tradicional');
  });

  it('1583 - BRADESCO SEGURO AUTO CLASSIC → Auto Classic', () => {
    expect(getBradescoProductLabel({ segment: '1583 - BRADESCO SEGURO AUTO CLASSIC' } as any)).toBe('Auto Classic');
  });

  it('1776 - SEGURO AUTO LAR → Auto Lar', () => {
    expect(getBradescoProductLabel({ segment: '1776 - SEGURO AUTO LAR' } as any)).toBe('Auto Lar');
  });

  it('segment undefined → undefined', () => {
    expect(getBradescoProductLabel({} as any)).toBeUndefined();
  });

  it('segment vazio → undefined', () => {
    expect(getBradescoProductLabel({ segment: '' } as any)).toBeUndefined();
  });
});

// ── Formato geral ─────────────────────────────────────────────────────────────

describe('buildQuotePdfFilename', () => {
  it('Bradesco sem segment: usa veiculo, seguradora, tipo de franquia e premio total (retrocompat)', () => {
    expect(buildQuotePdfFilename('BRADESCO', bradescoReduzida as any))
      .toBe('JEEP_COMPASS_Bradesco_Reduzida(4200).pdf');
  });

  it('Bradesco Tradicional: usa produto no nome em vez de franquia', () => {
    const data = { ...bradescoReduzida, segment: 'Tradicional' };
    const result = buildQuotePdfFilename('BRADESCO', data as any);
    expect(result).toContain('Tradicional');
    expect(result).not.toContain('Reduzida');
  });

  it('Bradesco Auto Classic: usa produto no nome', () => {
    const data = { ...bradescoReduzida, segment: '1583 - BRADESCO SEGURO AUTO CLASSIC' };
    const result = buildQuotePdfFilename('BRADESCO', data as any);
    expect(result).toContain('Classic');
  });

  it('Bradesco Auto Lar: usa produto no nome', () => {
    const data = { ...bradescoReduzida, segment: '1776 - SEGURO AUTO LAR' };
    const result = buildQuotePdfFilename('BRADESCO', data as any);
    expect(result).toContain('Lar');
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

  // ── Azul: diferenciação por produto ───────────────────────────────────────────

  const azulTradicional = {
    vehicle:  { model: 'JEEP COMPASS SPORT 1.3 T 270 FLEX' },
    segment:  'AZUL TRADICIONAL',
    coverage: { vehicle: { fipePercentage: 100, deductibleType: 'Normal', deductible: 6516 } },
    premium:  { total: 3673.00 },
  };

  const azulRoubo = {
    vehicle:  { model: 'JEEP COMPASS SPORT 1.3 T 270 FLEX' },
    segment:  'AZUL AUTO ROUBO',
    coverage: { vehicle: { fipePercentage: 90 } },
    premium:  { total: 1705.05 },
  };

  it('Azul Tradicional: nome inclui "Seguro" (produto Seguro Auto)', () => {
    expect(buildQuotePdfFilename('AZUL', azulTradicional as any))
      .toContain('Seguro');
  });

  it('Azul Roubo: nome inclui "Roubo_e_Furto"', () => {
    const result = buildQuotePdfFilename('AZUL', azulRoubo as any);
    expect(result).toContain('Roubo');
    expect(result).toContain('Furto');
  });

  it('Azul Tradicional e Azul Roubo geram nomes distintos', () => {
    const t = buildQuotePdfFilename('AZUL', azulTradicional as any);
    const r = buildQuotePdfFilename('AZUL', azulRoubo as any);
    expect(t).not.toBe(r);
  });

  it('Azul: usa "Azul" como seguradora (nao "AZUL" em maiusculo)', () => {
    expect(buildQuotePdfFilename('AZUL', azulTradicional as any))
      .toContain('Azul');
    expect(buildQuotePdfFilename('AZUL', azulTradicional as any))
      .not.toContain('_AZUL_');
  });

  it('Azul: segment tem prioridade sobre fipePercentage (segmento TRADICIONAL mesmo com 90%)', () => {
    const confusing = {
      ...azulTradicional,
      segment:  'AZUL TRADICIONAL',
      coverage: { vehicle: { fipePercentage: 90 } }, // errado, mas segment é primário
    };
    const result = buildQuotePdfFilename('AZUL', confusing as any);
    expect(result).toContain('Seguro'); // produto vem do segment, não do fipePercentage
    expect(result).not.toContain('Roubo');
  });

  // ── Azul: fallback para quoteName quando extractedData incompleto ──────────────

  it('Azul: usa quoteName como fallback quando extractedData nao tem segment nem fipePercentage', () => {
    const incompleto = {
      vehicle:  { model: 'JEEP COMPASS SPORT 1.3 T 270 FLEX' },
      premium:  { total: 1705.05 },
      // sem segment, sem coverage.vehicle.fipePercentage
    };
    const result = buildQuotePdfFilename('AZUL', incompleto as any, 'Azul Roubo e Furto — (R$ 1.705,05)');
    expect(result).toContain('Roubo');
    expect(result).toContain('Furto');
    expect(result).not.toBe('Azul.pdf');
  });

  it('Azul: fallback com extractedData null usa quoteName', () => {
    const result = buildQuotePdfFilename('AZUL', null, 'Azul Seguro Auto — (R$ 3.673,00)');
    expect(result).toContain('Seguro');
    expect(result).not.toBe('Azul.pdf');
  });

  it('Azul: extractedData valido com fipePercentage ignora quoteName', () => {
    // quando extractedData tem dados suficientes, quoteName nao deve interferir
    const result = buildQuotePdfFilename('AZUL', azulRoubo as any, 'Nome diferente qualquer');
    expect(result).toContain('Roubo');
    expect(result).not.toContain('diferente');
  });

  it('Azul: sem quoteName e extractedData incompleto retorna pelo menos "Azul"', () => {
    const result = buildQuotePdfFilename('AZUL', null);
    expect(result).toContain('Azul');
    expect(result.endsWith('.pdf')).toBe(true);
  });
});
