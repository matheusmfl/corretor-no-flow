import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateCompanyUseCase } from './update-company.use-case';

describe('UpdateCompanyUseCase', () => {
  let useCase: UpdateCompanyUseCase;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    useCase = new UpdateCompanyUseCase(prisma as unknown as PrismaService);
  });

  it('lança NotFoundException quando empresa não existe', async () => {
    prisma.company.findUnique.mockResolvedValue(null);

    await expect(
      useCase.execute('u1', 'c1', { displayName: 'Novo Nome' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('lança ForbiddenException quando usuário não pertence à empresa', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'c1' } as any);
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', companyId: 'outra_empresa' } as any);

    await expect(
      useCase.execute('u1', 'c1', { displayName: 'Novo Nome' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('atualiza empresa quando usuário é o dono', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'c1' } as any);
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', companyId: 'c1' } as any);
    prisma.company.update.mockResolvedValue({ id: 'c1', displayName: 'Novo Nome' } as any);

    const result = await useCase.execute('u1', 'c1', { displayName: 'Novo Nome' });

    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { displayName: 'Novo Nome' },
    });
    expect(result).toMatchObject({ displayName: 'Novo Nome' });
  });
});
