import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { EMAIL_SERVICE } from '../../../email/email.constants';
import { IEmailService } from '../../../email/domain/email.service.interface';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('E-mail já cadastrado.');

    const passwordHash = await argon2.hash(dto.password);

    return this.prisma.user.create({
      data: { name: dto.name, email: dto.email, passwordHash },
      select: { id: true, email: true, name: true, companyId: true },
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Credenciais inválidas.');

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas.');

    const { accessToken, rawRefreshToken } = await this.generateTokens(user.id, user.email);
    const userDto = { id: user.id, email: user.email, name: user.name, companyId: user.companyId };

    return { accessToken, rawRefreshToken, user: userDto };
  }

  private sha256(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  async refresh(rawRefreshToken: string) {
    if (!rawRefreshToken) throw new UnauthorizedException();

    const tokenHash = this.sha256(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    return this.generateTokens(stored.user.id, stored.user.email);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) return;

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.sha256(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await this.prisma.passwordResetToken.create({ data: { tokenHash, userId: user.id, expiresAt } });
    this.logger.log(`[forgot-password] token gerado para ${user.email}`);

    const appUrl = this.config.getOrThrow<string>('APP_URL');
    const resetUrl = `${appUrl}/auth/reset-password?token=${rawToken}`;

    await this.emailService.sendPasswordReset({ to: user.email, name: user.name, resetUrl });
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.sha256(dto.token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Token inválido ou expirado.');
    }

    const passwordHash = await argon2.hash(dto.password);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { used: true } }),
      this.prisma.refreshToken.deleteMany({ where: { userId: resetToken.userId } }),
    ]);
  }

  async validateJwt(payload: JwtPayload) {
    return this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, companyId: true },
    });
  }

  private async generateTokens(userId: string, email: string) {
    const payload: JwtPayload = { sub: userId, email };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
    });

    const rawRefreshToken = randomBytes(32).toString('hex');
    const tokenHash = this.sha256(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    await this.prisma.refreshToken.create({ data: { tokenHash, userId, expiresAt } });

    return { accessToken, rawRefreshToken };
  }
}
