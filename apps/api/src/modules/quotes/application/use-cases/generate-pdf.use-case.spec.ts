import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, QuoteStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PdfRendererService } from '../services/pdf-renderer.service';
import { GeneratePdfUseCase } from './generate-pdf.use-case';

const makeProcess = (overrides = {}) => ({
  id: 'proc-1',
  companyId: 'comp-1',
  product: 'AUTO',
  status: 'PENDING_REVIEW',
  clientName: 'João Silva',
  quotes: [
    {
      id: 'q1',
      insurer: 'BRADESCO',
      status: QuoteStatus.READY,
      name: 'Bradesco-Auto-Completa',
      extractedData: { totalPremium: 1200, coverages: [] },
    },
  ],
  ...overrides,
});

describe('GeneratePdfUseCase', () => {
  let useCase: GeneratePdfUseCase;
  let prisma: DeepMockProxy<PrismaClient>;
  let renderer: DeepMockProxy<PdfRendererService>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    renderer = mockDeep<PdfRendererService>();
    useCase = new GeneratePdfUseCase(
      prisma as unknown as PrismaService,
      renderer,
    );
  });

  it('gera PDFs para todas as quotes READY e retorna os paths', async () => {
    const process = makeProcess();
    prisma.quoteProcess.findUnique.mockResolvedValue(process as any);
    renderer.renderToPdf.mockResolvedValue(Buffer.from('pdf-content'));
    prisma.quote.update.mockResolvedValue({} as any);

    const result = await useCase.execute('comp-1', 'proc-1');

    expect(renderer.renderToPdf).toHaveBeenCalledTimes(1);
    expect(prisma.quote.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'q1' },
        data: expect.objectContaining({ status: QuoteStatus.READY }),
      }),
    );
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ quoteId: 'q1', filePath: expect.stringContaining('q1') }),
      ]),
    );
  });

  it('ignora quotes que não estão em status READY', async () => {
    const process = makeProcess({
      quotes: [
        { id: 'q1', insurer: 'BRADESCO', status: QuoteStatus.PENDING_REVIEW, extractedData: {} },
        { id: 'q2', insurer: 'PORTO_SEGURO', status: QuoteStatus.READY, extractedData: {} },
      ],
    });
    prisma.quoteProcess.findUnique.mockResolvedValue(process as any);
    renderer.renderToPdf.mockResolvedValue(Buffer.from('pdf'));
    prisma.quote.update.mockResolvedValue({} as any);

    const result = await useCase.execute('comp-1', 'proc-1');

    expect(renderer.renderToPdf).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0].quoteId).toBe('q2');
  });

  it('lança NotFoundException quando o processo não existe', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(null);

    await expect(useCase.execute('comp-1', 'proc-1')).rejects.toThrow(NotFoundException);
  });

  it('lança ForbiddenException quando a empresa não é dona do processo', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(makeProcess() as any);

    await expect(useCase.execute('outra-empresa', 'proc-1')).rejects.toThrow(ForbiddenException);
  });

  it('lança BadRequestException quando não há quotes READY para gerar', async () => {
    const process = makeProcess({
      quotes: [{ id: 'q1', insurer: 'BRADESCO', status: QuoteStatus.PENDING_REVIEW, extractedData: {} }],
    });
    prisma.quoteProcess.findUnique.mockResolvedValue(process as any);

    await expect(useCase.execute('comp-1', 'proc-1')).rejects.toThrow(
      'Nenhuma cotação confirmada para gerar PDF',
    );
  });
});
