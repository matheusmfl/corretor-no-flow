import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Insurer } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QUEUE_NAMES } from '../../../queue/queue.constants';
import type { ExtractPdfJobData } from '../../../queue/queue.types';
import { QuoteStatus } from '../../domain/value-objects/quote-status.vo';

const SUPPORTED_INSURERS = new Set<Insurer>([Insurer.BRADESCO, Insurer.PORTO_SEGURO]);

@Injectable()
export class UploadAutoQuoteUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.EXTRACT_PDF) private readonly extractPdfQueue: Queue,
  ) {}

  async execute(
    companyId: string,
    processId: string,
    insurer: Insurer,
    filePath: string,
  ): Promise<{ quoteId: string; processId: string; status: 'queued' }> {
    if (!SUPPORTED_INSURERS.has(insurer)) {
      throw new BadRequestException(`Seguradora ${insurer} não possui processamento suportado`);
    }

    const process = await this.prisma.quoteProcess.findUnique({
      where: { id: processId },
    });
    if (!process) throw new NotFoundException('Processo de cotação não encontrado');
    if (process.companyId !== companyId) throw new ForbiddenException();

    const quote = await this.prisma.quote.create({
      data: {
        processId,
        insurer,
        status: QuoteStatus.PROCESSING,
        originalFileKey: filePath,
      },
    });

    const jobData: ExtractPdfJobData = {
      quoteId: quote.id,
      processId,
      filePath,
      product: process.product,
      insurer,
    };
    await this.extractPdfQueue.add('extract-pdf', jobData, {
      attempts: 2,
      backoff: { type: 'fixed', delay: 5000 },
    });

    return { quoteId: quote.id, processId, status: 'queued' };
  }
}
