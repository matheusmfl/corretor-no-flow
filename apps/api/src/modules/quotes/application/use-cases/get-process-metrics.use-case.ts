import { Injectable } from '@nestjs/common';
import type { QuoteProcessMetrics, QuoteSessionSummary, QuoteInsurerViewCount, QuoteSessionsByDay } from '@corretor/types';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class GetProcessMetricsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(processId: string): Promise<QuoteProcessMetrics> {
    const visitorWhere = { processId, isOwner: false };

    const [totalSessions, aggregate, recentSessions, eventTypeCounts, insurerViewEvents] =
      await Promise.all([
        this.prisma.quoteSession.count({ where: visitorWhere }),

        this.prisma.quoteSession.aggregate({
          where: visitorWhere,
          _min: { startedAt: true },
          _max: { startedAt: true },
        }),

        this.prisma.quoteSession.findMany({
          where: visitorWhere,
          select: {
            id: true, sessionId: true, isOwner: true,
            startedAt: true, lastSeenAt: true, endedAt: true,
            referrer: true, userAgent: true,
            events: {
              select: { type: true, payload: true, createdAt: true },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { startedAt: 'desc' },
          take: 20,
        }),

        this.prisma.quoteEvent.groupBy({
          by: ['type'],
          where: { session: visitorWhere },
          _count: { _all: true },
        }),

        this.prisma.quoteEvent.findMany({
          where: { type: 'INSURER_VIEW', session: visitorWhere },
          select: { payload: true },
        }),
      ]);

    const avgDurationSeconds = this.computeAvgDuration(recentSessions);
    const sessionsByDay      = this.computeSessionsByDay(recentSessions);
    const insurerViews       = this.computeInsurerViews(insurerViewEvents);
    const topInsurer         = insurerViews.length > 0
      ? insurerViews.reduce((a, b) => (b.count > a.count ? b : a)).insurer
      : null;

    const eventCountMap = Object.fromEntries(
      eventTypeCounts.map((e) => [e.type, e._count._all]),
    );

    return {
      totalSessions,
      avgDurationSeconds,
      firstOpenedAt: aggregate._min.startedAt?.toISOString() ?? null,
      lastOpenedAt:  aggregate._max.startedAt?.toISOString() ?? null,
      whatsappClicks: eventCountMap['WHATSAPP_CLICK'] ?? 0,
      pdfDownloads:   eventCountMap['PDF_DOWNLOAD'] ?? 0,
      topInsurer,
      insurerViews,
      sessionsByDay,
      recentSessions: recentSessions.map((s) => this.toSessionSummary(s)),
    };
  }

  private computeAvgDuration(
    sessions: { startedAt: Date; endedAt: Date | null }[],
  ): number | null {
    const ended = sessions.filter((s) => s.endedAt != null);
    if (ended.length === 0) return null;
    const totalMs = ended.reduce(
      (sum, s) => sum + (s.endedAt!.getTime() - s.startedAt.getTime()),
      0,
    );
    return Math.round(totalMs / ended.length / 1000);
  }

  private computeSessionsByDay(
    sessions: { startedAt: Date }[],
  ): QuoteSessionsByDay[] {
    const map = new Map<string, number>();
    for (const s of sessions) {
      const date = s.startedAt.toISOString().slice(0, 10);
      map.set(date, (map.get(date) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private computeInsurerViews(
    events: { payload: unknown }[],
  ): QuoteInsurerViewCount[] {
    const map = new Map<string, number>();
    for (const e of events) {
      const insurer = (e.payload as Record<string, unknown>)?.insurer as string | undefined;
      if (insurer) map.set(insurer, (map.get(insurer) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([insurer, count]) => ({ insurer, count }))
      .sort((a, b) => b.count - a.count);
  }

  private toSessionSummary(s: {
    id: string;
    sessionId: string;
    isOwner: boolean;
    startedAt: Date;
    lastSeenAt: Date;
    endedAt: Date | null;
    referrer: string | null;
    userAgent: string | null;
    events: { type: string; payload: unknown; createdAt: Date }[];
  }): QuoteSessionSummary {
    const durationSeconds = s.endedAt
      ? Math.round((s.endedAt.getTime() - s.startedAt.getTime()) / 1000)
      : null;

    return {
      id: s.id,
      sessionId: s.sessionId,
      isOwner: s.isOwner,
      startedAt: s.startedAt.toISOString(),
      lastSeenAt: s.lastSeenAt.toISOString(),
      endedAt: s.endedAt?.toISOString() ?? null,
      durationSeconds,
      referrer: s.referrer,
      userAgent: s.userAgent,
      events: s.events.map((e) => ({
        type: e.type as QuoteSessionSummary['events'][0]['type'],
        payload: e.payload as Record<string, unknown> | null,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }
}
