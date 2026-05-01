import { InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Insurer, InsuranceProduct, PrismaClient } from '@prisma/client';
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

jest.mock('../application/services/porto-payment-parser', () => ({
  parsePortoPaymentTable: jest.fn(),
}));

import { parseAutoQuoteData } from '../domain/schemas/auto-quote.schema';
import { parsePortoPaymentTable } from '../application/services/porto-payment-parser';

const mockParseAutoQuoteData = parseAutoQuoteData as jest.Mock;
const mockParsePortoPaymentTable = parsePortoPaymentTable as jest.Mock;

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
    insurer: Insurer.BRADESCO,
  };

  const rawText = 'texto extraído do pdf';
  const rawAiData = { insurer: 'Bradesco Auto/RE', vehicle: { model: 'X' }, premium: { total: 1200 } };
  const parsedData = { vehicle: { model: 'X' }, premium: { total: 1200 } };

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

  it('extrai texto (máx 3 páginas para Bradesco), chama a IA e persiste extractedData com status PENDING_REVIEW', async () => {
    pdfExtractor.extractText.mockResolvedValue(rawText);
    aiService.extractQuoteData.mockResolvedValue(rawAiData);
    mockParseAutoQuoteData.mockReturnValue(parsedData);

    await processor.process(makeJob(jobData));

    // Bradesco limita a 3 páginas
    expect(pdfExtractor.extractText).toHaveBeenCalledWith(jobData.filePath, 3);
    // IA recebe rawText, product e insurer
    expect(aiService.extractQuoteData).toHaveBeenCalledWith(rawText, InsuranceProduct.AUTO, Insurer.BRADESCO);
    expect(mockParseAutoQuoteData).toHaveBeenCalledWith(rawAiData);
    expect(prisma.quote.update).toHaveBeenCalledWith({
      where: { id: jobData.quoteId },
      data: { rawText, extractedData: parsedData, status: QuoteStatus.PENDING_REVIEW, name: 'Bradesco' },
      select: { processId: true },
    });
  });

  it('vai para FAILED quando a IA lança erro irrecuperável', async () => {
    pdfExtractor.extractText.mockResolvedValue(rawText);
    aiService.extractQuoteData.mockRejectedValue(new InternalServerErrorException('AI falhou'));

    await processor.process(makeJob(jobData));

    expect(prisma.quote.update).toHaveBeenCalledWith({
      where: { id: jobData.quoteId },
      data: { rawText, status: QuoteStatus.FAILED },
    });
  });

  it('tenta self-correction quando Zod falha e vai para FAILED se a correção também falha', async () => {
    pdfExtractor.extractText.mockResolvedValue(rawText);
    aiService.extractQuoteData.mockResolvedValue(rawAiData);
    aiService.correctExtractedData.mockResolvedValue(rawAiData);
    // Zod falha nas duas tentativas (original e corrigido)
    mockParseAutoQuoteData.mockImplementation(() => {
      throw new UnprocessableEntityException('Dados inválidos');
    });

    await processor.process(makeJob(jobData));

    // Deve ter chamado correctExtractedData com product + insurer
    expect(aiService.correctExtractedData).toHaveBeenCalledWith(
      rawAiData,
      expect.stringContaining('Dados inválidos'),
      InsuranceProduct.AUTO,
      Insurer.BRADESCO,
    );
    expect(prisma.quote.update).toHaveBeenCalledWith({
      where: { id: jobData.quoteId },
      data: { rawText, status: QuoteStatus.FAILED },
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

  describe('Porto Seguro', () => {
    const portoJobData: ExtractPdfJobData = {
      quoteId: 'q-porto',
      processId: 'p-porto',
      filePath: 'uploads/porto-test.pdf',
      product: InsuranceProduct.AUTO,
      insurer: Insurer.PORTO_SEGURO,
    };

    beforeEach(() => {
      mockParsePortoPaymentTable.mockReturnValue(null);
    });

    it('extrai texto sem limite de páginas (Porto não tem restrição)', async () => {
      pdfExtractor.extractText.mockResolvedValue(rawText);
      aiService.extractQuoteData.mockResolvedValue(rawAiData);
      mockParseAutoQuoteData.mockReturnValue(parsedData);

      await processor.process(makeJob(portoJobData));

      expect(pdfExtractor.extractText).toHaveBeenCalledWith(portoJobData.filePath, undefined);
    });

    it('chama IA com Insurer.PORTO_SEGURO e persiste PENDING_REVIEW', async () => {
      pdfExtractor.extractText.mockResolvedValue(rawText);
      aiService.extractQuoteData.mockResolvedValue(rawAiData);
      mockParseAutoQuoteData.mockReturnValue(parsedData);

      await processor.process(makeJob(portoJobData));

      expect(aiService.extractQuoteData).toHaveBeenCalledWith(rawText, InsuranceProduct.AUTO, Insurer.PORTO_SEGURO);
      expect(prisma.quote.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: QuoteStatus.PENDING_REVIEW }),
        }),
      );
    });

    it('substitui paymentMethods no payload antes de chamar parseAutoQuoteData', async () => {
      const portoPayments = [{ id: 'debito', type: 'debit' as const, label: 'Débito', installments: [{ number: 1, amount: 100, hasInterest: false }] }];
      mockParsePortoPaymentTable.mockReturnValue(portoPayments);
      pdfExtractor.extractText.mockResolvedValue(rawText);
      aiService.extractQuoteData.mockResolvedValue({ ...rawAiData });
      mockParseAutoQuoteData.mockReturnValue(parsedData);

      await processor.process(makeJob(portoJobData));

      expect(mockParsePortoPaymentTable).toHaveBeenCalledWith(rawText);
      // paymentMethods determinísticos devem chegar no parseAutoQuoteData
      expect(mockParseAutoQuoteData).toHaveBeenCalledWith(
        expect.objectContaining({ paymentMethods: portoPayments }),
      );
    });
  });
});
