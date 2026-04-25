import { BadRequestException, Injectable } from '@nestjs/common';
import { InsuranceProduct } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QuoteStatus } from '../../domain/value-objects/quote-status.vo';
import { UploadQuoteDto } from '../dtos/upload-quote.dto';

@Injectable()
export class UploadQuoteUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(companyId: string, dto: UploadQuoteDto, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo PDF é obrigatório.');

    const quote = await this.prisma.quote.create({
      data: {
        companyId,
        product: dto.product as InsuranceProduct,
        status: QuoteStatus.PENDING,
        clientName: dto.clientName ?? null,
        originalFileKey: `originals/${companyId}/${Date.now()}.pdf`,
      },
    });

    // TODO: enqueue extract-pdf job with quote.id + file buffer

    return quote;
  }
}
