import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  IEmailService,
  SendPasswordResetParams,
  SendQuoteOpenedParams,
} from '../../domain/email.service.interface';
import { resetPasswordTemplate } from '../templates/reset-password.template';
import { quoteOpenedTemplate } from '../templates/quote-opened.template';

@Injectable()
export class ResendEmailService implements IEmailService {
  private readonly logger = new Logger(ResendEmailService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = config.getOrThrow<string>('RESEND_FROM_EMAIL');
  }

  async sendPasswordReset(params: SendPasswordResetParams): Promise<void> {
    const { to, name, resetUrl } = params;

    await this.send({
      to,
      subject: 'Redefinir senha — Corretor no Flow',
      html: resetPasswordTemplate(name, resetUrl),
    });
  }

  async sendQuoteOpened(params: SendQuoteOpenedParams): Promise<void> {
    const { to, brokerName, clientName, quoteUrl } = params;

    await this.send({
      to,
      subject: `${clientName} abriu sua cotação`,
      html: quoteOpenedTemplate(brokerName, clientName, quoteUrl),
    });
  }

  private async send(payload: { to: string; subject: string; html: string }): Promise<void> {
    const { data, error } = await this.resend.emails.send({
      from: this.from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    });

    if (error) {
      this.logger.error(`Falha ao enviar e-mail para ${payload.to}: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }

    this.logger.log(`E-mail enviado: ${data?.id} → ${payload.to}`);
  }
}
