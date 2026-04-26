import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { QuoteProcessStatus } from '../../domain/value-objects/quote-status.vo';

const CANCELLABLE_STATUSES: QuoteProcessStatus[] = [
  QuoteProcessStatus.DRAFT,
  QuoteProcessStatus.PROCESSING,
  QuoteProcessStatus.PENDING_REVIEW,
  QuoteProcessStatus.READY,
];

@Injectable()
export class CancelQuoteProcessUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(companyId: string, processId: string) {
    const process = await this.prisma.quoteProcess.findUnique({ where: { id: processId } });

    if (!process) throw new NotFoundException('Processo de cotação não encontrado');
    if (process.companyId !== companyId) throw new ForbiddenException('Acesso negado');
    if (!CANCELLABLE_STATUSES.includes(process.status as QuoteProcessStatus)) {
      throw new BadRequestException(`Não é possível cancelar um processo com status ${process.status}`);
    }

    return this.prisma.quoteProcess.update({
      where: { id: processId },
      data: { status: QuoteProcessStatus.ARCHIVED },
    });
  }
}
