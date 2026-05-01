import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IEmailService } from '../../../email/domain/email.service.interface';
import { CreateSessionUseCase } from './create-session.use-case';
import { HeartbeatUseCase } from './heartbeat.use-case';
import { TrackEventUseCase } from './track-event.use-case';
import { EndSessionUseCase } from './end-session.use-case';

describe('Tracking Use Cases', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let emailService: jest.Mocked<IEmailService>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    emailService = {
      sendPasswordReset: jest.fn(),
      sendQuoteOpened:   jest.fn(),
    };
  });

  // ─── CreateSessionUseCase ─────────────────────────────────────────────────────

  describe('CreateSessionUseCase', () => {
    let useCase: CreateSessionUseCase;

    beforeEach(() => {
      useCase = new CreateSessionUseCase(prisma as unknown as PrismaService, emailService);
    });

    it('cria uma nova sessão e retorna o sessionId', async () => {
      prisma.quoteSession.findUnique.mockResolvedValue(null);
      prisma.quoteSession.create.mockResolvedValue({ id: 's1', sessionId: 'uuid-123' } as any);
      prisma.quoteSession.count.mockResolvedValue(1);
      (prisma.quoteProcess.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await useCase.execute({
        processId: 'p1',
        sessionId: 'uuid-123',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        userId: null,
        isOwner: false,
        referrer: 'https://whatsapp.com',
      });

      expect(result).toEqual({ sessionId: 'uuid-123' });
      expect(prisma.quoteSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            processId: 'p1',
            sessionId: 'uuid-123',
            isOwner: false,
            // ip nunca é salvo bruto — apenas o hash
            ipHash: expect.any(String),
          }),
        }),
      );
    });

    it('nunca armazena o IP bruto — apenas SHA256', async () => {
      prisma.quoteSession.findUnique.mockResolvedValue(null);
      prisma.quoteSession.create.mockResolvedValue({ id: 's1', sessionId: 'uuid-123' } as any);
      prisma.quoteSession.count.mockResolvedValue(1);
      (prisma.quoteProcess.findUnique as jest.Mock).mockResolvedValue(null);

      await useCase.execute({
        processId: 'p1',
        sessionId: 'uuid-123',
        ip: '1.2.3.4',
        userAgent: null,
        userId: null,
        isOwner: false,
      });

      const callData = prisma.quoteSession.create.mock.calls[0][0].data;
      expect(callData).not.toHaveProperty('ip');
      expect(callData.ipHash).not.toBe('1.2.3.4');
      expect(callData.ipHash).toHaveLength(64); // SHA256 hex
    });

    it('é idempotente — retorna sessionId sem criar se já existe', async () => {
      prisma.quoteSession.findUnique.mockResolvedValue({
        id: 's1',
        sessionId: 'uuid-123',
      } as any);

      const result = await useCase.execute({
        processId: 'p1',
        sessionId: 'uuid-123',
        ip: null,
        userAgent: null,
        userId: null,
        isOwner: false,
      });

      expect(result).toEqual({ sessionId: 'uuid-123' });
      expect(prisma.quoteSession.create).not.toHaveBeenCalled();
    });

    it('marca isOwner=true quando userId é fornecido', async () => {
      prisma.quoteSession.findUnique.mockResolvedValue(null);
      prisma.quoteSession.create.mockResolvedValue({ id: 's1', sessionId: 'uuid-999' } as any);
      prisma.quoteSession.count.mockResolvedValue(1);
      (prisma.quoteProcess.findUnique as jest.Mock).mockResolvedValue(null);

      await useCase.execute({
        processId: 'p1',
        sessionId: 'uuid-999',
        ip: null,
        userAgent: null,
        userId: 'user-1',
        isOwner: true,
      });

      expect(prisma.quoteSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', isOwner: true }),
        }),
      );
    });

    it('envia email ao corretor na primeira visita de um visitante', async () => {
      prisma.quoteSession.findUnique.mockResolvedValue(null);
      prisma.quoteSession.create.mockResolvedValue({ id: 's1', sessionId: 'uuid-visitor' } as any);
      prisma.quoteSession.count.mockResolvedValue(1); // primeira sessão de visitante
      (prisma.quoteProcess.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        clientName: 'Maria Silva',
        company: {
          displayName: 'Corretora XYZ',
          users: [{ email: 'corretor@xyz.com', name: 'João Corretor' }],
        },
      });

      await useCase.execute({
        processId: 'p1',
        sessionId: 'uuid-visitor',
        ip: null,
        userAgent: null,
        userId: null,
        isOwner: false,
      });

      expect(emailService.sendQuoteOpened).toHaveBeenCalledWith(
        expect.objectContaining({
          to:         'corretor@xyz.com',
          brokerName: 'Corretora XYZ',
          clientName: 'Maria Silva',
        }),
      );
    });

    it('não envia email se for a sessão do próprio corretor (isOwner=true)', async () => {
      prisma.quoteSession.findUnique.mockResolvedValue(null);
      prisma.quoteSession.create.mockResolvedValue({ id: 's1', sessionId: 'uuid-owner' } as any);

      await useCase.execute({
        processId: 'p1',
        sessionId: 'uuid-owner',
        ip: null,
        userAgent: null,
        userId: 'user-1',
        isOwner: true,
      });

      expect(emailService.sendQuoteOpened).not.toHaveBeenCalled();
      expect(prisma.quoteSession.count).not.toHaveBeenCalled();
    });

    it('não envia email se não for a primeira visita (visitante retornando)', async () => {
      prisma.quoteSession.findUnique.mockResolvedValue(null);
      prisma.quoteSession.create.mockResolvedValue({ id: 's2', sessionId: 'uuid-return' } as any);
      prisma.quoteSession.count.mockResolvedValue(3); // já houve visitas anteriores

      await useCase.execute({
        processId: 'p1',
        sessionId: 'uuid-return',
        ip: null,
        userAgent: null,
        userId: null,
        isOwner: false,
      });

      expect(emailService.sendQuoteOpened).not.toHaveBeenCalled();
    });

    it('não envia email se processo não encontrado (sem corretor cadastrado)', async () => {
      prisma.quoteSession.findUnique.mockResolvedValue(null);
      prisma.quoteSession.create.mockResolvedValue({ id: 's1', sessionId: 'uuid-noproc' } as any);
      prisma.quoteSession.count.mockResolvedValue(1);
      (prisma.quoteProcess.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        useCase.execute({
          processId: 'p1',
          sessionId: 'uuid-noproc',
          ip: null,
          userAgent: null,
          userId: null,
          isOwner: false,
        }),
      ).resolves.not.toThrow();

      expect(emailService.sendQuoteOpened).not.toHaveBeenCalled();
    });
  });

  // ─── HeartbeatUseCase ─────────────────────────────────────────────────────────

  describe('HeartbeatUseCase', () => {
    let useCase: HeartbeatUseCase;

    beforeEach(() => {
      useCase = new HeartbeatUseCase(prisma as unknown as PrismaService);
    });

    it('atualiza lastSeenAt da sessão', async () => {
      prisma.quoteSession.updateMany.mockResolvedValue({ count: 1 });

      await useCase.execute('uuid-123');

      expect(prisma.quoteSession.updateMany).toHaveBeenCalledWith({
        where: { sessionId: 'uuid-123' },
        data:  { lastSeenAt: expect.any(Date) },
      });
    });

    it('não lança erro se sessão não existe (silencioso)', async () => {
      prisma.quoteSession.updateMany.mockResolvedValue({ count: 0 });

      await expect(useCase.execute('uuid-nao-existe')).resolves.not.toThrow();
    });
  });

  // ─── TrackEventUseCase ────────────────────────────────────────────────────────

  describe('TrackEventUseCase', () => {
    let useCase: TrackEventUseCase;

    beforeEach(() => {
      useCase = new TrackEventUseCase(prisma as unknown as PrismaService);
    });

    it('cria um evento associado à sessão', async () => {
      prisma.quoteSession.findUnique.mockResolvedValue({ id: 'session-db-id' } as any);
      prisma.quoteEvent.create.mockResolvedValue({} as any);

      await useCase.execute('uuid-123', {
        type: 'INSURER_VIEW',
        payload: { insurer: 'BRADESCO' },
      });

      expect(prisma.quoteEvent.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'session-db-id',
          type:      'INSURER_VIEW',
          payload:   { insurer: 'BRADESCO' },
        },
      });
    });

    it('ignora silenciosamente se sessão não existe', async () => {
      prisma.quoteSession.findUnique.mockResolvedValue(null);

      await expect(
        useCase.execute('uuid-invalido', { type: 'WHATSAPP_CLICK' }),
      ).resolves.not.toThrow();

      expect(prisma.quoteEvent.create).not.toHaveBeenCalled();
    });
  });

  // ─── EndSessionUseCase ────────────────────────────────────────────────────────

  describe('EndSessionUseCase', () => {
    let useCase: EndSessionUseCase;

    beforeEach(() => {
      useCase = new EndSessionUseCase(prisma as unknown as PrismaService);
    });

    it('define endedAt na sessão', async () => {
      prisma.quoteSession.updateMany.mockResolvedValue({ count: 1 });

      await useCase.execute('uuid-123');

      expect(prisma.quoteSession.updateMany).toHaveBeenCalledWith({
        where: { sessionId: 'uuid-123', endedAt: null },
        data:  { endedAt: expect.any(Date) },
      });
    });

    it('não atualiza se sessão já foi encerrada (endedAt não nulo)', async () => {
      prisma.quoteSession.updateMany.mockResolvedValue({ count: 0 });

      await useCase.execute('uuid-ja-encerrada');

      // where: { endedAt: null } garante que sessões já encerradas são ignoradas
      expect(prisma.quoteSession.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ endedAt: null }) }),
      );
    });
  });
});
