import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { EMAIL_SERVICE } from '../../../email/email.constants';
import { IEmailService } from '../../../email/domain/email.service.interface';
import { CreateSessionDto } from '../dtos/create-session.dto';

interface CreateSessionInput extends CreateSessionDto {
  ip: string | null;
  userAgent: string | null;
  userId: string | null;
  isOwner: boolean;
}

@Injectable()
export class CreateSessionUseCase {
  private readonly logger = new Logger(CreateSessionUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(EMAIL_SERVICE) private readonly emailService?: IEmailService,
  ) {}

  async execute(input: CreateSessionInput): Promise<{ sessionId: string }> {
    const { processId, sessionId, referrer, ip, userAgent, userId, isOwner } = input;

    const ipHash = ip ? createHash('sha256').update(ip).digest('hex') : null;

    const existing = await this.prisma.quoteSession.findUnique({ where: { sessionId } });
    if (existing) return { sessionId };

    await this.prisma.quoteSession.create({
      data: {
        processId,
        sessionId,
        userId: userId ?? undefined,
        isOwner,
        ipHash,
        userAgent,
        referrer: referrer ?? undefined,
      },
    });

    this.logger.log(`Sessão iniciada — process=${processId} owner=${isOwner}`);

    if (!isOwner) {
      await this.notifyBrokerOnFirstVisit(processId);
    }

    return { sessionId };
  }

  private async notifyBrokerOnFirstVisit(processId: string): Promise<void> {
    const visitorCount = await this.prisma.quoteSession.count({
      where: { processId, isOwner: false },
    });

    if (visitorCount !== 1) return;

    const process = await this.prisma.quoteProcess.findUnique({
      where: { id: processId },
      include: {
        company: {
          include: { users: { take: 1, orderBy: { createdAt: 'asc' } } },
        },
      },
    });

    if (!process?.company?.users?.length) return;

    const brokerEmail = process.company.users[0].email;
    const brokerName  = process.company.displayName;
    const clientName  = process.clientName ?? 'seu cliente';
    const quoteUrl    = `${process.publicToken}`;

    await this.emailService?.sendQuoteOpened({
      to:         brokerEmail,
      brokerName,
      clientName,
      quoteUrl,
    });

    this.logger.log(`[quote-opened] notificação enviada para ${brokerEmail} — process=${processId}`);
  }
}
