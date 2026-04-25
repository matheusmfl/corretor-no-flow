import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class GetQuoteUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(companyId: string, quoteId: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) throw new NotFoundException('Cotação não encontrada.');
    if (quote.companyId !== companyId) throw new ForbiddenException();
    return quote;
  }
}
