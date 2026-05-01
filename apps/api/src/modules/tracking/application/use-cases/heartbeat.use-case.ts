import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class HeartbeatUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(sessionId: string): Promise<void> {
    await this.prisma.quoteSession.updateMany({
      where:  { sessionId },
      data:   { lastSeenAt: new Date() },
    });
  }
}
