import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, UnprocessableEntityException } from '@nestjs/common';
import { Job } from 'bullmq';
import { Insurer } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PdfExtractorService } from '../application/services/pdf-extractor.service';
import { AiService } from '../../ai/ai.service';
import { parseAutoQuoteData } from '../domain/schemas/auto-quote.schema';
import { parseBradescoPaymentTable } from '../application/services/bradesco-payment-parser';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import { ExtractPdfJobData } from '../../queue/queue.types';
import { QuoteStatus } from '../domain/value-objects/quote-status.vo';

const INSURER_PAGE_LIMITS: Partial<Record<Insurer, number>> = {
  [Insurer.BRADESCO]: 3,
};

const INSURER_SHORT: Record<string, string> = {
  BRADESCO:     'Bradesco',
  PORTO_SEGURO: 'Porto Seguro',
  TOKIO_MARINE: 'Tokio Marine',
  SULAMERICA:   'SulAmérica',
  SUHAI:        'Suhai',
  ALIRO:        'Aliro',
  ALLIANZ:      'Allianz',
  YELLOW:       'Yellow',
};

function buildQuoteLabel(insurer: string, data: import('@corretor/types').AutoQuoteData): string {
  const base = INSURER_SHORT[insurer] ?? insurer;
  const type  = data.coverage?.vehicle?.deductibleType;
  const value = data.coverage?.vehicle?.deductible;

  const parts = [base];
  if (type) parts.push(type);
  if (value != null) {
    const formatted = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    parts.push(`(${formatted})`);
  }
  return parts.join(' — ');
}

@Processor(QUEUE_NAMES.EXTRACT_PDF)
export class ExtractPdfProcessor extends WorkerHost {
  private readonly logger = new Logger(ExtractPdfProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfExtractor: PdfExtractorService,
    private readonly aiService: AiService,
  ) {
    super();
  }

  private async parseWithRetry(quoteId: string, raw: Record<string, unknown>, product: string, insurer: Insurer) {
    try {
      return parseAutoQuoteData(raw);
    } catch (err) {
      if (!(err instanceof UnprocessableEntityException)) throw err;

      const zodError = (err as UnprocessableEntityException).message;
      this.logger.warn(`[${quoteId}] JSON inválido, tentando corrigir via IA. Erro: ${zodError}`);

      const corrected = await this.aiService.correctExtractedData(raw, zodError, product as any, insurer);
      return parseAutoQuoteData(corrected);
    }
  }

  async process(job: Job<ExtractPdfJobData>): Promise<void> {
    const { quoteId, filePath, product, insurer } = job.data;
    const maxPage = INSURER_PAGE_LIMITS[insurer];

    let rawText: string;

    try {
      rawText = await this.pdfExtractor.extractText(filePath, maxPage);
      this.logger.debug(`[${quoteId}] Texto extraído do PDF (${rawText.length} chars, máx ${maxPage ?? 'todas'} páginas):\n${rawText}`);
    } catch (error) {
      await this.prisma.quote.update({
        where: { id: quoteId },
        data: { status: QuoteStatus.FAILED },
      });
      throw error;
    }

    try {
      const raw = await this.aiService.extractQuoteData(rawText, product, insurer);

      // Parser determinístico sobrescreve paymentMethods (mais confiável que IA para tabelas)
      const parsedPayments = insurer === Insurer.BRADESCO
        ? parseBradescoPaymentTable(rawText)
        : null;
      if (parsedPayments) {
        this.logger.debug(`[${quoteId}] Pagamentos parseados deterministicamente: ${parsedPayments.map((m) => `${m.label}(${m.installments.length}x)`).join(', ')}`);
        raw.paymentMethods = parsedPayments as unknown as Record<string, unknown>[];
      }

      const extractedData = await this.parseWithRetry(quoteId, raw, product, insurer);

      const name = buildQuoteLabel(insurer, extractedData);

      const updated = await this.prisma.quote.update({
        where: { id: quoteId },
        data: { rawText, extractedData: extractedData as object, status: QuoteStatus.PENDING_REVIEW, name },
        select: { processId: true },
      });

      const clientName = extractedData.driver?.name ?? null;
      if (clientName) {
        await this.prisma.quoteProcess.update({
          where: { id: updated.processId },
          data: { clientName },
        });
      }
    } catch (error) {
      this.logger.error(`[${quoteId}] Falha definitiva na extração: ${(error as Error).message}`, (error as Error).stack);
      await this.prisma.quote.update({
        where: { id: quoteId },
        data: { rawText, status: QuoteStatus.FAILED },
      });
    }
  }
}
