import { GoneException, NotFoundException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, QuoteProcessStatus, QuoteStatus, InsuranceProduct, Insurer } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QuotePdfTemplateService } from '../../../quotes/application/services/quote-pdf-template.service';
import { GetPublicQuoteHtmlUseCase } from './get-public-quote-html.use-case';

const TOKEN    = 'tok-abc';
const QUOTE_ID = 'q-ready';
const NOW      = new Date('2026-04-27T12:00:00Z');
const FUTURE   = new Date('2026-05-27T12:00:00Z');
const PAST     = new Date('2026-04-26T12:00:00Z');

const makeProcess = (overrides: Record<string, unknown> = {}) => ({
  id:          'proc-1',
  status:      QuoteProcessStatus.PUBLISHED,
  publicToken: TOKEN,
  expiresAt:   FUTURE,
  product:     InsuranceProduct.AUTO,
  quotes: [
    {
      id:            QUOTE_ID,
      insurer:       Insurer.BRADESCO,
      status:        QuoteStatus.READY,
      name:          'Bradesco — Auto',
      extractedData: { premium: { total: 3448.5 } },
    },
    {
      id:     'q-failed',
      status: QuoteStatus.FAILED,
    },
  ],
  ...overrides,
});

describe('GetPublicQuoteHtmlUseCase', () => {
  let useCase: GetPublicQuoteHtmlUseCase;
  let prisma: DeepMockProxy<PrismaClient>;
  let template: jest.Mocked<QuotePdfTemplateService>;

  beforeEach(() => {
    prisma   = mockDeep<PrismaClient>();
    template = { render: jest.fn().mockReturnValue('<html>cotação</html>') } as any;
    useCase  = new GetPublicQuoteHtmlUseCase(prisma as unknown as PrismaService, template);
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => jest.useRealTimers());

  it('retorna o HTML renderizado para uma quote READY válida', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(makeProcess() as any);

    const html = await useCase.execute(TOKEN, QUOTE_ID);

    expect(html).toBe('<html>cotação</html>');
    expect(template.render).toHaveBeenCalledWith({
      insurer:       Insurer.BRADESCO,
      name:          'Bradesco — Auto',
      extractedData: { premium: { total: 3448.5 } },
    });
  });

  it('lança NotFoundException se token não existe ou processo não está PUBLISHED', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(null);
    await expect(useCase.execute(TOKEN, QUOTE_ID)).rejects.toThrow(NotFoundException);
  });

  it('lança NotFoundException se processo não está PUBLISHED', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(
      makeProcess({ status: QuoteProcessStatus.READY }) as any,
    );
    await expect(useCase.execute(TOKEN, QUOTE_ID)).rejects.toThrow(NotFoundException);
  });

  it('lança GoneException se link expirou', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(
      makeProcess({ expiresAt: PAST }) as any,
    );
    await expect(useCase.execute(TOKEN, QUOTE_ID)).rejects.toThrow(GoneException);
  });

  it('lança NotFoundException se quoteId não pertence ao processo', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(makeProcess() as any);
    await expect(useCase.execute(TOKEN, 'outro-id')).rejects.toThrow(NotFoundException);
  });

  it('lança NotFoundException se a quote não está READY', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(makeProcess() as any);
    await expect(useCase.execute(TOKEN, 'q-failed')).rejects.toThrow(NotFoundException);
  });
});
