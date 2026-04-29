import { Module } from '@nestjs/common';
import { GetPublicProcessUseCase } from './application/use-cases/get-public-process.use-case';
import { GetPublicQuoteHtmlUseCase } from './application/use-cases/get-public-quote-html.use-case';
import { QuotePdfTemplateService } from '../quotes/application/services/quote-pdf-template.service';
import { PublicController } from './presentation/public.controller';

@Module({
  controllers: [PublicController],
  providers:   [GetPublicProcessUseCase, GetPublicQuoteHtmlUseCase, QuotePdfTemplateService],
})
export class PublicModule {}
