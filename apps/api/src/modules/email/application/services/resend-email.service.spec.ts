import { ConfigService } from '@nestjs/config';
import { ResendEmailService } from './resend-email.service';

const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

describe('ResendEmailService', () => {
  let service: ResendEmailService;
  let config: jest.Mocked<ConfigService>;

  beforeEach(() => {
    jest.clearAllMocks();
    config = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          RESEND_API_KEY: 're_test_key',
          RESEND_FROM_EMAIL: 'noreply@corretornoflow.com.br',
        };
        return values[key];
      }),
    } as any;

    service = new ResendEmailService(config);
  });

  describe('sendPasswordReset', () => {
    it('envia e-mail de redefinição de senha via Resend', async () => {
      mockSend.mockResolvedValue({ data: { id: 'msg_123' }, error: null });

      await service.sendPasswordReset({
        to: 'usuario@teste.com',
        name: 'João Silva',
        resetUrl: 'http://localhost:3000/auth/reset-password?token=abc123',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@corretornoflow.com.br',
          to: ['usuario@teste.com'],
          subject: 'Redefinir senha — Corretor no Flow',
          html: expect.stringContaining('abc123'),
        }),
      );
    });

    it('lança erro quando Resend retorna error', async () => {
      mockSend.mockResolvedValue({ data: null, error: { message: 'Invalid API key' } });

      await expect(
        service.sendPasswordReset({
          to: 'usuario@teste.com',
          name: 'João',
          resetUrl: 'http://localhost:3000/auth/reset-password?token=abc',
        }),
      ).rejects.toThrow('Invalid API key');
    });
  });

  describe('sendQuoteOpened', () => {
    it('envia notificação ao corretor quando segurado abre a cotação', async () => {
      mockSend.mockResolvedValue({ data: { id: 'msg_456' }, error: null });

      await service.sendQuoteOpened({
        to: 'corretor@empresa.com',
        brokerName: 'Maria',
        clientName: 'Carlos Souza',
        quoteUrl: 'http://localhost:3000/dashboard/quotes/process-1',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['corretor@empresa.com'],
          subject: expect.stringContaining('Carlos Souza'),
        }),
      );
    });
  });
});
