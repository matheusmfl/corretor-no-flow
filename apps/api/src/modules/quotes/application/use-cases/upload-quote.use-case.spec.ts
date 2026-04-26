import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { UploadQuoteUseCase } from './upload-quote.use-case';
import { CreateQuoteProcessDto } from '../dtos/upload-quote.dto';
import { QuoteProcessStatus, QuoteStatus } from '../../domain/value-objects/quote-status.vo';

const makeDto = (overrides: Partial<CreateQuoteProcessDto> = {}): CreateQuoteProcessDto => ({
  product: 'AUTO' as any,
  insurers: ['BRADESCO', 'PORTO_SEGURO'] as any[],
  ...overrides,
});

describe('UploadQuoteUseCase', () => {
  let useCase: UploadQuoteUseCase;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    useCase = new UploadQuoteUseCase(prisma as unknown as PrismaService);
  });

  it('cria o processo com status DRAFT', async () => {
    const dto = makeDto();
    prisma.quoteProcess.create.mockResolvedValue({ id: 'p1', status: 'DRAFT', quotes: [] } as any);

    await useCase.execute('c1', dto);

    expect(prisma.quoteProcess.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: QuoteProcessStatus.DRAFT }),
      }),
    );
  });

  it('associa o processo à empresa correta', async () => {
    prisma.quoteProcess.create.mockResolvedValue({ id: 'p1', companyId: 'c1', quotes: [] } as any);

    await useCase.execute('c1', makeDto());

    expect(prisma.quoteProcess.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ companyId: 'c1' }),
      }),
    );
  });

  it('cria uma quote por seguradora passada em insurers', async () => {
    const dto = makeDto({ insurers: ['BRADESCO', 'PORTO_SEGURO'] as any[] });
    prisma.quoteProcess.create.mockResolvedValue({ id: 'p1', quotes: [] } as any);

    await useCase.execute('c1', dto);

    expect(prisma.quoteProcess.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          quotes: {
            create: [
              { insurer: 'BRADESCO', status: QuoteStatus.PENDING },
              { insurer: 'PORTO_SEGURO', status: QuoteStatus.PENDING },
            ],
          },
        }),
      }),
    );
  });

  it('cada quote individual começa com status PENDING', async () => {
    const dto = makeDto({ insurers: ['BRADESCO'] as any[] });
    prisma.quoteProcess.create.mockResolvedValue({ id: 'p1', quotes: [] } as any);

    await useCase.execute('c1', dto);

    expect(prisma.quoteProcess.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          quotes: {
            create: expect.arrayContaining([
              expect.objectContaining({ status: QuoteStatus.PENDING }),
            ]),
          },
        }),
      }),
    );
  });

  it('persiste clientName e clientPhone quando fornecidos', async () => {
    const dto = makeDto({ clientName: 'João Silva', clientPhone: '11999990000' });
    prisma.quoteProcess.create.mockResolvedValue({ id: 'p1', quotes: [] } as any);

    await useCase.execute('c1', dto);

    expect(prisma.quoteProcess.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientName: 'João Silva',
          clientPhone: '11999990000',
        }),
      }),
    );
  });

  it('usa null para clientName e clientPhone quando não fornecidos', async () => {
    const dto = makeDto({ clientName: undefined, clientPhone: undefined });
    prisma.quoteProcess.create.mockResolvedValue({ id: 'p1', quotes: [] } as any);

    await useCase.execute('c1', dto);

    expect(prisma.quoteProcess.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ clientName: null, clientPhone: null }),
      }),
    );
  });

  it('inclui quotes no retorno', async () => {
    const quotes = [{ id: 'q1', insurer: 'BRADESCO', status: 'PENDING' }];
    prisma.quoteProcess.create.mockResolvedValue({ id: 'p1', quotes } as any);

    const result = await useCase.execute('c1', makeDto());

    expect(result.quotes).toEqual(quotes);
  });

  it('retorna o processo criado pelo Prisma', async () => {
    const created = { id: 'p1', companyId: 'c1', status: 'DRAFT', quotes: [] };
    prisma.quoteProcess.create.mockResolvedValue(created as any);

    const result = await useCase.execute('c1', makeDto());

    expect(result).toEqual(created);
  });
});
