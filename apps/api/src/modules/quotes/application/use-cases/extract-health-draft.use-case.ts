import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { stat } from 'node:fs/promises';
import type { HealthQuoteDraft } from '@corretor/types';
import { PdfExtractorService } from '../services/pdf-extractor.service';
import { HealthQuoteDraftExtractorService } from '../services/health-quote-draft-extractor.service';
import { detectInsurerFromText } from '../services/insurer-detector';

function errorForLog(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

function textHash(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 12);
}

@Injectable()
export class ExtractHealthDraftUseCase {
  private readonly logger = new Logger(ExtractHealthDraftUseCase.name);

  constructor(
    private readonly pdfExtractor: PdfExtractorService,
    private readonly healthExtractor: HealthQuoteDraftExtractorService,
  ) {}

  async execute(filePath: string, fileName: string): Promise<HealthQuoteDraft> {
    const traceId = randomUUID();
    const fileStat = await stat(filePath).catch(() => null);
    this.logger.log(
      `[HealthExtract][${traceId}] start file="${fileName}" sizeBytes=${fileStat?.size ?? '?'}`,
    );

    let text: string;
    const pdfStartedAt = Date.now();
    try {
      text = await this.pdfExtractor.extractText(filePath);
      const detection = detectInsurerFromText(text);
      this.logger.log(
        `[HealthExtract][${traceId}] pdf_text_extracted durationMs=${Date.now() - pdfStartedAt} chars=${text.length} lines=${text.split(/\r?\n/).length} hash=${textHash(text)} detectedProduct=${detection.detectedProduct ?? 'null'} productConfidence=${detection.productConfidence ?? 'low'} detectedInsurer=${detection.detectedInsurer ?? 'null'} insurerConfidence=${detection.confidence}`,
      );
    } catch (error) {
      this.logger.error(
        `[HealthExtract][${traceId}] pdf_text_failed durationMs=${Date.now() - pdfStartedAt} error="${errorForLog(error)}"`,
      );
      throw error;
    }

    const draftStartedAt = Date.now();
    try {
      const draft = await this.healthExtractor.extract(text, { sourceFiles: [fileName], traceId });
      this.logger.log(
        `[HealthExtract][${traceId}] draft_extracted durationMs=${Date.now() - draftStartedAt} lives=${draft.lives.length} quoteOptions=${draft.quoteOptions.length} warnings=${draft.warnings?.length ?? 0} client="${draft.clientName ?? ''}"`,
      );
      return draft;
    } catch (error) {
      this.logger.error(
        `[HealthExtract][${traceId}] draft_failed durationMs=${Date.now() - draftStartedAt} error="${errorForLog(error)}"`,
      );
      throw error;
    }
  }
}
