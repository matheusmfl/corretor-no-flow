import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

jest.mock('argon2');
const argon2Mock = argon2 as jest.Mocked<typeof argon2>;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaClient>;
  let jwt: jest.Mocked<JwtService>;
  let config: jest.Mocked<ConfigService>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    jwt = { signAsync: jest.fn() } as any;
    config = { getOrThrow: jest.fn(), get: jest.fn() } as any;

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt,
      config,
    );
  });

  // ─── register ────────────────────────────────────────────────────────────────

  describe('register', () => {
    it('lança ConflictException quando e-mail já existe', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' } as any);

      await expect(
        service.register({ name: 'João', email: 'joao@teste.com', password: '123456' }),
      ).rejects.toThrow(ConflictException);
    });

    it('cria usuário com senha hasheada quando e-mail é novo', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      argon2Mock.hash.mockResolvedValue('hashed_password' as never);
      prisma.user.create.mockResolvedValue({
        id: 'u1',
        email: 'joao@teste.com',
        name: 'João',
        companyId: null,
      } as any);

      const result = await service.register({
        name: 'João',
        email: 'joao@teste.com',
        password: '123456',
      });

      expect(argon2Mock.hash).toHaveBeenCalledWith('123456');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ passwordHash: 'hashed_password' }),
        }),
      );
      expect(result).toMatchObject({ email: 'joao@teste.com', name: 'João' });
    });
  });

  // ─── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('lança UnauthorizedException quando usuário não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'naoexiste@teste.com', password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException quando senha é inválida', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'joao@teste.com',
        passwordHash: 'hashed',
      } as any);
      argon2Mock.verify.mockResolvedValue(false as never);

      await expect(
        service.login({ email: 'joao@teste.com', password: 'senha_errada' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('retorna accessToken e refreshToken com credenciais válidas', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'joao@teste.com',
        name: 'João',
        companyId: null,
        passwordHash: 'hashed',
      } as any);
      argon2Mock.verify.mockResolvedValue(true as never);
      argon2Mock.hash.mockResolvedValue('token_hash' as never);
      jwt.signAsync.mockResolvedValue('access_token' as never);
      config.getOrThrow.mockReturnValue('secret' as never);
      config.get.mockReturnValue('15m' as never);
      prisma.refreshToken.create.mockResolvedValue({} as any);

      const result = await service.login({ email: 'joao@teste.com', password: '123456' });

      expect(result.accessToken).toBe('access_token');
      expect(result.rawRefreshToken).toBeDefined();
      expect(result.user).toMatchObject({ id: 'u1', email: 'joao@teste.com' });
    });
  });

  // ─── refresh ─────────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('lança UnauthorizedException quando token está ausente', async () => {
      await expect(service.refresh('')).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException quando token não é encontrado no banco', async () => {
      argon2Mock.hash.mockResolvedValue('token_hash' as never);
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('token_invalido')).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException quando token está expirado', async () => {
      argon2Mock.hash.mockResolvedValue('token_hash' as never);
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        expiresAt: new Date(Date.now() - 1000),
        user: { id: 'u1', email: 'joao@teste.com' },
      } as any);

      await expect(service.refresh('token_expirado')).rejects.toThrow(UnauthorizedException);
    });

    it('rotaciona o token e retorna novos tokens quando válido', async () => {
      argon2Mock.hash.mockResolvedValue('token_hash' as never);
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        user: { id: 'u1', email: 'joao@teste.com' },
      } as any);
      prisma.refreshToken.delete.mockResolvedValue({} as any);
      prisma.refreshToken.create.mockResolvedValue({} as any);
      jwt.signAsync.mockResolvedValue('new_access_token' as never);
      config.getOrThrow.mockReturnValue('secret' as never);
      config.get.mockReturnValue('15m' as never);

      const result = await service.refresh('token_valido');

      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt1' } });
      expect(result.accessToken).toBe('new_access_token');
      expect(result.rawRefreshToken).toBeDefined();
    });
  });

  // ─── forgotPassword ───────────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('não lança erro quando e-mail não existe (silent fail)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.forgotPassword({ email: 'naoexiste@teste.com' }),
      ).resolves.toBeUndefined();
    });

    it('cria reset token quando e-mail existe', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'joao@teste.com' } as any);
      argon2Mock.hash.mockResolvedValue('reset_hash' as never);
      prisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
      prisma.passwordResetToken.create.mockResolvedValue({} as any);

      await service.forgotPassword({ email: 'joao@teste.com' });

      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
      });
      expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    });
  });

  // ─── resetPassword ────────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('lança BadRequestException quando token é inválido', async () => {
      argon2Mock.hash.mockResolvedValue('token_hash' as never);
      prisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'invalido', password: 'nova_senha' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException quando token já foi usado', async () => {
      argon2Mock.hash.mockResolvedValue('token_hash' as never);
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'prt1',
        userId: 'u1',
        used: true,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      } as any);

      await expect(
        service.resetPassword({ token: 'usado', password: 'nova_senha' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException quando token está expirado', async () => {
      argon2Mock.hash.mockResolvedValue('token_hash' as never);
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'prt1',
        userId: 'u1',
        used: false,
        expiresAt: new Date(Date.now() - 1000),
      } as any);

      await expect(
        service.resetPassword({ token: 'expirado', password: 'nova_senha' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('atualiza senha e invalida todas as sessões com token válido', async () => {
      argon2Mock.hash
        .mockResolvedValueOnce('token_hash' as never)
        .mockResolvedValueOnce('new_password_hash' as never);
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'prt1',
        userId: 'u1',
        used: false,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      } as any);
      prisma.$transaction.mockResolvedValue([] as any);

      await service.resetPassword({ token: 'valido', password: 'nova_senha' });

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
