import { IsString, IsOptional, IsUUID } from 'class-validator';
import type { CreateSessionDto as ICreateSessionDto } from '@corretor/types';

export class CreateSessionDto implements ICreateSessionDto {
  @IsString() processId: string;
  @IsUUID()   sessionId: string;
  @IsOptional() @IsString() referrer?: string | null;
}
