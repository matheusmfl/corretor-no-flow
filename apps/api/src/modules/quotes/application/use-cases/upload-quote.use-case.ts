import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { QuoteProcessStatus, QuoteStatus } from '../../domain/value-objects/quote-status.vo';
import { CreateQuoteProcessDto } from '../dtos/upload-quote.dto';

@Injectable()
export class UploadQuoteUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(companyId: string, dto: CreateQuoteProcessDto) {
    const process = await this.prisma.quoteProcess.create({
      data: {
        companyId,
        product: dto.product,
        status: QuoteProcessStatus.DRAFT,
        clientName: dto.clientName ?? null,
        clientPhone: dto.clientPhone ?? null,
        quotes: {
          create: dto.insurers.map((insurer) => ({
            insurer,
            status: QuoteStatus.PENDING,
          })),
        },
      },
      include: { quotes: true },
    });

    return process;
  }
}
