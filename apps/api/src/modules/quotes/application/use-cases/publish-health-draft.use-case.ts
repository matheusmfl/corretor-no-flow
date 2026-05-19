import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Insurer, Prisma } from '@prisma/client';
import type { HealthQuoteDraft } from '@corretor/types';
import { PrismaService } from '../../../prisma/prisma.service';

const EXPIRES_IN_DAYS = 30;

function resolveBase(config: ConfigService): string {
  const raw =
    config.get<string>('PUBLIC_LINK_BASE_URL') ||
    config.get<string>('APP_URL') ||
    'http://localhost:3002';
  return raw.replace(/\/+$/, '');
}

@Injectable()
export class PublishHealthDraftUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async execute(
    companyId: string,
    draft: HealthQuoteDraft,
  ): Promise<{ publicToken: string; publicUrl: string; expiresAt: Date }> {
    const publicToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

    const process = await this.prisma.quoteProcess.create({
      data: {
        companyId,
        product: 'HEALTH',
        status: 'PUBLISHED',
        clientName: draft.clientName ?? null,
        publicToken,
        expiresAt,
        publicQuoteIds: [],
      },
    });

    // Armazena o HealthQuoteDraft completo em extractedData de uma Quote sentinela.
    // insurer usa SULAMERICA como placeholder obrigatório pelo schema — o valor real
    // está em draft.quoteOptions[].carrierOrOperator.
    const quote = await this.prisma.quote.create({
      data: {
        processId: process.id,
        insurer: Insurer.SULAMERICA,
        status: 'READY',
        name: 'health-draft',
        extractedData: draft as unknown as Prisma.InputJsonValue,
      },
    });

    await this.prisma.quoteProcess.update({
      where: { id: process.id },
      data: { publicQuoteIds: [quote.id] },
    });

    const base = resolveBase(this.config);
    return {
      publicToken,
      publicUrl: `${base}/c/${publicToken}`,
      expiresAt,
    };
  }
}
