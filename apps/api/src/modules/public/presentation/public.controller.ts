import { Controller, Get, Header, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/presentation/decorators/public.decorator';
import { GetPublicProcessUseCase } from '../application/use-cases/get-public-process.use-case';
import { GetPublicQuoteHtmlUseCase } from '../application/use-cases/get-public-quote-html.use-case';
import { PublicProcessResponseDto } from '../application/dtos/public-process-response.dto';

@ApiTags('Links')
@Controller('public/c')
export class PublicController {
  constructor(
    private readonly getPublicProcess:   GetPublicProcessUseCase,
    private readonly getPublicQuoteHtml: GetPublicQuoteHtmlUseCase,
  ) {}

  @Get(':token')
  @Public()
  @ApiOperation({ summary: 'Dados do processo público (JSON)' })
  @ApiOkResponse({ type: PublicProcessResponseDto })
  getByToken(@Param('token') token: string) {
    return this.getPublicProcess.execute(token);
  }

  @Get(':token/quote/:quoteId/html')
  @Public()
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({ summary: 'HTML renderizado de uma cotação individual' })
  @ApiProduces('text/html')
  async getQuoteHtml(
    @Param('token')   token:   string,
    @Param('quoteId') quoteId: string,
    @Res()            res:     Response,
  ) {
    const html = await this.getPublicQuoteHtml.execute(token, quoteId);
    res.send(html);
  }
}
