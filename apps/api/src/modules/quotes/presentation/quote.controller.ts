import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { QuoteListResponseDto, QuoteListItemDto } from '../application/dtos/quote-list-item.dto';
import { QuoteResponseDto } from '../application/dtos/quote-response.dto';
import { UploadQuoteDto } from '../application/dtos/upload-quote.dto';
import { GetQuoteUseCase } from '../application/use-cases/get-quote.use-case';
import { ListQuotesUseCase } from '../application/use-cases/list-quotes.use-case';
import { ReviewQuoteUseCase } from '../application/use-cases/review-quote.use-case';
import { UploadQuoteUseCase } from '../application/use-cases/upload-quote.use-case';

@ApiTags('Quotes')
@ApiBearerAuth('access-token')
@Controller('quotes')
export class QuoteController {
  constructor(
    private readonly uploadQuote: UploadQuoteUseCase,
    private readonly listQuotes: ListQuotesUseCase,
    private readonly getQuote: GetQuoteUseCase,
    private readonly reviewQuote: ReviewQuoteUseCase,
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload de PDF de cotação para processamento assíncrono' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'product'],
      properties: {
        file: { type: 'string', format: 'binary' },
        product: { type: 'string', enum: ['auto'] },
        clientName: { type: 'string' },
      },
    },
  })
  @ApiOkResponse({ type: QuoteResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: { companyId: string },
    @Body() dto: UploadQuoteDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadQuote.execute(user.companyId, dto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cotações da empresa' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: QuoteListResponseDto })
  list(
    @CurrentUser() user: { companyId: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listQuotes.execute(user.companyId, Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cotação por ID' })
  @ApiOkResponse({ type: QuoteResponseDto })
  findOne(@CurrentUser() user: { companyId: string }, @Param('id') id: string) {
    return this.getQuote.execute(user.companyId, id);
  }

  @Patch(':id/review')
  @ApiOperation({ summary: 'Corretor revisa e confirma dados extraídos da cotação' })
  @ApiOkResponse({ type: QuoteResponseDto })
  review(
    @CurrentUser() user: { companyId: string },
    @Param('id') id: string,
    @Body() dto: ReviewQuoteDto,
  ) {
    return this.reviewQuote.execute(user.companyId, id, dto);
  }
}
