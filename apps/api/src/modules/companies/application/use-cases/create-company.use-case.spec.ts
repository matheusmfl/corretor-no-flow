import { ConflictException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCompanyUseCase } from './create-company.use-case';

describe('CreateCompanyUseCase', () => {
  let useCase: CreateCompanyUseCase;
  let prisma: DeepMockProxy<PrismaClient>;

  const dto = {
    accountType: 'INDIVIDUAL' as any,
    legalName: 'João Silva ME',
    displayName: 'João Seguros',
    document: '12345678901',
    susepNumber: '12345678',
    whatsapp: '11999990000',
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    useCase = new CreateCompanyUseCase(prisma as unknown as PrismaService);
  });

  it('cria empresa e vincula ao usuário quando dados são únicos', async () => {
    prisma.company.findUnique.mockResolvedValue(null);
    prisma.company.create.mockResolvedValue({ id: 'c1', slug: 'joao-seguros' } as any);
    prisma.user.update.mockResolvedValue({} as any);

    const result = await useCase.execute('u1', dto);

    expect(prisma.company.create).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { companyId: 'c1' },
    });
    expect(result).toMatchObject({ id: 'c1' });
  });

  it('lança ConflictException quando slug já está em uso', async () => {
    prisma.company.findUnique
      .mockResolvedValueOnce({ id: 'c_existing' } as any) // slug taken
      .mockResolvedValue(null);

    await expect(useCase.execute('u1', dto)).rejects.toThrow(ConflictException);
    expect(prisma.company.create).not.toHaveBeenCalled();
  });

  it('lança ConflictException quando documento já está cadastrado', async () => {
    prisma.company.findUnique
      .mockResolvedValueOnce(null)                        // slug free
      .mockResolvedValueOnce({ id: 'c_existing' } as any) // document taken
      .mockResolvedValue(null);

    await expect(useCase.execute('u1', dto)).rejects.toThrow(ConflictException);
    expect(prisma.company.create).not.toHaveBeenCalled();
  });

  it('lança ConflictException quando SUSEP já está cadastrado', async () => {
    prisma.company.findUnique
      .mockResolvedValueOnce(null)  // slug free
      .mockResolvedValueOnce(null)  // document free
      .mockResolvedValueOnce({ id: 'c_existing' } as any); // susep taken

    await expect(useCase.execute('u1', dto)).rejects.toThrow(ConflictException);
    expect(prisma.company.create).not.toHaveBeenCalled();
  });

  it('usa primaryColor padrão quando não informado', async () => {
    prisma.company.findUnique.mockResolvedValue(null);
    prisma.company.create.mockResolvedValue({ id: 'c1' } as any);
    prisma.user.update.mockResolvedValue({} as any);

    await useCase.execute('u1', dto);

    expect(prisma.company.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ primaryColor: '#003B0F' }),
      }),
    );
  });
});
