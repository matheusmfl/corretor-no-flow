import { Module } from '@nestjs/common';
import { GetQuoteUseCase } from './application/use-cases/get-quote.use-case';
import { ListQuotesUseCase } from './application/use-cases/list-quotes.use-case';
import { ReviewQuoteUseCase } from './application/use-cases/review-quote.use-case';
import { UploadQuoteUseCase } from './application/use-cases/upload-quote.use-case';
import { QuoteController } from './presentation/quote.controller';

@Module({
  controllers: [QuoteController],
  providers: [UploadQuoteUseCase, ListQuotesUseCase, GetQuoteUseCase, ReviewQuoteUseCase],
})
export class QuotesModule {}
