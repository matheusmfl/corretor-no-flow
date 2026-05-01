import {
  Body, Controller, HttpCode, HttpStatus,
  Param, Post, Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Public } from '../../auth/presentation/decorators/public.decorator';
import { CreateSessionDto } from '../application/dtos/create-session.dto';
import { TrackEventDto } from '../application/dtos/track-event.dto';
import { CreateSessionUseCase } from '../application/use-cases/create-session.use-case';
import { HeartbeatUseCase } from '../application/use-cases/heartbeat.use-case';
import { TrackEventUseCase } from '../application/use-cases/track-event.use-case';
import { EndSessionUseCase } from '../application/use-cases/end-session.use-case';

@ApiTags('Tracking')
@Public()
@Controller('tracking')
export class TrackingController {
  constructor(
    private readonly createSession:  CreateSessionUseCase,
    private readonly heartbeat:      HeartbeatUseCase,
    private readonly trackEvent:     TrackEventUseCase,
    private readonly endSession:     EndSessionUseCase,
    private readonly jwt:            JwtService,
    private readonly config:         ConfigService,
  ) {}

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Inicia rastreamento de sessão no link público' })
  async create(@Body() dto: CreateSessionDto, @Req() req: Request) {
    const { userId, isOwner } = this.extractOwner(req);

    return this.createSession.execute({
      ...dto,
      ip:        req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      userId,
      isOwner,
    });
  }

  @Post('sessions/:sessionId/heartbeat')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Heartbeat — atualiza lastSeenAt da sessão' })
  heartbeatSession(@Param('sessionId') sessionId: string) {
    return this.heartbeat.execute(sessionId);
  }

  @Post('sessions/:sessionId/events')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Registra evento na sessão' })
  addEvent(@Param('sessionId') sessionId: string, @Body() dto: TrackEventDto) {
    return this.trackEvent.execute(sessionId, dto);
  }

  @Post('sessions/:sessionId/end')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Encerra a sessão (beforeunload)' })
  end(@Param('sessionId') sessionId: string) {
    return this.endSession.execute(sessionId);
  }

  // Tenta ler o JWT do cookie access_token opcionalmente.
  // Se o token for válido e pertencer ao dono do processo → isOwner = true.
  private extractOwner(req: Request): { userId: string | null; isOwner: boolean } {
    try {
      const token = req.cookies?.['access_token'];
      if (!token) return { userId: null, isOwner: false };

      const payload = this.jwt.verify<{ sub: string }>(token, {
        secret: this.config.getOrThrow('JWT_SECRET'),
      });

      return { userId: payload.sub, isOwner: true };
    } catch {
      return { userId: null, isOwner: false };
    }
  }
}
