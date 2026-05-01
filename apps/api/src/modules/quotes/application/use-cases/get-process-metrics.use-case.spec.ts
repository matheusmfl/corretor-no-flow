import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetProcessMetricsUseCase } from './get-process-metrics.use-case';

function makeSession(overrides: Partial<{
  id: string;
  sessionId: string;
  startedAt: Date;
  lastSeenAt: Date;
  endedAt: Date | null;
  referrer: string | null;
  userAgent: string | null;
  events: { type: string; payload: unknown; createdAt: Date }[];
}> = {}) {
  return {
    id: overrides.id ?? 's1',
    sessionId: overrides.sessionId ?? 'uuid-1',
    isOwner: false,
    startedAt: overrides.startedAt ?? new Date('2026-04-25T10:00:00Z'),
    lastSeenAt: overrides.lastSeenAt ?? new Date('2026-04-25T10:05:00Z'),
    endedAt: overrides.endedAt !== undefined ? overrides.endedAt : new Date('2026-04-25T10:03:00Z'),
    referrer: overrides.referrer ?? null,
    userAgent: overrides.userAgent ?? 'Mozilla/5.0',
    events: overrides.events ?? [],
  };
}

describe('GetProcessMetricsUseCase', () => {
  let useCase: GetProcessMetricsUseCase;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    useCase = new GetProcessMetricsUseCase(prisma as unknown as PrismaService);
  });

  it('retorna métricas zeradas quando não há sessões', async () => {
    prisma.quoteSession.count.mockResolvedValue(0);
    prisma.quoteSession.aggregate.mockResolvedValue({ _min: { startedAt: null }, _max: { startedAt: null } } as any);
    prisma.quoteSession.findMany.mockResolvedValue([]);
    (prisma.quoteEvent.groupBy as jest.Mock).mockResolvedValue([]);
    prisma.quoteEvent.findMany.mockResolvedValue([]);

    const result = await useCase.execute('process-1');

    expect(result).toEqual(expect.objectContaining({
      totalSessions:     0,
      avgDurationSeconds: null,
      firstOpenedAt:     null,
      lastOpenedAt:      null,
      whatsappClicks:    0,
      pdfDownloads:      0,
      topInsurer:        null,
      insurerViews:      [],
      sessionsByDay:     [],
      recentSessions:    [],
    }));
  });

  it('conta sessões de visitantes (exclui owner)', async () => {
    prisma.quoteSession.count.mockResolvedValue(5);
    prisma.quoteSession.aggregate.mockResolvedValue({ _min: { startedAt: new Date() }, _max: { startedAt: new Date() } } as any);
    prisma.quoteSession.findMany.mockResolvedValue([]);
    (prisma.quoteEvent.groupBy as jest.Mock).mockResolvedValue([]);
    prisma.quoteEvent.findMany.mockResolvedValue([]);

    const result = await useCase.execute('process-1');

    expect(result.totalSessions).toBe(5);
    expect(prisma.quoteSession.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ processId: 'process-1', isOwner: false }),
      }),
    );
  });

  it('calcula duração média em segundos das sessões encerradas', async () => {
    const s1 = makeSession({
      id: 's1',
      startedAt: new Date('2026-04-25T10:00:00Z'),
      endedAt:   new Date('2026-04-25T10:02:00Z'), // 120s
    });
    const s2 = makeSession({
      id: 's2',
      startedAt: new Date('2026-04-25T11:00:00Z'),
      endedAt:   new Date('2026-04-25T11:01:00Z'), // 60s
    });
    const s3 = makeSession({
      id: 's3',
      startedAt: new Date('2026-04-25T12:00:00Z'),
      endedAt:   null, // sem encerramento — exclui da média
    });

    prisma.quoteSession.count.mockResolvedValue(3);
    prisma.quoteSession.aggregate.mockResolvedValue({ _min: { startedAt: s1.startedAt }, _max: { startedAt: s3.startedAt } } as any);
    prisma.quoteSession.findMany.mockResolvedValue([s1, s2, s3] as any);
    (prisma.quoteEvent.groupBy as jest.Mock).mockResolvedValue([]);
    prisma.quoteEvent.findMany.mockResolvedValue([]);

    const result = await useCase.execute('process-1');

    expect(result.avgDurationSeconds).toBe(90); // (120 + 60) / 2
  });

  it('conta whatsapp clicks e pdf downloads por tipo de evento', async () => {
    prisma.quoteSession.count.mockResolvedValue(2);
    prisma.quoteSession.aggregate.mockResolvedValue({ _min: { startedAt: new Date() }, _max: { startedAt: new Date() } } as any);
    prisma.quoteSession.findMany.mockResolvedValue([]);
    (prisma.quoteEvent.groupBy as jest.Mock).mockResolvedValue([
      { type: 'WHATSAPP_CLICK', _count: { _all: 3 } },
      { type: 'PDF_DOWNLOAD',   _count: { _all: 1 } },
      { type: 'INSURER_VIEW',   _count: { _all: 8 } },
    ]);
    prisma.quoteEvent.findMany.mockResolvedValue([]);

    const result = await useCase.execute('process-1');

    expect(result.whatsappClicks).toBe(3);
    expect(result.pdfDownloads).toBe(1);
  });

  it('agrupa visualizações de seguradoras e identifica a top', async () => {
    prisma.quoteSession.count.mockResolvedValue(2);
    prisma.quoteSession.aggregate.mockResolvedValue({ _min: { startedAt: new Date() }, _max: { startedAt: new Date() } } as any);
    prisma.quoteSession.findMany.mockResolvedValue([]);
    (prisma.quoteEvent.groupBy as jest.Mock).mockResolvedValue([]);
    prisma.quoteEvent.findMany.mockResolvedValue([
      { payload: { insurer: 'BRADESCO' } },
      { payload: { insurer: 'BRADESCO' } },
      { payload: { insurer: 'PORTO_SEGURO' } },
    ] as any);

    const result = await useCase.execute('process-1');

    expect(result.insurerViews).toEqual(
      expect.arrayContaining([
        { insurer: 'BRADESCO',     count: 2 },
        { insurer: 'PORTO_SEGURO', count: 1 },
      ]),
    );
    expect(result.topInsurer).toBe('BRADESCO');
  });

  it('agrupa sessões por dia para o gráfico de timeline', async () => {
    const s1 = makeSession({ id: 's1', startedAt: new Date('2026-04-25T10:00:00Z') });
    const s2 = makeSession({ id: 's2', startedAt: new Date('2026-04-25T14:00:00Z') });
    const s3 = makeSession({ id: 's3', startedAt: new Date('2026-04-26T09:00:00Z') });

    prisma.quoteSession.count.mockResolvedValue(3);
    prisma.quoteSession.aggregate.mockResolvedValue({ _min: { startedAt: s1.startedAt }, _max: { startedAt: s3.startedAt } } as any);
    prisma.quoteSession.findMany.mockResolvedValue([s1, s2, s3] as any);
    (prisma.quoteEvent.groupBy as jest.Mock).mockResolvedValue([]);
    prisma.quoteEvent.findMany.mockResolvedValue([]);

    const result = await useCase.execute('process-1');

    expect(result.sessionsByDay).toEqual(
      expect.arrayContaining([
        { date: '2026-04-25', count: 2 },
        { date: '2026-04-26', count: 1 },
      ]),
    );
  });

  it('retorna firstOpenedAt e lastOpenedAt do aggregate', async () => {
    const first = new Date('2026-04-20T08:00:00Z');
    const last  = new Date('2026-04-28T16:00:00Z');

    prisma.quoteSession.count.mockResolvedValue(10);
    prisma.quoteSession.aggregate.mockResolvedValue({ _min: { startedAt: first }, _max: { startedAt: last } } as any);
    prisma.quoteSession.findMany.mockResolvedValue([]);
    (prisma.quoteEvent.groupBy as jest.Mock).mockResolvedValue([]);
    prisma.quoteEvent.findMany.mockResolvedValue([]);

    const result = await useCase.execute('process-1');

    expect(result.firstOpenedAt).toBe(first.toISOString());
    expect(result.lastOpenedAt).toBe(last.toISOString());
  });

  it('inclui lista de sessões recentes com duração calculada', async () => {
    const session = makeSession({
      id: 's1',
      sessionId: 'uuid-abc',
      startedAt: new Date('2026-04-25T10:00:00Z'),
      endedAt:   new Date('2026-04-25T10:02:30Z'), // 150s
      referrer:  'https://whatsapp.com',
      userAgent: 'Mozilla/5.0',
      events: [],
    });

    prisma.quoteSession.count.mockResolvedValue(1);
    prisma.quoteSession.aggregate.mockResolvedValue({ _min: { startedAt: session.startedAt }, _max: { startedAt: session.startedAt } } as any);
    prisma.quoteSession.findMany.mockResolvedValue([session] as any);
    (prisma.quoteEvent.groupBy as jest.Mock).mockResolvedValue([]);
    prisma.quoteEvent.findMany.mockResolvedValue([]);

    const result = await useCase.execute('process-1');

    expect(result.recentSessions).toHaveLength(1);
    expect(result.recentSessions[0]).toEqual(
      expect.objectContaining({
        sessionId:       'uuid-abc',
        durationSeconds: 150,
        referrer:        'https://whatsapp.com',
      }),
    );
  });
});
