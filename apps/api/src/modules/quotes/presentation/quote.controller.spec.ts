import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QuoteController } from './quote.controller';
import { GetQuoteUseCase } from '../application/use-cases/get-quote.use-case';
import { UploadQuoteUseCase } from '../application/use-cases/upload-quote.use-case';
import { ListQuotesUseCase } from '../application/use-cases/list-quotes.use-case';
import { ReviewQuoteUseCase } from '../application/use-cases/review-quote.use-case';
import { CancelQuoteProcessUseCase } from '../application/use-cases/cancel-quote-process.use-case';
import { SubmitQuoteForProcessingUseCase } from '../application/use-cases/submit-quote-for-processing.use-case';
import { GeneratePdfUseCase } from '../application/use-cases/generate-pdf.use-case';
import { GenerateLinkUseCase } from '../application/use-cases/generate-link.use-case';
import { GetProcessMetricsUseCase } from '../application/use-cases/get-process-metrics.use-case';
import { DetectInsurerUseCase } from '../application/use-cases/detect-insurer.use-case';
import { UploadAutoQuoteUseCase } from '../application/use-cases/upload-auto-quote.use-case';
import { ResetQuoteBatchUseCase } from '../application/use-cases/reset-quote-batch.use-case';
import { RemoveQuoteFromProcessUseCase } from '../application/use-cases/remove-quote-from-process.use-case';
import { GenerateHealthXlsxUseCase } from '../application/use-cases/generate-health-xlsx.use-case';
import { ExtractHealthDraftUseCase } from '../application/use-cases/extract-health-draft.use-case';
import { ApplyHealthTableUseCase } from '../application/use-cases/apply-health-table.use-case';
import { GenerateHealthPdfUseCase } from '../application/use-cases/generate-health-pdf.use-case';
import { PublishHealthDraftUseCase } from '../application/use-cases/publish-health-draft.use-case';

function makeUseCaseMock() {
  return { execute: jest.fn() };
}

describe('QuoteController — downloadPdf', () => {
  let controller: QuoteController;
  let getQuote: jest.Mocked<GetQuoteUseCase>;

  beforeEach(async () => {
    getQuote = makeUseCaseMock() as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuoteController],
      providers: [
        { provide: UploadQuoteUseCase,              useValue: makeUseCaseMock() },
        { provide: ListQuotesUseCase,               useValue: makeUseCaseMock() },
        { provide: GetQuoteUseCase,                 useValue: getQuote },
        { provide: ReviewQuoteUseCase,              useValue: makeUseCaseMock() },
        { provide: CancelQuoteProcessUseCase,       useValue: makeUseCaseMock() },
        { provide: SubmitQuoteForProcessingUseCase, useValue: makeUseCaseMock() },
        { provide: GeneratePdfUseCase,              useValue: makeUseCaseMock() },
        { provide: GenerateLinkUseCase,             useValue: makeUseCaseMock() },
        { provide: GetProcessMetricsUseCase,        useValue: makeUseCaseMock() },
        { provide: DetectInsurerUseCase,            useValue: makeUseCaseMock() },
        { provide: UploadAutoQuoteUseCase,          useValue: makeUseCaseMock() },
        { provide: ResetQuoteBatchUseCase,          useValue: makeUseCaseMock() },
        { provide: RemoveQuoteFromProcessUseCase,   useValue: makeUseCaseMock() },
        { provide: GenerateHealthXlsxUseCase,       useValue: makeUseCaseMock() },
        { provide: ExtractHealthDraftUseCase,       useValue: makeUseCaseMock() },
        { provide: ApplyHealthTableUseCase,         useValue: makeUseCaseMock() },
        { provide: GenerateHealthPdfUseCase,        useValue: makeUseCaseMock() },
        { provide: PublishHealthDraftUseCase,       useValue: makeUseCaseMock() },
      ],
    }).compile();

    controller = module.get(QuoteController);
  });

  it('Azul sem segment: quote.name é passado ao filename — resultado não é Azul.pdf', async () => {
    const mockRes = { download: jest.fn() } as any;
    getQuote.execute.mockResolvedValue({
      quotes: [{
        id: 'quote-azul-1',
        insurer: 'AZUL',
        name: 'Azul Roubo e Furto — (R$ 1.705,05)',
        originalFileKey: 'uploads/quote-azul-1.pdf',
        extractedData: {
          vehicle: { model: 'JEEP COMPASS' },
          premium:  { total: 1705.05 },
          // sem segment, sem fipePercentage — simula cotação pré-Fix attempt 2
        },
      }],
    } as any);

    await controller.downloadPdf({ companyId: 'company-1' }, 'process-1', 'quote-azul-1', mockRes);

    expect(mockRes.download).toHaveBeenCalledTimes(1);
    const [, filename] = (mockRes.download as jest.Mock).mock.calls[0];
    expect(filename).not.toBe('Azul.pdf');
    expect(filename).toContain('Roubo');
    expect(filename.endsWith('.pdf')).toBe(true);
  });

  it('Azul com segment e fipePercentage: filename usa extractedData, não quote.name', async () => {
    const mockRes = { download: jest.fn() } as any;
    getQuote.execute.mockResolvedValue({
      quotes: [{
        id: 'quote-azul-2',
        insurer: 'AZUL',
        name: 'Azul Roubo e Furto — (R$ 1.705,05)',
        originalFileKey: 'uploads/quote-azul-2.pdf',
        extractedData: {
          vehicle:  { model: 'JEEP COMPASS' },
          segment:  'AZUL AUTO ROUBO',
          coverage: { vehicle: { fipePercentage: 90 } },
          premium:  { total: 1705.05 },
        },
      }],
    } as any);

    await controller.downloadPdf({ companyId: 'company-1' }, 'process-1', 'quote-azul-2', mockRes);

    const [, filename] = (mockRes.download as jest.Mock).mock.calls[0];
    expect(filename).toContain('Roubo');
    expect(filename).toContain('Furto');
    expect(filename).toContain('Azul');
  });

  it('lança NotFoundException quando a cotação não tem originalFileKey', async () => {
    const mockRes = { download: jest.fn() } as any;
    getQuote.execute.mockResolvedValue({
      quotes: [{ id: 'quote-no-file', insurer: 'AZUL', name: null, originalFileKey: null, extractedData: null }],
    } as any);

    await expect(
      controller.downloadPdf({ companyId: 'company-1' }, 'process-1', 'quote-no-file', mockRes),
    ).rejects.toThrow(NotFoundException);
  });
});
