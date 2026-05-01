import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, UnprocessableEntityException } from '@nestjs/common';
import { Job } from 'bullmq';
import { Insurer } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PdfExtractorService } from '../application/services/pdf-extractor.service';
import { AiService } from '../../ai/ai.service';
import { parseAutoQuoteData } from '../domain/schemas/auto-quote.schema';
import { parseBradescoPaymentTable } from '../application/services/bradesco-payment-parser';
import { parsePortoPaymentTable } from '../application/services/porto-payment-parser';
import { UNRELIABLE_DEDUCTIBLE_TYPES } from '../application/services/quote-filename';
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
  const rawType = data.coverage?.vehicle?.deductibleType;
  const type = rawType && !UNRELIABLE_DEDUCTIBLE_TYPES.has(rawType) ? rawType : undefined;
  const premiumTotal = data.premium?.total;

  const parts = [base];
  if (type) parts.push(type);
  if (premiumTotal != null) {
    const formatted = premiumTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
    const zodStart = Date.now();
    try {
      const data = parseAutoQuoteData(raw);
      this.logger.debug(`[${quoteId}] zodValidate durationMs=${Date.now() - zodStart} retried=false`);
      return data;
    } catch (err) {
      if (!(err instanceof UnprocessableEntityException)) throw err;

      const zodError = (err as UnprocessableEntityException).message;
      this.logger.warn(`[${quoteId}] zodValidate failed durationMs=${Date.now() - zodStart} — triggering Groq correction. Error: ${zodError}`);

      const correctionStart = Date.now();
      const corrected = await this.aiService.correctExtractedData(raw, zodError, product as any, insurer, { quoteId });
      this.logger.debug(`[${quoteId}] groqCorrection durationMs=${Date.now() - correctionStart}`);

      const retryStart = Date.now();
      const data = parseAutoQuoteData(corrected);
      this.logger.debug(`[${quoteId}] zodValidateRetry durationMs=${Date.now() - retryStart} retried=true`);
      return data;
    }
  }

  async process(job: Job<ExtractPdfJobData>): Promise<void> {
    const { quoteId, filePath, product, insurer } = job.data;
    const maxPage = INSURER_PAGE_LIMITS[insurer];
    const jobStart = Date.now();

    let rawText: string;

    const pdfStart = Date.now();
    try {
      rawText = await this.pdfExtractor.extractText(filePath, maxPage);
      this.logger.debug(
        `[${quoteId}] pdfExtract durationMs=${Date.now() - pdfStart} chars=${rawText.length} maxPage=${maxPage ?? 'all'}`,
      );
    } catch (error) {
      this.logger.debug(`[${quoteId}] pdfExtract durationMs=${Date.now() - pdfStart} FAILED`);
      await this.prisma.quote.update({
        where: { id: quoteId },
        data: { status: QuoteStatus.FAILED },
      });
      throw error;
    }

    try {
      const raw = await this.aiService.extractQuoteData(rawText, product, insurer, { quoteId });

      // Parser determinístico sobrescreve paymentMethods (mais confiável que IA para tabelas)
      const parserStart = Date.now();
      let parsedPayments = null;
      if (insurer === Insurer.BRADESCO) parsedPayments = parseBradescoPaymentTable(rawText);
      else if (insurer === Insurer.PORTO_SEGURO) parsedPayments = parsePortoPaymentTable(rawText);
      this.logger.debug(
        `[${quoteId}] deterministicParser durationMs=${Date.now() - parserStart} found=${parsedPayments !== null}`,
      );
      if (parsedPayments) {
        raw.paymentMethods = parsedPayments as unknown as Record<string, unknown>[];
      }

      const extractedData = await this.parseWithRetry(quoteId, raw, product, insurer);

      const name = buildQuoteLabel(insurer, extractedData);

      const dbStart = Date.now();
      const updated = await this.prisma.quote.update({
        where: { id: quoteId },
        data: { rawText, extractedData: extractedData as object, status: QuoteStatus.PENDING_REVIEW, name },
        select: { processId: true },
      });
      this.logger.debug(`[${quoteId}] dbWrite durationMs=${Date.now() - dbStart}`);

      const clientName = extractedData.driver?.name ?? null;
      if (clientName) {
        const clientNameStart = Date.now();
        await this.prisma.quoteProcess.update({
          where: { id: updated.processId },
          data: { clientName },
        });
        this.logger.debug(`[${quoteId}] processClientNameWrite durationMs=${Date.now() - clientNameStart}`);
      }

      this.logger.log(
        `[TIMING] quoteId=${quoteId} insurer=${insurer} product=${product} totalMs=${Date.now() - jobStart}`,
      );
    } catch (error) {
      this.logger.error(
        `[${quoteId}] Falha definitiva na extração após ${Date.now() - jobStart}ms: ${(error as Error).message}`,
        (error as Error).stack,
      );
      await this.prisma.quote.update({
        where: { id: quoteId },
        data: { rawText, status: QuoteStatus.FAILED },
      });
    }
  }
}
