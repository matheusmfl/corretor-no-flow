import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, Insurer } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { UploadAutoQuoteUseCase } from './upload-auto-quote.use-case';

const makeQueue = () => ({ add: jest.fn().mockResolvedValue(undefined) } as unknown as Queue);

describe('UploadAutoQuoteUseCase — guarda de seguradoras suportadas', () => {
  let useCase: UploadAutoQuoteUseCase;
  let prisma: DeepMockProxy<PrismaClient>;
  let queue: Queue;

  const PROCESS = { id: 'p1', companyId: 'c1', product: 'AUTO' };

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    queue = makeQueue();
    useCase = new UploadAutoQuoteUseCase(prisma as unknown as PrismaService, queue);
    prisma.quoteProcess.findUnique.mockResolvedValue(PROCESS as any);
    prisma.quote.create.mockResolvedValue({ id: 'q1', processId: 'p1', insurer: Insurer.BRADESCO } as any);
  });

  it.each([Insurer.BRADESCO, Insurer.PORTO_SEGURO, Insurer.AZUL, Insurer.MITSUI_SUMITOMO, Insurer.ITAU, Insurer.TOKIO_MARINE])(
    '%s é aceita sem lançar exceção',
    async (insurer) => {
      prisma.quote.create.mockResolvedValue({ id: 'q1', processId: 'p1', insurer } as any);
      await expect(useCase.execute('c1', 'p1', insurer, '/file.pdf')).resolves.toBeDefined();
    },
  );

  it('seguradora não suportada lança BadRequestException', async () => {
    await expect(
      useCase.execute('c1', 'p1', Insurer.SULAMERICA, '/file.pdf'),
    ).rejects.toThrow(BadRequestException);
  });

  it('processo inexistente lança NotFoundException', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(null);
    await expect(
      useCase.execute('c1', 'p1', Insurer.BRADESCO, '/file.pdf'),
    ).rejects.toThrow(NotFoundException);
  });

  it('encaminha job para a fila com dados corretos', async () => {
    await useCase.execute('c1', 'p1', Insurer.AZUL, '/file.pdf');
    expect(queue.add).toHaveBeenCalledWith(
      'extract-pdf',
      expect.objectContaining({ insurer: Insurer.AZUL, filePath: '/file.pdf' }),
      expect.any(Object),
    );
  });

  it('deleta a quote criada quando o enqueue falha e repropaga o erro', async () => {
    const enqueueError = new Error('Redis indisponível');
    (queue.add as jest.Mock).mockRejectedValueOnce(enqueueError);
    prisma.quote.delete.mockResolvedValue({ id: 'q1' } as any);

    await expect(useCase.execute('c1', 'p1', Insurer.BRADESCO, '/file.pdf')).rejects.toThrow(enqueueError);

    expect(prisma.quote.delete).toHaveBeenCalledWith({ where: { id: 'q1' } });
  });
});
