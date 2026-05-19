import { UnprocessableEntityException } from '@nestjs/common';
import {
  buildAgeBandPlaceholders,
  HealthQuoteDraftExtractorService,
} from './health-quote-draft-extractor.service';

// ─── Mock AiService ───────────────────────────────────────────────────────────

function makeService(aiResponse: unknown) {
  const mockAi = {
    extractHealthQuoteDraft: jest.fn().mockResolvedValue(aiResponse),
  };
  return {
    service: new HealthQuoteDraftExtractorService(mockAi as any),
    mockAi,
  };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const NOT_FOUND_FIELD = { value: null, source: 'not_found', confidence: 0, needsReview: true };
const extracted = (v: string) => ({ value: v, source: 'extracted', confidence: 0.95, needsReview: false });

const AMIL_AI_RESPONSE = {
  clientName: 'MARAVILHA CESTAS LTDA',
  companyDocument: '29073813000193',
  state: 'PE',
  city: 'CAMARAGIBE',
  ageBandCounts: [
    { bandLabel: 'até 18', minAge: 0, maxAge: 18, count: 1 },
    { bandLabel: '34-38', minAge: 34, maxAge: 38, count: 1 },
    { bandLabel: '39-43', minAge: 39, maxAge: 43, count: 1 },
  ],
  lives: [],
  quoteOptions: [
    {
      sourceType: 'portal_pdf',
      carrierOrOperator: 'Amil',
      planName: 'OURO QC R COPART TP',
      accommodation: NOT_FOUND_FIELD,
      coparticipation: extracted('Com coparticipação'),
      reimbursementMode: NOT_FOUND_FIELD,
      validUntil: extracted('14/05/2026'),
      dental: NOT_FOUND_FIELD,
      ageBandPrices: [
        { bandLabel: 'até 18', minAge: 0, maxAge: 18, pricePerLife: 532.33 },
        { bandLabel: '34-38', minAge: 34, maxAge: 38, pricePerLife: 957.40 },
        { bandLabel: '39-43', minAge: 39, maxAge: 43, pricePerLife: 1053.14 },
      ],
      perLifePrices: [
        { lifeIndex: 0, price: 532.33 },
        { lifeIndex: 1, price: 957.40 },
        { lifeIndex: 2, price: 1053.14 },
      ],
      monthlyTotal: 2542.87,
    },
  ],
  reviewStatus: 'pending',
};

const SULAMERICA_AI_RESPONSE = {
  clientName: null,
  ageBandCounts: [
    { bandLabel: '0-18', minAge: 0, maxAge: 18, count: 1 },
    { bandLabel: '34-38', minAge: 34, maxAge: 38, count: 1 },
    { bandLabel: '39-43', minAge: 39, maxAge: 43, count: 1 },
  ],
  lives: [],
  quoteOptions: [
    {
      sourceType: 'portal_pdf',
      carrierOrOperator: 'SulAmérica',
      planName: 'Direto Nacional Enfermaria',
      accommodation: extracted('Enfermaria'),
      coparticipation: extracted('Sem coparticipação'),
      reimbursementMode: NOT_FOUND_FIELD,
      validUntil: extracted('27/06/2026'),
      dental: NOT_FOUND_FIELD,
      monthlyTotal: 2841.09,
    },
    {
      sourceType: 'portal_pdf',
      carrierOrOperator: 'SulAmérica',
      planName: 'Odonto 430',
      accommodation: NOT_FOUND_FIELD,
      coparticipation: NOT_FOUND_FIELD,
      reimbursementMode: NOT_FOUND_FIELD,
      validUntil: extracted('27/06/2026'),
      dental: extracted('Incluso'),
      monthlyTotal: 0,
    },
  ],
  reviewStatus: 'pending',
};

// ─── buildAgeBandPlaceholders (unit) ─────────────────────────────────────────

describe('buildAgeBandPlaceholders', () => {
  it('retorna lista vazia para entrada vazia', () => {
    expect(buildAgeBandPlaceholders([])).toEqual([]);
  });

  it('cria N vidas por faixa com source inferred e needsReview true', () => {
    const result = buildAgeBandPlaceholders([
      { bandLabel: 'até 18', minAge: 0, maxAge: 18, count: 2 },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].source).toBe('inferred');
    expect(result[0].needsReview).toBe(true);
    expect(result[0].ageBand).toBe('até 18');
  });

  it('usa ponto médio da faixa como age', () => {
    const result = buildAgeBandPlaceholders([
      { bandLabel: '34-38', minAge: 34, maxAge: 38, count: 1 },
    ]);
    expect(result[0].age).toBe(36);
  });

  it('gera labels sequenciais entre faixas', () => {
    const result = buildAgeBandPlaceholders([
      { bandLabel: 'até 18', minAge: 0, maxAge: 18, count: 1 },
      { bandLabel: '39-43', minAge: 39, maxAge: 43, count: 2 },
    ]);
    expect(result).toHaveLength(3);
    expect(result[0].label).toBe('Vida 1 - até 18');
    expect(result[1].label).toBe('Vida 2 - 39-43');
    expect(result[2].label).toBe('Vida 3 - 39-43');
  });

  it('ignora faixas com count 0', () => {
    const result = buildAgeBandPlaceholders([
      { bandLabel: '24-28', minAge: 24, maxAge: 28, count: 0 },
      { bandLabel: '34-38', minAge: 34, maxAge: 38, count: 1 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].ageBand).toBe('34-38');
  });
});

// ─── HealthQuoteDraftExtractorService ────────────────────────────────────────

describe('HealthQuoteDraftExtractorService', () => {
  describe('Amil — faixas etárias → vidas placeholder', () => {
    it('converte ageBandCounts em vidas placeholder inferred', async () => {
      const { service } = makeService(AMIL_AI_RESPONSE);
      const draft = await service.extract('texto amil');

      expect(draft.lives).toHaveLength(3);
      draft.lives.forEach((l) => {
        expect(l.source).toBe('inferred');
        expect(l.needsReview).toBe(true);
        expect(l.ageBand).toBeDefined();
      });
    });

    it('atribui age como ponto médio da faixa', async () => {
      const { service } = makeService(AMIL_AI_RESPONSE);
      const draft = await service.extract('texto amil');

      const vida34 = draft.lives.find((l) => l.ageBand === '34-38');
      expect(vida34?.age).toBe(36);
      const vida39 = draft.lives.find((l) => l.ageBand === '39-43');
      expect(vida39?.age).toBe(41);
    });

    it('preserva ageBandPrices e monthlyTotal na opção', async () => {
      const { service } = makeService(AMIL_AI_RESPONSE);
      const draft = await service.extract('texto amil');

      expect(draft.quoteOptions[0].ageBandPrices).toHaveLength(3);
      expect(draft.quoteOptions[0].monthlyTotal).toBe(2542.87);
    });

    it('remove ageBandCounts do draft final', async () => {
      const { service } = makeService(AMIL_AI_RESPONSE);
      const draft = await service.extract('texto amil');

      expect((draft as any).ageBandCounts).toBeUndefined();
    });

    it('preserva dados da empresa do rascunho', async () => {
      const { service } = makeService(AMIL_AI_RESPONSE);
      const draft = await service.extract('texto amil');

      expect(draft.clientName).toBe('MARAVILHA CESTAS LTDA');
      expect(draft.companyDocument).toBe('29073813000193');
    });
  });

  describe('SulAmérica/Cuidado360 — Saúde + Odonto separados', () => {
    it('retorna duas quoteOptions (saúde e odonto)', async () => {
      const { service } = makeService(SULAMERICA_AI_RESPONSE);
      const draft = await service.extract('texto sulamerica');

      expect(draft.quoteOptions).toHaveLength(2);
    });

    it('opção saúde tem accommodation extracted como Enfermaria', async () => {
      const { service } = makeService(SULAMERICA_AI_RESPONSE);
      const draft = await service.extract('texto sulamerica');

      const saude = draft.quoteOptions.find((o) => o.planName === 'Direto Nacional Enfermaria');
      expect(saude?.accommodation.value).toBe('Enfermaria');
      expect(saude?.accommodation.source).toBe('extracted');
    });

    it('opção odonto tem dental extracted como Incluso', async () => {
      const { service } = makeService(SULAMERICA_AI_RESPONSE);
      const draft = await service.extract('texto sulamerica');

      const odonto = draft.quoteOptions.find((o) => o.planName === 'Odonto 430');
      expect(odonto?.dental.value).toBe('Incluso');
      expect(odonto?.dental.source).toBe('extracted');
    });

    it('clientName null da IA vira undefined no draft', async () => {
      const { service } = makeService(SULAMERICA_AI_RESPONSE);
      const draft = await service.extract('texto sulamerica');

      expect(draft.clientName).toBeUndefined();
    });

    it('gera 3 vidas placeholder a partir das faixas', async () => {
      const { service } = makeService(SULAMERICA_AI_RESPONSE);
      const draft = await service.extract('texto sulamerica');

      expect(draft.lives).toHaveLength(3);
    });
  });

  describe('vidas nomeadas misturadas com ageBandCounts', () => {
    it('concatena vidas explícitas com placeholders de faixa', async () => {
      const response = {
        ...AMIL_AI_RESPONSE,
        lives: [
          { age: 35, name: 'João Silva', source: 'extracted', needsReview: false },
        ],
        ageBandCounts: [
          { bandLabel: '39-43', minAge: 39, maxAge: 43, count: 1 },
        ],
      };
      const { service } = makeService(response);
      const draft = await service.extract('texto misto');

      expect(draft.lives).toHaveLength(2);
      expect(draft.lives[0].name).toBe('João Silva');
      expect(draft.lives[1].source).toBe('inferred');
    });
  });

  describe('normalizacao de respostas reais da IA', () => {
    it('aceita faixa aberta com maxAge null e operadora ausente sem derrubar o PDF inteiro', async () => {
      const response = {
        ...AMIL_AI_RESPONSE,
        ageBandCounts: [
          { bandLabel: '59 adiante', minAge: 59, maxAge: null, count: 0 },
        ],
        quoteOptions: [
          {
            ...AMIL_AI_RESPONSE.quoteOptions[0],
            carrierOrOperator: null,
            ageBandPrices: [
              { bandLabel: '59 adiante', minAge: 59, maxAge: null, pricePerLife: 2986.45 },
            ],
          },
        ],
      };
      const { service } = makeService(response);

      const draft = await service.extract('texto real health');

      expect(draft.quoteOptions[0].carrierOrOperator).toBe('Operadora nÃ£o identificada');
      expect(draft.quoteOptions[0].ageBandPrices?.[0].maxAge).toBe(999);
      expect(draft.warnings).toContain('Operadora nÃ£o identificada em uma opÃ§Ã£o; confirme antes de enviar ao cliente.');
    });
  });

  describe('falhas', () => {
    it('lança UnprocessableEntityException quando campo sensível inferido não tem needsReview', async () => {
      const invalidResponse = {
        ...AMIL_AI_RESPONSE,
        ageBandCounts: [],
        lives: [{ age: 34, source: 'extracted', needsReview: false }],
        quoteOptions: [
          {
            ...AMIL_AI_RESPONSE.quoteOptions[0],
            accommodation: { value: 'Enfermaria', source: 'inferred', confidence: 0.7, needsReview: false },
          },
        ],
      };
      const { service } = makeService(invalidResponse);
      await expect(service.extract('texto ruim')).rejects.toThrow(UnprocessableEntityException);
    });

    it('lança UnprocessableEntityException quando IA retorna JSON sem quoteOptions (campo obrigatório)', async () => {
      const incompleteResponse = { reviewStatus: 'pending' };
      const { service } = makeService(incompleteResponse);
      await expect(service.extract('texto incompleto')).rejects.toThrow(UnprocessableEntityException);
    });

    it('lança UnprocessableEntityException quando IA retorna string', async () => {
      const { service } = makeService('isso não é JSON');
      await expect(service.extract('texto ruim')).rejects.toThrow(UnprocessableEntityException);
    });

    // P2a — null da IA deve lançar UnprocessableEntityException, não TypeError
    it('lança UnprocessableEntityException (não TypeError) quando IA retorna null', async () => {
      const { service } = makeService(null);
      await expect(service.extract('texto ruim')).rejects.toThrow(UnprocessableEntityException);
    });

    // P2 — lives não-array da IA deve lançar UnprocessableEntityException, não TypeError
    it('lança UnprocessableEntityException (não TypeError) quando lives é objeto em vez de array', async () => {
      const response = { ...AMIL_AI_RESPONSE, ageBandCounts: [], lives: {} };
      const { service } = makeService(response);
      await expect(service.extract('texto ruim')).rejects.toThrow(UnprocessableEntityException);
    });

    // P1 — validação de ageBandCounts antes de expandir
    it('lança UnprocessableEntityException quando ageBandCounts tem count negativo', async () => {
      const response = {
        ...AMIL_AI_RESPONSE,
        ageBandCounts: [{ bandLabel: 'até 18', minAge: 0, maxAge: 18, count: -1 }],
      };
      const { service } = makeService(response);
      await expect(service.extract('texto ruim')).rejects.toThrow(UnprocessableEntityException);
    });

    it('lança UnprocessableEntityException quando ageBandCounts tem count decimal', async () => {
      const response = {
        ...AMIL_AI_RESPONSE,
        ageBandCounts: [{ bandLabel: 'até 18', minAge: 0, maxAge: 18, count: 1.5 }],
      };
      const { service } = makeService(response);
      await expect(service.extract('texto ruim')).rejects.toThrow(UnprocessableEntityException);
    });

    it('lança UnprocessableEntityException quando maxAge < minAge', async () => {
      const response = {
        ...AMIL_AI_RESPONSE,
        ageBandCounts: [{ bandLabel: '34-38', minAge: 38, maxAge: 34, count: 1 }],
      };
      const { service } = makeService(response);
      await expect(service.extract('texto ruim')).rejects.toThrow(UnprocessableEntityException);
    });
  });

  // P3 — sourceMeta param
  describe('sourceMeta', () => {
    it('injeta sourceFiles do sourceMeta no draft final', async () => {
      const { service } = makeService(AMIL_AI_RESPONSE);
      const draft = await service.extract('texto amil', { sourceFiles: ['CotacaoAmil.pdf'] });

      expect(draft.sourceFiles).toEqual(['CotacaoAmil.pdf']);
    });

    it('sobrescreve sourceFiles da IA com array vazio quando sourceMeta.sourceFiles é []', async () => {
      const responseWithAiFiles = { ...AMIL_AI_RESPONSE, sourceFiles: ['ia-inventou.pdf'] };
      const { service } = makeService(responseWithAiFiles);
      const draft = await service.extract('texto amil', { sourceFiles: [] });

      expect(draft.sourceFiles).toEqual([]);
    });

    it('funciona sem sourceMeta (parâmetro opcional)', async () => {
      const { service } = makeService(AMIL_AI_RESPONSE);
      const draft = await service.extract('texto amil');

      expect(draft).toBeDefined();
    });
  });
});
