import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { QUEUE_NAMES } from '../../../queue/queue.constants';
import { ExtractPdfJobData } from '../../../queue/queue.types';
import { QuoteStatus } from '../../domain/value-objects/quote-status.vo';

@Injectable()
export class SubmitQuoteForProcessingUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.EXTRACT_PDF) private readonly extractPdfQueue: Queue,
  ) {}

  async execute(
    companyId: string,
    processId: string,
    quoteId: string,
    filePath: string,
  ): Promise<{ quoteId: string; processId: string; status: 'queued' }> {
    const process = await this.prisma.quoteProcess.findUnique({
      where: { id: processId },
      include: { quotes: true },
    });

    if (!process) throw new NotFoundException('Processo de cotação não encontrado');
    if (process.companyId !== companyId) throw new ForbiddenException();

    const quote = (process.quotes as { id: string; status: string }[]).find(
      (q) => q.id === quoteId,
    );
    if (!quote) throw new NotFoundException('Cotação não encontrada neste processo');
    if (quote.status !== QuoteStatus.PENDING) {
      throw new BadRequestException('Cotação não está em status PENDING');
    }

    await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.PROCESSING, originalFileKey: filePath },
    });

    const jobData: ExtractPdfJobData = { quoteId, processId, filePath, product: process.product };
    await this.extractPdfQueue.add('extract-pdf', jobData);

    return { quoteId, processId, status: 'queued' };
  }
}
