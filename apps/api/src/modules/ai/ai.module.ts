import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { AiService } from './ai.service';
import { GROQ_CLIENT } from './ai.constants';

@Module({
  providers: [
    {
      provide: GROQ_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Groq({ apiKey: config.getOrThrow<string>('GROQ_API_KEY') }),
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
