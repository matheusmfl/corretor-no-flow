import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import type { ForgotPasswordDto as IForgotPasswordDto } from '@corretor/types';

export class ForgotPasswordDto implements IForgotPasswordDto {
  @ApiProperty({ example: 'joao@corretora.com.br' })
  @IsEmail()
  email: string;
}
