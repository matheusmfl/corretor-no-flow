import { Module } from '@nestjs/common';
import { CancelQuoteProcessUseCase } from './application/use-cases/cancel-quote-process.use-case';
import { GetQuoteUseCase } from './application/use-cases/get-quote.use-case';
import { ListQuotesUseCase } from './application/use-cases/list-quotes.use-case';
import { ReviewQuoteUseCase } from './application/use-cases/review-quote.use-case';
import { UploadQuoteUseCase } from './application/use-cases/upload-quote.use-case';
import { SubmitQuoteForProcessingUseCase } from './application/use-cases/submit-quote-for-processing.use-case';
import { PdfExtractorService } from './application/services/pdf-extractor.service';
import { PdfRendererService } from './application/services/pdf-renderer.service';
import { QuotePdfTemplateService } from './application/services/quote-pdf-template.service';
import { ExtractPdfProcessor } from './jobs/extract-pdf.processor';
import { GeneratePdfUseCase } from './application/use-cases/generate-pdf.use-case';
import { GenerateLinkUseCase } from './application/use-cases/generate-link.use-case';
import { GetProcessMetricsUseCase } from './application/use-cases/get-process-metrics.use-case';
import { DetectInsurerUseCase } from './application/use-cases/detect-insurer.use-case';
import { UploadAutoQuoteUseCase } from './application/use-cases/upload-auto-quote.use-case';
import { ResetQuoteBatchUseCase } from './application/use-cases/reset-quote-batch.use-case';
import { RemoveQuoteFromProcessUseCase } from './application/use-cases/remove-quote-from-process.use-case';
import { HealthQuoteDraftExtractorService } from './application/services/health-quote-draft-extractor.service';
import { HealthManualTablePricingService } from './application/services/health-manual-table-pricing.service';
import { HealthSpreadsheetMatrixService } from './application/services/health-spreadsheet-matrix.service';
import { HealthXlsxExportService } from './application/services/health-xlsx-export.service';
import { GenerateHealthXlsxUseCase } from './application/use-cases/generate-health-xlsx.use-case';
import { QuoteController } from './presentation/quote.controller';
import { QueueModule } from '../queue/queue.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [QueueModule, AiModule],
  controllers: [QuoteController],
  providers: [
    UploadQuoteUseCase,
    ListQuotesUseCase,
    GetQuoteUseCase,
    ReviewQuoteUseCase,
    CancelQuoteProcessUseCase,
    SubmitQuoteForProcessingUseCase,
    PdfExtractorService,
    PdfRendererService,
    QuotePdfTemplateService,
    GeneratePdfUseCase,
    GenerateLinkUseCase,
    GetProcessMetricsUseCase,
    DetectInsurerUseCase,
    UploadAutoQuoteUseCase,
    ResetQuoteBatchUseCase,
    RemoveQuoteFromProcessUseCase,
    HealthQuoteDraftExtractorService,
    HealthManualTablePricingService,
    HealthSpreadsheetMatrixService,
    HealthXlsxExportService,
    GenerateHealthXlsxUseCase,
    ExtractPdfProcessor,
  ],
})
export class QuotesModule {}
