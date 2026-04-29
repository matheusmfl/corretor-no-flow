import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { QuoteProcessStatus, QuoteStatus } from '@prisma/client';
import type { PublicProcessResponse } from '@corretor/types';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class GetPublicProcessUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(token: string): Promise<PublicProcessResponse> {
    const process = await this.prisma.quoteProcess.findUnique({
      where: { publicToken: token },
      include: {
        company: {
          select: {
            displayName:  true,
            slug:         true,
            logoUrl:      true,
            primaryColor: true,
            whatsapp:     true,
          },
        },
        quotes: {
          select: {
            id:            true,
            insurer:       true,
            status:        true,
            name:          true,
            extractedData: true,
          },
        },
      },
    });

    if (!process || process.status !== QuoteProcessStatus.PUBLISHED) {
      throw new NotFoundException('Link de cotação não encontrado');
    }

    if (process.expiresAt && process.expiresAt < new Date()) {
      throw new GoneException('Este link de cotação expirou');
    }

    const readyQuotes = process.quotes.filter((q) => q.status === QuoteStatus.READY);

    if (readyQuotes.length === 0) {
      throw new NotFoundException('Nenhuma cotação disponível neste link');
    }

    // Registra primeira abertura
    if (!process.openedAt) {
      await this.prisma.quoteProcess.update({
        where: { id: process.id },
        data:  { openedAt: new Date() },
      });
    }

    return {
      process: {
        id:         process.id,
        product:    process.product,
        clientName: process.clientName,
        expiresAt:  process.expiresAt!.toISOString(),
      },
      quotes: readyQuotes.map((q) => ({
        id:            q.id,
        insurer:       q.insurer,
        name:          q.name,
        extractedData: q.extractedData as Record<string, unknown> | null,
      })),
      company: process.company,
    };
  }
}
