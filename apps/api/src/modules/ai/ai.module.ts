import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { AiService } from './ai.service';
import { GEMINI_CLIENT, GROQ_CLIENT } from './ai.constants';

@Module({
  providers: [
    {
      provide: GROQ_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Groq({ apiKey: config.getOrThrow<string>('GROQ_API_KEY') }),
    },
    {
      provide: GEMINI_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): GoogleGenerativeAI | null => {
        const key = config.get<string>('GEMINI_API_KEY')?.trim();
        return key ? new GoogleGenerativeAI(key) : null;
      },
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
