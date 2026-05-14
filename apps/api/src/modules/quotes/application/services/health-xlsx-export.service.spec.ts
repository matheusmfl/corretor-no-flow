import * as ExcelJS from 'exceljs';
import type { HealthQuoteDraft, HealthMemberLife, HealthQuoteOption } from '@corretor/types';
import { HealthXlsxExportService } from './health-xlsx-export.service';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function notFound() {
  return { value: null, source: 'not_found' as const, confidence: 0, needsReview: true };
}

function found(value: string) {
  return { value, source: 'table_lookup' as const, confidence: 1, needsReview: false };
}

function life(age: number, name?: string): HealthMemberLife {
  return { age, name, source: 'extracted', needsReview: false };
}

const SIMPLE_DRAFT: HealthQuoteDraft = {
  lives: [life(34, 'Ana'), life(41, 'Bruno')],
  quoteOptions: [
    {
      sourceType: 'manual_table',
      carrierOrOperator: 'Unimed PE',
      planName: 'Plano ENF',
      accommodation: found('Enfermaria'),
      coparticipation: found('Sem coparticipação'),
      reimbursementMode: notFound(),
      validUntil: found('2026-06-30'),
      dental: notFound(),
      perLifePrices: [
        { lifeIndex: 0, price: 355.00 },
        { lifeIndex: 1, price: 430.00 },
      ],
      monthlyTotal: 785.00,
    },
  ],
  reviewStatus: 'confirmed',
};

// ─── HealthXlsxExportService ──────────────────────────────────────────────────

describe('HealthXlsxExportService', () => {
  const service = new HealthXlsxExportService();

  it('retorna um Buffer', async () => {
    const buffer = await service.export(SIMPLE_DRAFT);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('buffer não está vazio', async () => {
    const buffer = await service.export(SIMPLE_DRAFT);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('buffer começa com assinatura PK (ZIP/XLSX)', async () => {
    const buffer = await service.export(SIMPLE_DRAFT);
    // XLSX é um ZIP — primeiros 2 bytes são 0x50 0x4B ("PK")
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  it('não lança para draft com uma única vida', async () => {
    const draft: HealthQuoteDraft = {
      lives: [life(30, 'Carlos')],
      quoteOptions: [
        {
          sourceType: 'manual_table',
          carrierOrOperator: 'Bradesco Saúde',
          planName: 'Top Nacional',
          accommodation: found('Apartamento'),
          coparticipation: notFound(),
          reimbursementMode: notFound(),
          validUntil: notFound(),
          dental: notFound(),
          perLifePrices: [{ lifeIndex: 0, price: 1200 }],
          monthlyTotal: 1200,
        },
      ],
      reviewStatus: 'confirmed',
    };
    await expect(service.export(draft)).resolves.toBeInstanceOf(Buffer);
  });

  it('não lança para draft sem warnings', async () => {
    await expect(service.export(SIMPLE_DRAFT)).resolves.toBeInstanceOf(Buffer);
  });

  it('não lança para draft com warnings', async () => {
    const draft: HealthQuoteDraft = {
      ...SIMPLE_DRAFT,
      warnings: ['Tabela sem validade definida'],
    };
    await expect(service.export(draft)).resolves.toBeInstanceOf(Buffer);
  });
});

// ─── Testes estruturais do XLSX (P2) ─────────────────────────────────────────

async function loadWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  return wb;
}

describe('HealthXlsxExportService — estrutura das abas', () => {
  const service = new HealthXlsxExportService();

  const DRAFT_WITH_WARNING: HealthQuoteDraft = {
    lives: [life(34, 'Ana'), life(41, 'Bruno')],
    quoteOptions: [
      {
        sourceType: 'manual_table',
        carrierOrOperator: 'Unimed PE',
        planName: 'Plano ENF',
        accommodation: found('Enfermaria'),
        coparticipation: found('Sem coparticipação'),
        reimbursementMode: notFound(),
        validUntil: found('2026-06-30'),
        dental: notFound(),
        perLifePrices: [
          { lifeIndex: 0, price: 355.00 },
          { lifeIndex: 1, price: 430.00 },
        ],
        monthlyTotal: 785.00,
        warnings: ['Confirmar acomodação antes de enviar'],
      },
    ],
    warnings: ['Tabela sem validação confirmada'],
    reviewStatus: 'confirmed',
  };

  it('workbook contém aba "Cotação"', async () => {
    const buffer = await service.export(DRAFT_WITH_WARNING);
    const wb = await loadWorkbook(buffer);
    expect(wb.getWorksheet('Cotação')).toBeDefined();
  });

  it('workbook contém aba "Notas"', async () => {
    const buffer = await service.export(DRAFT_WITH_WARNING);
    const wb = await loadWorkbook(buffer);
    expect(wb.getWorksheet('Notas')).toBeDefined();
  });

  it('aba Cotação tem headers na primeira linha', async () => {
    const buffer = await service.export(DRAFT_WITH_WARNING);
    const wb = await loadWorkbook(buffer);
    const sheet = wb.getWorksheet('Cotação')!;
    const headerRow = sheet.getRow(1);
    const values = headerRow.values as (string | undefined)[];
    expect(values).toContain('Nome / Beneficiário');
    expect(values).toContain('Plano ENF');
  });

  it('aba Cotação tem linha de Total', async () => {
    const buffer = await service.export(DRAFT_WITH_WARNING);
    const wb = await loadWorkbook(buffer);
    const sheet = wb.getWorksheet('Cotação')!;
    let foundTotal = false;
    sheet.eachRow((row) => {
      const vals = row.values as (string | number | undefined)[];
      if (vals.includes('Total')) foundTotal = true;
    });
    expect(foundTotal).toBe(true);
  });

  it('aba Notas contém a validade da opção', async () => {
    const buffer = await service.export(DRAFT_WITH_WARNING);
    const wb = await loadWorkbook(buffer);
    const sheet = wb.getWorksheet('Notas')!;
    let foundValidity = false;
    sheet.eachRow((row) => {
      const vals = row.values as (string | undefined)[];
      if (vals.some((v) => typeof v === 'string' && v.includes('2026-06-30'))) foundValidity = true;
    });
    expect(foundValidity).toBe(true);
  });

  it('aba Notas contém warning da opção', async () => {
    const buffer = await service.export(DRAFT_WITH_WARNING);
    const wb = await loadWorkbook(buffer);
    const sheet = wb.getWorksheet('Notas')!;
    let foundWarning = false;
    sheet.eachRow((row) => {
      const vals = row.values as (string | undefined)[];
      if (vals.some((v) => typeof v === 'string' && /Confirmar acomod/i.test(v))) foundWarning = true;
    });
    expect(foundWarning).toBe(true);
  });

  it('aba Notas contém warning geral do draft', async () => {
    const buffer = await service.export(DRAFT_WITH_WARNING);
    const wb = await loadWorkbook(buffer);
    const sheet = wb.getWorksheet('Notas')!;
    let found = false;
    sheet.eachRow((row) => {
      const vals = row.values as (string | undefined)[];
      if (vals.some((v) => typeof v === 'string' && /Tabela sem valida/i.test(v))) found = true;
    });
    expect(found).toBe(true);
  });
});
