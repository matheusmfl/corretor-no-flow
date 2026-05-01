import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule } from '../email/email.module';
import { TrackingController } from './presentation/tracking.controller';
import { CreateSessionUseCase } from './application/use-cases/create-session.use-case';
import { HeartbeatUseCase } from './application/use-cases/heartbeat.use-case';
import { TrackEventUseCase } from './application/use-cases/track-event.use-case';
import { EndSessionUseCase } from './application/use-cases/end-session.use-case';

@Module({
  imports: [JwtModule.register({}), EmailModule],
  controllers: [TrackingController],
  providers: [
    CreateSessionUseCase,
    HeartbeatUseCase,
    TrackEventUseCase,
    EndSessionUseCase,
  ],
})
export class TrackingModule {}
