import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { unlink } from 'node:fs';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class RemoveQuoteFromProcessUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    companyId: string,
    processId: string,
    quoteId: string,
  ): Promise<{ deleted: true }> {
    const process = await this.prisma.quoteProcess.findUnique({
      where: { id: processId },
      include: { quotes: { select: { id: true, originalFileKey: true } } },
    });

    if (!process) throw new NotFoundException('Processo de cotação não encontrado');
    if (process.companyId !== companyId) throw new ForbiddenException();

    const quote = (process.quotes as { id: string; originalFileKey: string | null }[]).find(
      (q) => q.id === quoteId,
    );
    if (!quote) throw new NotFoundException('Cotação não encontrada neste processo');

    await this.prisma.quote.delete({ where: { id: quoteId } });

    // Best-effort: I/O errors are tolerated, they must not break the response
    if (quote.originalFileKey) unlink(quote.originalFileKey, () => {});

    return { deleted: true };
  }
}

