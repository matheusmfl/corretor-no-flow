import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AiService } from './ai.service';
import { ANTHROPIC_CLIENT } from './ai.constants';

@Module({
  providers: [
    {
      provide: ANTHROPIC_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Anthropic({ apiKey: config.getOrThrow<string>('ANTHROPIC_API_KEY') }),
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
