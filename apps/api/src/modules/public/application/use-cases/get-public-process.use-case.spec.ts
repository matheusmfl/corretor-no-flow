import { GoneException, NotFoundException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, QuoteProcessStatus, QuoteStatus, InsuranceProduct, Insurer } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetPublicProcessUseCase } from './get-public-process.use-case';

const TOKEN   = 'public-token-abc';
const NOW     = new Date('2026-04-27T12:00:00Z');
const FUTURE  = new Date('2026-05-27T12:00:00Z');
const PAST    = new Date('2026-04-26T12:00:00Z');

const makeProcess = (overrides: Record<string, unknown> = {}) => ({
  id:          'proc-1',
  companyId:   'co-1',
  product:     InsuranceProduct.AUTO,
  status:      QuoteProcessStatus.PUBLISHED,
  publicToken: TOKEN,
  expiresAt:   FUTURE,
  openedAt:    null,
  clientName:  'Fabiano Alves',
  clientPhone: null,
  company: {
    displayName:  'Corretora Teste',
    slug:         'corretora-teste',
    logoUrl:      null,
    primaryColor: '#cc0000',
    whatsapp:     '11999999999',
  },
  quotes: [
    {
      id:            'q-ready',
      insurer:       Insurer.BRADESCO,
      status:        QuoteStatus.READY,
      name:          'Bradesco — Auto',
      extractedData: { premium: { total: 3448.5 } },
    },
    {
      id:            'q-failed',
      insurer:       Insurer.PORTO_SEGURO,
      status:        QuoteStatus.FAILED,
      name:          null,
      extractedData: null,
    },
  ],
  ...overrides,
});

describe('GetPublicProcessUseCase', () => {
  let useCase: GetPublicProcessUseCase;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma   = mockDeep<PrismaClient>();
    useCase  = new GetPublicProcessUseCase(prisma as unknown as PrismaService);
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => jest.useRealTimers());

  it('retorna dados do processo, apenas quotes READY e dados da empresa', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(makeProcess() as any);
    prisma.quoteProcess.update.mockResolvedValue({} as any);

    const result = await useCase.execute(TOKEN);

    expect(result.process.id).toBe('proc-1');
    expect(result.process.clientName).toBe('Fabiano Alves');
    expect(result.quotes).toHaveLength(1);
    expect(result.quotes[0].id).toBe('q-ready');
    expect(result.quotes[0].insurer).toBe(Insurer.BRADESCO);
    expect(result.company.displayName).toBe('Corretora Teste');
    expect(result.company.whatsapp).toBe('11999999999');
  });

  it('registra openedAt na primeira abertura (quando null)', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(makeProcess({ openedAt: null }) as any);
    prisma.quoteProcess.update.mockResolvedValue({} as any);

    await useCase.execute(TOKEN);

    expect(prisma.quoteProcess.update).toHaveBeenCalledWith({
      where: { id: 'proc-1' },
      data:  { openedAt: NOW },
    });
  });

  it('não atualiza openedAt se já foi registrado anteriormente', async () => {
    const alreadyOpened = new Date('2026-04-25T10:00:00Z');
    prisma.quoteProcess.findUnique.mockResolvedValue(
      makeProcess({ openedAt: alreadyOpened }) as any,
    );

    await useCase.execute(TOKEN);

    expect(prisma.quoteProcess.update).not.toHaveBeenCalled();
  });

  it('lança NotFoundException quando token não existe', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(null);

    await expect(useCase.execute(TOKEN)).rejects.toThrow(NotFoundException);
  });

  it('lança NotFoundException quando processo não está PUBLISHED', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(
      makeProcess({ status: QuoteProcessStatus.READY }) as any,
    );

    await expect(useCase.execute(TOKEN)).rejects.toThrow(NotFoundException);
  });

  it('lança GoneException quando link expirou', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(
      makeProcess({ expiresAt: PAST }) as any,
    );

    await expect(useCase.execute(TOKEN)).rejects.toThrow(GoneException);
  });

  it('lança NotFoundException quando não há nenhuma quote READY', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(
      makeProcess({
        quotes: [{ id: 'q1', insurer: Insurer.BRADESCO, status: QuoteStatus.FAILED, name: null, extractedData: null }],
      }) as any,
    );

    await expect(useCase.execute(TOKEN)).rejects.toThrow(NotFoundException);
  });
});
