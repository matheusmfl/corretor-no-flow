import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import type { ResetPasswordDto as IResetPasswordDto } from '@corretor/types';

export class ResetPasswordDto implements IResetPasswordDto {
  @ApiProperty({ description: 'Token recebido por e-mail' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'novaSenha456', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
