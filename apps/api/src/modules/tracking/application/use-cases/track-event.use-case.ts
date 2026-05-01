import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TrackEventDto } from '../dtos/track-event.dto';

@Injectable()
export class TrackEventUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(sessionId: string, dto: TrackEventDto): Promise<void> {
    const session = await this.prisma.quoteSession.findUnique({
      where: { sessionId },
      select: { id: true },
    });

    if (!session) return; // sessão não encontrada — ignora silenciosamente

    await this.prisma.quoteEvent.create({
      data: {
        sessionId: session.id,
        type:      dto.type,
        payload:   dto.payload ? (dto.payload as object) : undefined,
      },
    });
  }
}
