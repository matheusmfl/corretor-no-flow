import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { QuoteProcessStatus, QuoteStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QuotePdfTemplateService } from '../../../quotes/application/services/quote-pdf-template.service';

@Injectable()
export class GetPublicQuoteHtmlUseCase {
  constructor(
    private readonly prisma:    PrismaService,
    private readonly template:  QuotePdfTemplateService,
  ) {}

  async execute(token: string, quoteId: string): Promise<string> {
    const process = await this.prisma.quoteProcess.findUnique({
      where:   { publicToken: token },
      include: { quotes: { select: { id: true, insurer: true, status: true, name: true, extractedData: true } } },
    });

    if (!process || process.status !== QuoteProcessStatus.PUBLISHED) {
      throw new NotFoundException('Link de cotação não encontrado');
    }

    if (process.expiresAt && process.expiresAt < new Date()) {
      throw new GoneException('Este link de cotação expirou');
    }

    const quote = process.quotes.find((q) => q.id === quoteId);

    if (!quote) {
      throw new NotFoundException('Cotação não encontrada');
    }

    if (quote.status !== QuoteStatus.READY) {
      throw new NotFoundException('Cotação não disponível');
    }

    return this.template.render({
      insurer:       quote.insurer,
      name:          quote.name,
      extractedData: quote.extractedData as Record<string, unknown> | null,
    });
  }
}
