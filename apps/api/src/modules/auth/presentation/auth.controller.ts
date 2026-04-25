import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Post, Req, Res,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiCookieAuth, ApiNoContentResponse,
  ApiOkResponse, ApiOperation, ApiTags, ApiConflictResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from '../application/services/auth.service';
import { AuthResponseDto, RegisterResponseDto } from '../application/dtos/auth-response.dto';
import { ForgotPasswordDto } from '../application/dtos/forgot-password.dto';
import { LoginDto } from '../application/dtos/login.dto';
import { RegisterDto } from '../application/dtos/register.dto';
import { ResetPasswordDto } from '../application/dtos/reset-password.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

const REFRESH_COOKIE = 'refresh_token';
const ACCESS_COOKIE  = 'access_token';

const refreshCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth',
  maxAge,
});

const accessCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge,
});

const ACCESS_MAX_AGE = 15 * 60 * 1000;        // 15 min
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Cadastrar novo corretor' })
  @ApiOkResponse({ type: RegisterResponseDto })
  @ApiConflictResponse({ description: 'E-mail já cadastrado' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login — retorna access token + seta cookie de refresh' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, rawRefreshToken, user } = await this.authService.login(dto);
    res.cookie(ACCESS_COOKIE,   accessToken,     accessCookieOptions(ACCESS_MAX_AGE));
    res.cookie(REFRESH_COOKIE,  rawRefreshToken, refreshCookieOptions(REFRESH_MAX_AGE));
    return { user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token usando o cookie de refresh' })
  @ApiCookieAuth('refresh_token')
  @ApiOkResponse({ schema: { properties: { accessToken: { type: 'string' } } } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { accessToken, rawRefreshToken } = await this.authService.refresh(req.cookies?.[REFRESH_COOKIE]);
    res.cookie(ACCESS_COOKIE,   accessToken,     accessCookieOptions(ACCESS_MAX_AGE));
    res.cookie(REFRESH_COOKIE,  rawRefreshToken, refreshCookieOptions(REFRESH_MAX_AGE));
    return { accessToken };
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Retorna o usuário autenticado' })
  me(@CurrentUser() user: { id: string; email: string; name: string; companyId: string | null }) {
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout — revoga todos os refresh tokens' })
  @ApiNoContentResponse()
  async logout(@CurrentUser() user: { id: string }, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(user.id);
    res.clearCookie(ACCESS_COOKIE,  { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Solicitar reset de senha por e-mail' })
  @ApiNoContentResponse()
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Resetar senha com token recebido por e-mail' })
  @ApiNoContentResponse()
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
