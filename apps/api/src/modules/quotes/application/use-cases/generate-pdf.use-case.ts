import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { QuoteStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PdfRendererService } from '../services/pdf-renderer.service';
import { QuotePdfTemplateService } from '../services/quote-pdf-template.service';

const OUTPUT_DIR = './generated';

@Injectable()
export class GeneratePdfUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly renderer: PdfRendererService,
    private readonly template: QuotePdfTemplateService = new QuotePdfTemplateService(),
  ) {}

  async execute(companyId: string, processId: string): Promise<{ quoteId: string; filePath: string }[]> {
    const process = await this.prisma.quoteProcess.findUnique({
      where: { id: processId },
      include: {
        quotes: true,
        company: {
          select: {
            displayName:  true,
            logoUrl:      true,
            primaryColor: true,
            whatsapp:     true,
            bio:          true,
            contactEmail: true,
            instagram:    true,
            website:      true,
            city:         true,
            state:        true,
            street:       true,
            neighborhood: true,
          },
        },
      },
    });

    if (!process) throw new NotFoundException('Processo não encontrado');
    if (process.companyId !== companyId) throw new ForbiddenException();

    const readyQuotes = process.quotes.filter((q) => q.status === QuoteStatus.READY);
    if (readyQuotes.length === 0) {
      throw new BadRequestException('Nenhuma cotação confirmada para gerar PDF');
    }

    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const results: { quoteId: string; filePath: string }[] = [];

    for (const quote of readyQuotes) {
      const html = this.template.render({
        insurer: quote.insurer,
        name: quote.name,
        extractedData: quote.extractedData as Record<string, unknown> | null,
        company: process.company,
      });

      const pdfBuffer = await this.renderer.renderToPdf(html);
      const filePath = path.join(OUTPUT_DIR, `${quote.id}.pdf`);
      await fs.writeFile(filePath, pdfBuffer);

      await this.prisma.quote.update({
        where: { id: quote.id },
        data: { status: QuoteStatus.READY, originalFileKey: filePath },
      });

      results.push({ quoteId: quote.id, filePath });
    }

    return results;
  }
}
