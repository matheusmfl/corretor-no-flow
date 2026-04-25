import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import type { LoginDto as ILoginDto } from '@corretor/types';

export class LoginDto implements ILoginDto {
  @ApiProperty({ example: 'joao@corretora.com.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senhaSegura123' })
  @IsString()
  password: string;
}
