import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { unlink } from 'node:fs';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ResetQuoteBatchUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(companyId: string, processId: string): Promise<{ deleted: number }> {
    const process = await this.prisma.quoteProcess.findUnique({ where: { id: processId } });
    if (!process) throw new NotFoundException('Processo de cotação não encontrado');
    if (process.companyId !== companyId) throw new ForbiddenException();

    // Collect file paths before deletion so we can clean up PII from disk
    const quotes = await this.prisma.quote.findMany({
      where: { processId },
      select: { originalFileKey: true },
    });

    const { count } = await this.prisma.quote.deleteMany({ where: { processId } });

    // Best-effort: I/O errors are tolerated, they must not break the response
    for (const { originalFileKey } of quotes) {
      if (originalFileKey) unlink(originalFileKey, () => {});
    }

    return { deleted: count };
  }
}
