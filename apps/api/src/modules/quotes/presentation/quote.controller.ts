import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { buildQuotePdfFilename } from '../application/services/quote-filename';
import * as crypto from 'crypto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { ReviewQuoteDto } from '../application/dtos/review-quote.dto';
import { QuoteProcessListResponseDto } from '../application/dtos/quote-list-item.dto';
import { QuoteProcessResponseDto } from '../application/dtos/quote-response.dto';
import { CreateQuoteProcessDto } from '../application/dtos/upload-quote.dto';
import { CancelQuoteProcessUseCase } from '../application/use-cases/cancel-quote-process.use-case';
import { GetQuoteUseCase } from '../application/use-cases/get-quote.use-case';
import { ListQuotesUseCase } from '../application/use-cases/list-quotes.use-case';
import { ReviewQuoteUseCase } from '../application/use-cases/review-quote.use-case';
import { UploadQuoteUseCase } from '../application/use-cases/upload-quote.use-case';
import { SubmitQuoteForProcessingUseCase } from '../application/use-cases/submit-quote-for-processing.use-case';
import { GeneratePdfUseCase } from '../application/use-cases/generate-pdf.use-case';
import { GenerateLinkUseCase } from '../application/use-cases/generate-link.use-case';
import { GetProcessMetricsUseCase } from '../application/use-cases/get-process-metrics.use-case';

const pdfStorage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

@ApiTags('Quotes')
@ApiBearerAuth('access-token')
@Controller('quotes')
export class QuoteController {
  constructor(
    private readonly uploadQuote: UploadQuoteUseCase,
    private readonly listQuotes: ListQuotesUseCase,
    private readonly getQuote: GetQuoteUseCase,
    private readonly reviewQuote: ReviewQuoteUseCase,
    private readonly cancelQuoteProcess: CancelQuoteProcessUseCase,
    private readonly submitQuoteForProcessing: SubmitQuoteForProcessingUseCase,
    private readonly generatePdf: GeneratePdfUseCase,
    private readonly generateLink: GenerateLinkUseCase,
    private readonly getProcessMetrics: GetProcessMetricsUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar processo de cotação' })
  @ApiOkResponse({ type: QuoteProcessResponseDto })
  create(
    @CurrentUser() user: { companyId: string },
    @Body() dto: CreateQuoteProcessDto,
  ) {
    return this.uploadQuote.execute(user.companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar processos de cotação da empresa' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiOkResponse({ type: QuoteProcessListResponseDto })
  list(
    @CurrentUser() user: { companyId: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.listQuotes.execute(user.companyId, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status: status as any,
      search: search || undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar processo de cotação por ID' })
  @ApiOkResponse({ type: QuoteProcessResponseDto })
  findOne(@CurrentUser() user: { companyId: string }, @Param('id') id: string) {
    return this.getQuote.execute(user.companyId, id);
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Métricas de engajamento do link público do processo' })
  metrics(@CurrentUser() _user: { companyId: string }, @Param('id') id: string) {
    return this.getProcessMetrics.execute(id);
  }

  @Patch(':processId/quote/:quoteId/review')
  @ApiOperation({ summary: 'Corretor revisa e confirma dados extraídos da cotação individual' })
  @ApiOkResponse({ type: QuoteProcessResponseDto })
  review(
    @CurrentUser() user: { companyId: string },
    @Param('quoteId') quoteId: string,
    @Body() dto: ReviewQuoteDto,
  ) {
    return this.reviewQuote.execute(user.companyId, quoteId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancelar processo de cotação (arquiva)' })
  @ApiOkResponse({ type: QuoteProcessResponseDto })
  cancel(@CurrentUser() user: { companyId: string }, @Param('id') id: string) {
    return this.cancelQuoteProcess.execute(user.companyId, id);
  }

  @Post(':id/generate')
  @ApiOperation({ summary: 'Gera PDFs para todas as cotações confirmadas do processo' })
  generate(@CurrentUser() user: { companyId: string }, @Param('id') id: string) {
    return this.generatePdf.execute(user.companyId, id);
  }

  @Get(':processId/quotes/:quoteId/pdf')
  @ApiOperation({ summary: 'Download do PDF gerado para uma cotação' })
  async downloadPdf(
    @CurrentUser() user: { companyId: string },
    @Param('processId') processId: string,
    @Param('quoteId') quoteId: string,
    @Res() res: Response,
  ) {
    const process = await this.getQuote.execute(user.companyId, processId);
    const quote = (process as any).quotes?.find((q: any) => q.id === quoteId);
    if (!quote?.originalFileKey) throw new NotFoundException('PDF não gerado para esta cotação');
    const absolutePath = path.resolve(quote.originalFileKey);
    const filename = buildQuotePdfFilename(quote.insurer, quote.extractedData as Record<string, unknown> | null);
    res.download(absolutePath, filename);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Gera link público para o segurado visualizar as cotações' })
  publish(@CurrentUser() user: { companyId: string }, @Param('id') id: string) {
    return this.generateLink.execute(user.companyId, id);
  }

  @Post(':processId/quotes/:quoteId/upload')
  @HttpCode(202)
  @UseInterceptors(FileInterceptor('file', { storage: pdfStorage }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload PDF de cotação para processamento assíncrono' })
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  uploadFile(
    @CurrentUser() user: { companyId: string },
    @Param('processId') processId: string,
    @Param('quoteId') quoteId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Arquivo PDF é obrigatório');
    return this.submitQuoteForProcessing.execute(user.companyId, processId, quoteId, file.path);
  }
}
