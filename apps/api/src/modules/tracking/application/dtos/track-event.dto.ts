import { IsEnum, IsOptional, IsObject } from 'class-validator';
import { QuoteEventType } from '@prisma/client';
import type { TrackEventDto as ITrackEventDto } from '@corretor/types';

export class TrackEventDto implements ITrackEventDto {
  @IsEnum(QuoteEventType) type: QuoteEventType;
  @IsOptional() @IsObject() payload?: Record<string, unknown>;
}
