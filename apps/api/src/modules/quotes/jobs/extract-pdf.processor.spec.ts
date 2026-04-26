import { InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { InsuranceProduct, PrismaClient } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { PdfExtractorService } from '../application/services/pdf-extractor.service';
import { AiService } from '../../ai/ai.service';
import { ExtractPdfProcessor } from './extract-pdf.processor';
import { ExtractPdfJobData } from '../../queue/queue.types';
import { QuoteStatus } from '../domain/value-objects/quote-status.vo';

jest.mock('../domain/schemas/auto-quote.schema', () => ({
  parseAutoQuoteData: jest.fn(),
}));

import { parseAutoQuoteData } from '../domain/schemas/auto-quote.schema';
const mockParseAutoQuoteData = parseAutoQuoteData as jest.Mock;

const makeJob = (data: ExtractPdfJobData) => ({ data } as Job<ExtractPdfJobData>);

describe('ExtractPdfProcessor', () => {
  let processor: ExtractPdfProcessor;
  let prisma: DeepMockProxy<PrismaClient>;
  let pdfExtractor: DeepMockProxy<PdfExtractorService>;
  let aiService: DeepMockProxy<AiService>;

  const jobData: ExtractPdfJobData = {
    quoteId: 'q1',
    processId: 'p1',
    filePath: 'uploads/test.pdf',
    product: InsuranceProduct.AUTO,
  };

  const rawText = 'texto extraído do pdf';
  const rawAiData = { insurer: 'BRADESCO', totalPremium: 1200 };
  const parsedData = { coverages: [], totalPremium: 1200 };

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    pdfExtractor = mockDeep<PdfExtractorService>();
    aiService = mockDeep<AiService>();
    processor = new ExtractPdfProcessor(
      prisma as unknown as PrismaService,
      pdfExtractor,
      aiService,
    );
    prisma.quote.update.mockResolvedValue({} as any);
  });

  it('extrai texto, chama a IA, valida e persiste extractedData com status PENDING_REVIEW', async () => {
    pdfExtractor.extractText.mockResolvedValue(rawText);
    aiService.extractQuoteData.mockResolvedValue(rawAiData);
    mockParseAutoQuoteData.mockReturnValue(parsedData);

    await processor.process(makeJob(jobData));

    expect(pdfExtractor.extractText).toHaveBeenCalledWith(jobData.filePath);
    expect(aiService.extractQuoteData).toHaveBeenCalledWith(rawText, InsuranceProduct.AUTO);
    expect(mockParseAutoQuoteData).toHaveBeenCalledWith(rawAiData);
    expect(prisma.quote.update).toHaveBeenCalledWith({
      where: { id: jobData.quoteId },
      data: { rawText, extractedData: parsedData, status: QuoteStatus.PENDING_REVIEW },
    });
  });

  it('persiste rawText e vai para PENDING_REVIEW quando a IA lança erro', async () => {
    pdfExtractor.extractText.mockResolvedValue(rawText);
    aiService.extractQuoteData.mockRejectedValue(new InternalServerErrorException('AI falhou'));

    await processor.process(makeJob(jobData));

    expect(prisma.quote.update).toHaveBeenCalledWith({
      where: { id: jobData.quoteId },
      data: { rawText, status: QuoteStatus.PENDING_REVIEW },
    });
  });

  it('persiste rawText e vai para PENDING_REVIEW quando o Zod falha na validação', async () => {
    pdfExtractor.extractText.mockResolvedValue(rawText);
    aiService.extractQuoteData.mockResolvedValue(rawAiData);
    mockParseAutoQuoteData.mockImplementation(() => {
      throw new UnprocessableEntityException('Dados inválidos');
    });

    await processor.process(makeJob(jobData));

    expect(prisma.quote.update).toHaveBeenCalledWith({
      where: { id: jobData.quoteId },
      data: { rawText, status: QuoteStatus.PENDING_REVIEW },
    });
  });

  it('atualiza status para FAILED e relança quando a extração do PDF lança erro', async () => {
    pdfExtractor.extractText.mockRejectedValue(new Error('PDF corrompido'));

    await expect(processor.process(makeJob(jobData))).rejects.toThrow('PDF corrompido');

    expect(prisma.quote.update).toHaveBeenCalledWith({
      where: { id: jobData.quoteId },
      data: { status: QuoteStatus.FAILED },
    });
  });

  it('atualiza status para FAILED quando o arquivo não existe', async () => {
    pdfExtractor.extractText.mockRejectedValue(new Error('ENOENT: no such file'));

    await expect(processor.process(makeJob(jobData))).rejects.toThrow();

    expect(prisma.quote.update).toHaveBeenCalledWith({
      where: { id: jobData.quoteId },
      data: { status: QuoteStatus.FAILED },
    });
  });
});
