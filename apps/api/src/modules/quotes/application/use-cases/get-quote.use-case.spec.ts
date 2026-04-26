import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetQuoteUseCase } from './get-quote.use-case';

describe('GetQuoteUseCase', () => {
  let useCase: GetQuoteUseCase;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    useCase = new GetQuoteUseCase(prisma as unknown as PrismaService);
  });

  it('lança NotFoundException quando processo não existe', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(null);

    await expect(useCase.execute('c1', 'p1')).rejects.toThrow(NotFoundException);
  });

  it('lança ForbiddenException quando processo pertence a outra empresa', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue({ id: 'p1', companyId: 'outra_empresa' } as any);

    await expect(useCase.execute('c1', 'p1')).rejects.toThrow(ForbiddenException);
  });

  it('retorna o processo quando empresa é a dona', async () => {
    const process = { id: 'p1', companyId: 'c1', status: 'DRAFT', quotes: [] };
    prisma.quoteProcess.findUnique.mockResolvedValue(process as any);

    const result = await useCase.execute('c1', 'p1');

    expect(result).toEqual(process);
  });
});
