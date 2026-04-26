import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ListQuotesUseCase } from './list-quotes.use-case';

const makeItem = (id: string) => ({
  id,
  product: 'AUTO',
  status: 'DRAFT',
  clientName: null,
  publicToken: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('ListQuotesUseCase', () => {
  let useCase: ListQuotesUseCase;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    useCase = new ListQuotesUseCase(prisma as unknown as PrismaService);
  });

  it('retorna items, total, page e limit', async () => {
    const items = [makeItem('p1'), makeItem('p2')];
    prisma.$transaction.mockResolvedValue([items, 2] as any);

    const result = await useCase.execute('c1', 1, 20);

    expect(result).toEqual({ items, total: 2, page: 1, limit: 20 });
  });

  it('filtra apenas processos da companyId informada', async () => {
    prisma.$transaction.mockResolvedValue([[], 0] as any);

    await useCase.execute('empresa-x', 1, 20);

    expect(prisma.quoteProcess.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 'empresa-x' } }),
    );
  });

  it('aplica paginação correta: skip = (page - 1) * limit', async () => {
    prisma.$transaction.mockResolvedValue([[], 0] as any);

    await useCase.execute('c1', 3, 10);

    expect(prisma.quoteProcess.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
  });

  it('usa page=1 e limit=20 como defaults', async () => {
    prisma.$transaction.mockResolvedValue([[], 0] as any);

    const result = await useCase.execute('c1');

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('ordena por createdAt desc', async () => {
    prisma.$transaction.mockResolvedValue([[], 0] as any);

    await useCase.execute('c1', 1, 20);

    expect(prisma.quoteProcess.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    );
  });

  it('retorna total 0 quando não há processos', async () => {
    prisma.$transaction.mockResolvedValue([[], 0] as any);

    const result = await useCase.execute('c1', 1, 20);

    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
  });
});
