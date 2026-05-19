import { Injectable } from '@nestjs/common';
import type { HealthQuoteDraft } from '@corretor/types';
import { PdfExtractorService } from '../services/pdf-extractor.service';
import { HealthQuoteDraftExtractorService } from '../services/health-quote-draft-extractor.service';

@Injectable()
export class ExtractHealthDraftUseCase {
  constructor(
    private readonly pdfExtractor: PdfExtractorService,
    private readonly healthExtractor: HealthQuoteDraftExtractorService,
  ) {}

  async execute(filePath: string, fileName: string): Promise<HealthQuoteDraft> {
    const text = await this.pdfExtractor.extractText(filePath);
    return this.healthExtractor.extract(text, { sourceFiles: [fileName] });
  }
}
