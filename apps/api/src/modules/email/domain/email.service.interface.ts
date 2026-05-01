export interface SendPasswordResetParams {
  to: string;
  name: string;
  resetUrl: string;
}

export interface SendQuoteOpenedParams {
  to: string;
  brokerName: string;
  clientName: string;
  quoteUrl: string;
}

export interface IEmailService {
  sendPasswordReset(params: SendPasswordResetParams): Promise<void>;
  sendQuoteOpened(params: SendQuoteOpenedParams): Promise<void>;
}
