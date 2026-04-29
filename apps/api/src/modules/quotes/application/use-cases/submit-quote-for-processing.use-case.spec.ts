import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Insurer, InsuranceProduct, PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { SubmitQuoteForProcessingUseCase } from './submit-quote-for-processing.use-case';
import { QuoteStatus } from '../../domain/value-objects/quote-status.vo';

const COMPANY_ID  = 'c1';
const PROCESS_ID  = 'p1';
const QUOTE_ID    = 'q1';
const FILE_PATH   = 'uploads/test.pdf';
const INSURER     = Insurer.BRADESCO;
const PRODUCT     = InsuranceProduct.AUTO;

const makeProcess = (overrides: Record<string, unknown> = {}) => ({
  id: PROCESS_ID,
  companyId: COMPANY_ID,
  product: PRODUCT,
  quotes: [{ id: QUOTE_ID, status: QuoteStatus.PENDING, insurer: INSURER }],
  ...overrides,
});

describe('SubmitQuoteForProcessingUseCase', () => {
  let useCase: SubmitQuoteForProcessingUseCase;
  let prisma: DeepMockProxy<PrismaClient>;
  let queue: DeepMockProxy<Queue>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    queue = mockDeep<Queue>();
    useCase = new SubmitQuoteForProcessingUseCase(
      prisma as unknown as PrismaService,
      queue as unknown as Queue,
    );
  });

  it('atualiza status da cotação para PROCESSING e enfileira o job', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(makeProcess() as any);
    prisma.quote.update.mockResolvedValue({ id: QUOTE_ID, status: QuoteStatus.PROCESSING } as any);
    queue.add.mockResolvedValue({} as any);

    const result = await useCase.execute(COMPANY_ID, PROCESS_ID, QUOTE_ID, FILE_PATH);

    expect(prisma.quote.update).toHaveBeenCalledWith({
      where: { id: QUOTE_ID },
      data: { status: QuoteStatus.PROCESSING, originalFileKey: FILE_PATH },
    });
    expect(queue.add).toHaveBeenCalledWith(
      'extract-pdf',
      { quoteId: QUOTE_ID, processId: PROCESS_ID, filePath: FILE_PATH, product: PRODUCT, insurer: INSURER },
      { attempts: 2, backoff: { type: 'fixed', delay: 5000 } },
    );
    expect(result).toEqual({ quoteId: QUOTE_ID, processId: PROCESS_ID, status: 'queued' });
  });

  it('lança NotFoundException quando processo não existe', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(null);

    await expect(
      useCase.execute(COMPANY_ID, PROCESS_ID, QUOTE_ID, FILE_PATH),
    ).rejects.toThrow(NotFoundException);
  });

  it('lança ForbiddenException quando processo pertence a outra empresa', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(
      makeProcess({ companyId: 'outra-empresa' }) as any,
    );

    await expect(
      useCase.execute(COMPANY_ID, PROCESS_ID, QUOTE_ID, FILE_PATH),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lança NotFoundException quando cotação não pertence ao processo', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(
      makeProcess({ quotes: [] }) as any,
    );

    await expect(
      useCase.execute(COMPANY_ID, PROCESS_ID, QUOTE_ID, FILE_PATH),
    ).rejects.toThrow(NotFoundException);
  });

  it('lança BadRequestException quando cotação não está em status PENDING', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(
      makeProcess({ quotes: [{ id: QUOTE_ID, status: QuoteStatus.PROCESSING, insurer: INSURER }] }) as any,
    );

    await expect(
      useCase.execute(COMPANY_ID, PROCESS_ID, QUOTE_ID, FILE_PATH),
    ).rejects.toThrow(BadRequestException);
  });
});
