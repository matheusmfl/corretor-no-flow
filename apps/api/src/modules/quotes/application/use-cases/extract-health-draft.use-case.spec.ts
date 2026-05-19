import type { HealthQuoteDraft } from '@corretor/types';
import { ExtractHealthDraftUseCase } from './extract-health-draft.use-case';
import { PdfExtractorService } from '../services/pdf-extractor.service';
import { HealthQuoteDraftExtractorService } from '../services/health-quote-draft-extractor.service';

// ─── Fixture ──────────────────────────────────────────────────────────────────

const DRAFT_STUB: HealthQuoteDraft = {
  clientName: 'Empresa Teste',
  sourceFiles: ['cotacao.pdf'],
  lives: [{ age: 34, source: 'extracted', needsReview: false }],
  quoteOptions: [],
  reviewStatus: 'pending',
};

// ─── ExtractHealthDraftUseCase ────────────────────────────────────────────────

describe('ExtractHealthDraftUseCase', () => {
  let useCase: ExtractHealthDraftUseCase;
  let pdfExtractor: jest.Mocked<PdfExtractorService>;
  let healthExtractor: jest.Mocked<HealthQuoteDraftExtractorService>;

  beforeEach(() => {
    pdfExtractor = {
      extractText: jest.fn().mockResolvedValue('texto extraído do pdf'),
    } as any;

    healthExtractor = {
      extract: jest.fn().mockResolvedValue(DRAFT_STUB),
    } as any;

    useCase = new ExtractHealthDraftUseCase(pdfExtractor, healthExtractor);
  });

  it('chama extractText com o caminho do arquivo', async () => {
    await useCase.execute('/tmp/test.pdf', 'test.pdf');
    expect(pdfExtractor.extractText).toHaveBeenCalledWith('/tmp/test.pdf');
  });

  it('passa o texto extraído para o extrator de draft', async () => {
    await useCase.execute('/tmp/test.pdf', 'cotacao.pdf');
    expect(healthExtractor.extract).toHaveBeenCalledWith(
      'texto extraído do pdf',
      { sourceFiles: ['cotacao.pdf'] },
    );
  });

  it('retorna o HealthQuoteDraft do extrator', async () => {
    const result = await useCase.execute('/tmp/test.pdf', 'test.pdf');
    expect(result).toBe(DRAFT_STUB);
  });

  it('propaga UnprocessableEntityException do extrator', async () => {
    const { UnprocessableEntityException } = await import('@nestjs/common');
    healthExtractor.extract.mockRejectedValue(
      new UnprocessableEntityException('Rascunho inválido'),
    );
    await expect(useCase.execute('/tmp/test.pdf', 'test.pdf')).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('propaga erro do pdfExtractor', async () => {
    pdfExtractor.extractText.mockRejectedValue(new Error('PDF corrompido'));
    await expect(useCase.execute('/tmp/test.pdf', 'test.pdf')).rejects.toThrow('PDF corrompido');
  });
});
