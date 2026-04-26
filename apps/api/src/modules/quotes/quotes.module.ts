import { Module } from '@nestjs/common';
import { CancelQuoteProcessUseCase } from './application/use-cases/cancel-quote-process.use-case';
import { GetQuoteUseCase } from './application/use-cases/get-quote.use-case';
import { ListQuotesUseCase } from './application/use-cases/list-quotes.use-case';
import { ReviewQuoteUseCase } from './application/use-cases/review-quote.use-case';
import { UploadQuoteUseCase } from './application/use-cases/upload-quote.use-case';
import { SubmitQuoteForProcessingUseCase } from './application/use-cases/submit-quote-for-processing.use-case';
import { PdfExtractorService } from './application/services/pdf-extractor.service';
import { ExtractPdfProcessor } from './jobs/extract-pdf.processor';
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
    ExtractPdfProcessor,
  ],
})
export class QuotesModule {}
