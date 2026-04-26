import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { PdfExtractorService } from '../application/services/pdf-extractor.service';
import { AiService } from '../../ai/ai.service';
import { parseAutoQuoteData } from '../domain/schemas/auto-quote.schema';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import { ExtractPdfJobData } from '../../queue/queue.types';
import { QuoteStatus } from '../domain/value-objects/quote-status.vo';

@Processor(QUEUE_NAMES.EXTRACT_PDF)
export class ExtractPdfProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfExtractor: PdfExtractorService,
    private readonly aiService: AiService,
  ) {
    super();
  }

  async process(job: Job<ExtractPdfJobData>): Promise<void> {
    const { quoteId, filePath, product } = job.data;

    let rawText: string;

    try {
      rawText = await this.pdfExtractor.extractText(filePath);
    } catch (error) {
      await this.prisma.quote.update({
        where: { id: quoteId },
        data: { status: QuoteStatus.FAILED },
      });
      throw error;
    }

    try {
      const raw = await this.aiService.extractQuoteData(rawText, product);
      const extractedData = parseAutoQuoteData(raw);

      await this.prisma.quote.update({
        where: { id: quoteId },
        data: { rawText, extractedData, status: QuoteStatus.PENDING_REVIEW },
      });
    } catch {
      await this.prisma.quote.update({
        where: { id: quoteId },
        data: { rawText, status: QuoteStatus.PENDING_REVIEW },
      });
    }
  }
}
