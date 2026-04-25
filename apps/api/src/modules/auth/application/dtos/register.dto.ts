import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import type { RegisterDto as IRegisterDto } from '@corretor/types';

export class RegisterDto implements IRegisterDto {
  @ApiProperty({ example: 'João Ramos' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'joao@corretora.com.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senhaSegura123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
