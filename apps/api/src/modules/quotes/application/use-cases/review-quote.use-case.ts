import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QuoteStatus } from '../../domain/value-objects/quote-status.vo';
import { ReviewQuoteDto } from '../dtos/review-quote.dto';

@Injectable()
export class ReviewQuoteUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(companyId: string, quoteId: string, dto: ReviewQuoteDto) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { process: true },
    });
    if (!quote) throw new NotFoundException('Cotação não encontrada.');
    if (quote.process.companyId !== companyId) throw new ForbiddenException();

    return this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        name: dto.name,
        extractedData: dto.extractedData as Prisma.InputJsonValue,
        status: QuoteStatus.READY,
      },
    });
  }
}
