import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'joao@corretora.com.br' })
  @IsEmail()
  email: string;
}
