import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ListQuotesUseCase } from './list-quotes.use-case';

const makeItem = (id: string, viewerCount = 0) => ({
  id,
  product: 'AUTO',
  status: 'DRAFT',
  clientName: null,
  publicToken: null,
  openedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { sessions: viewerCount },
});

describe('ListQuotesUseCase', () => {
  let useCase: ListQuotesUseCase;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    useCase = new ListQuotesUseCase(prisma as unknown as PrismaService);
  });

  it('retorna items, total, page e limit', async () => {
    const raw = [makeItem('p1', 3), makeItem('p2', 0)];
    prisma.$transaction.mockResolvedValue([raw, 2] as any);

    const result = await useCase.execute('c1', { page: 1, limit: 20 });

    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.items[0].viewerCount).toBe(3);
    expect(result.items[1].viewerCount).toBe(0);
  });

  it('inclui viewerCount com contagem de visitantes (não-owner) por processo', async () => {
    const raw = [makeItem('p1', 7)];
    prisma.$transaction.mockResolvedValue([raw, 1] as any);

    const result = await useCase.execute('c1', { page: 1, limit: 20 });

    expect(result.items[0].viewerCount).toBe(7);
    expect(prisma.quoteProcess.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          _count: { select: { sessions: { where: { isOwner: false } } } },
        }),
      }),
    );
  });

  it('filtra apenas processos da companyId informada', async () => {
    prisma.$transaction.mockResolvedValue([[], 0] as any);

    await useCase.execute('empresa-x', { page: 1, limit: 20 });

    expect(prisma.quoteProcess.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 'empresa-x' } }),
    );
  });

  it('aplica paginação correta: skip = (page - 1) * limit', async () => {
    prisma.$transaction.mockResolvedValue([[], 0] as any);

    await useCase.execute('c1', { page: 3, limit: 10 });

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

    await useCase.execute('c1', { page: 1, limit: 20 });

    expect(prisma.quoteProcess.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    );
  });

  it('retorna total 0 quando não há processos', async () => {
    prisma.$transaction.mockResolvedValue([[], 0] as any);

    const result = await useCase.execute('c1', { page: 1, limit: 20 });

    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it('filtra por status quando fornecido', async () => {
    prisma.$transaction.mockResolvedValue([[], 0] as any);

    await useCase.execute('c1', { page: 1, limit: 20, status: 'READY' as any });

    expect(prisma.quoteProcess.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 'c1', status: 'READY' } }),
    );
  });
});
