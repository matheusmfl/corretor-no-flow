import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { QuoteStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

const EXPIRES_IN_DAYS = 30;
const BASE_URL = process.env.APP_URL ?? 'http://localhost:3000';

@Injectable()
export class GenerateLinkUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    companyId: string,
    processId: string,
    quoteIds?: string[],
  ): Promise<{ publicToken: string; publicUrl: string; expiresAt: Date }> {
    const process = await this.prisma.quoteProcess.findUnique({
      where: { id: processId },
      include: { quotes: { select: { id: true, status: true } } },
    });

    if (!process) throw new NotFoundException('Processo não encontrado');
    if (process.companyId !== companyId) throw new ForbiddenException();

    const allReady = process.quotes.filter((q) => q.status === QuoteStatus.READY);

    if (quoteIds !== undefined) {
      const notReady = quoteIds.filter((id) => !allReady.some((q) => q.id === id));
      if (notReady.length > 0) {
        throw new BadRequestException(`Cotações não confirmadas não podem ser incluídas: ${notReady.join(', ')}`);
      }
    }

    const selectedIds = quoteIds !== undefined
      ? allReady.filter((q) => quoteIds.includes(q.id)).map((q) => q.id)
      : allReady.map((q) => q.id);

    if (selectedIds.length === 0) throw new BadRequestException('Nenhuma cotação confirmada para publicar');

    const publicToken = process.publicToken ?? crypto.randomUUID();
    const expiresAt = new Date(Date.now() + EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.quoteProcess.update({
      where: { id: processId },
      data: { publicToken, expiresAt, status: 'PUBLISHED', publicQuoteIds: selectedIds },
    });

    return {
      publicToken,
      publicUrl: `${BASE_URL}/c/${publicToken}`,
      expiresAt,
    };
  }
}
