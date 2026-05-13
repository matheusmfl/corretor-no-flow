import Groq from 'groq-sdk';
import { ConfigService } from '@nestjs/config';
import type { GoogleGenerativeAI } from '@google/generative-ai';
import { InternalServerErrorException } from '@nestjs/common';
import { AiService } from './ai.service';
import { InsuranceProduct, Insurer } from '@prisma/client';

const makeResponse = (text: string) => ({
  choices: [{ message: { content: text } }],
});

const VALID_AUTO_QUOTE = {
  vehicle: { model: 'Jeep Compass Sport 1.3', plate: 'ABC1D23', yearManufacture: 2025, yearModel: 2026, chassis: '00000000000000000', fipeCode: '13398', fipeValue: 7866.50 },
  driver: { name: 'Cliente Exemplo', cpf: '000.000.000-00', birthDate: '01/01/1970', gender: 'Masculino', maritalStatus: 'Casado' },
  quoteNumber: '0788270607/03',
  insurer: 'Bradesco Auto/RE',
  validFrom: '11/03/2026',
  validUntil: '18/03/2026',
  bonusClass: '10% - Sem Sinistro',
  coverage: {
    vehicle: { fipePercentage: 100, deductible: 3866.50, deductibleType: 'Reduzida' },
    rcf: { propertyDamage: 100000, bodilyInjury: 100000, moralDamages: 10000 },
    app: { death: 5000, disability: 5000, medical: 0, passengerCount: 5 },
    assistance: { towing: true, glassProtection: true, replacementVehicle: true, replacementDays: 7 },
  },
  deductibles: [
    { item: 'Veículo', value: 3866.50, type: 'Reduzida' },
    { item: 'Vidro Dianteiro', value: 721.00 },
    { item: 'Vidros Laterais', value: 300.00 },
  ],
  premium: { base: 2404.44, rcfTotal: 784.97, appTotal: 22.08, iof: 237.00, total: 3448.53 },
  paymentMethods: [
    { type: 'debit', label: 'Débito', installments: [{ number: 1, amount: 3448.50, total: 3448.50 }] },
    { type: 'credit_bradesco', label: 'Cartão Bradesco', installments: [{ number: 1, amount: 3448.50 }, { number: 10, amount: 344.85 }] },
  ],
};

function makeGroqRateLimitError(): Error & { status?: number } {
  const err = new Error('429 rate_limit_exceeded') as Error & { status?: number };
  err.status = 429;
  return err;
}

function buildAiService(
  mockCreate: jest.Mock,
  gemini: GoogleGenerativeAI | null,
  mockGeminiGenerateContent?: jest.Mock,
) {
  const mockGroq = {
    chat: { completions: { create: mockCreate } },
  } as unknown as Groq;

  const mockConfigGet = jest.fn().mockImplementation((key: string) => {
    if (key === 'GEMINI_MODEL') return undefined;
    return undefined;
  });

  if (gemini && mockGeminiGenerateContent) {
    (gemini as unknown as { getGenerativeModel: jest.Mock }).getGenerativeModel = jest.fn(() => ({
      generateContent: mockGeminiGenerateContent,
    }));
  }

  const config = { get: mockConfigGet } as unknown as ConfigService;
  return new AiService(mockGroq, gemini, config);
}

describe('AiService', () => {
  describe('extractQuoteData', () => {
    it('retorna JSON parseado quando Groq responde com JSON válido', async () => {
      const mockCreate = jest.fn().mockResolvedValue(makeResponse(JSON.stringify(VALID_AUTO_QUOTE)));
      const svc = buildAiService(mockCreate, null);

      const result = await svc.extractQuoteData('texto bruto da cotação', InsuranceProduct.AUTO, Insurer.BRADESCO);

      expect(result).toEqual(VALID_AUTO_QUOTE);
    });

    it('remove markdown code fences antes de parsear o JSON', async () => {
      const mockCreate = jest.fn();
      const withFences = `\`\`\`json\n${JSON.stringify(VALID_AUTO_QUOTE)}\n\`\`\``;
      mockCreate.mockResolvedValue(makeResponse(withFences));
      const svc = buildAiService(mockCreate, null);

      const result = await svc.extractQuoteData('texto', InsuranceProduct.AUTO, Insurer.BRADESCO);

      expect(result).toEqual(VALID_AUTO_QUOTE);
    });

    it('usa prompt Bradesco-específico quando insurer é BRADESCO', async () => {
      const mockCreate = jest.fn().mockResolvedValue(makeResponse(JSON.stringify(VALID_AUTO_QUOTE)));
      const svc = buildAiService(mockCreate, null);

      await svc.extractQuoteData('texto', InsuranceProduct.AUTO, Insurer.BRADESCO);

      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: { role: string }) => m.role === 'user');
      expect(userMessage.content).toContain('Bradesco');
    });

    it('lança InternalServerErrorException quando Groq não retorna texto', async () => {
      const mockCreate = jest.fn().mockResolvedValue(makeResponse(''));
      const svc = buildAiService(mockCreate, null);

      await expect(
        svc.extractQuoteData('texto', InsuranceProduct.AUTO, Insurer.BRADESCO),
      ).rejects.toThrow('Resposta da IA não contém texto');
    });

    it('lança InternalServerErrorException quando Groq retorna JSON inválido', async () => {
      const mockCreate = jest.fn().mockResolvedValue(makeResponse('isso não é json'));
      const svc = buildAiService(mockCreate, null);

      await expect(
        svc.extractQuoteData('texto', InsuranceProduct.AUTO, Insurer.BRADESCO),
      ).rejects.toThrow('Resposta da IA não é JSON válido');
    });

    it('lança BadRequestException quando produto não é suportado', async () => {
      const mockCreate = jest.fn();
      const svc = buildAiService(mockCreate, null);

      await expect(
        svc.extractQuoteData('texto', InsuranceProduct.HEALTH, Insurer.BRADESCO),
      ).rejects.toThrow('Produto HEALTH não suportado');
    });

    it('Groq 429 rate_limit_exceeded + Gemini configurado: chama Gemini e retorna JSON', async () => {
      const mockCreate = jest.fn().mockRejectedValue(makeGroqRateLimitError());
      const mockGeminiGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(VALID_AUTO_QUOTE),
        },
      });
      const mockGemini = {} as GoogleGenerativeAI;
      const svc = buildAiService(mockCreate, mockGemini, mockGeminiGenerateContent);

      const result = await svc.extractQuoteData('texto', InsuranceProduct.AUTO, Insurer.BRADESCO);

      expect(result).toEqual(VALID_AUTO_QUOTE);
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockGeminiGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('Groq 429 sem Gemini: erro claro sobre fallback não configurado', async () => {
      const mockCreate = jest.fn().mockRejectedValue(makeGroqRateLimitError());
      const svc = buildAiService(mockCreate, null);

      try {
        await svc.extractQuoteData('texto', InsuranceProduct.AUTO, Insurer.BRADESCO);
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(InternalServerErrorException);
        const body = (e as InternalServerErrorException).getResponse();
        const msg =
          typeof body === 'object' && body !== null && 'message' in body
            ? String((body as { message: string }).message)
            : String(body);
        expect(msg).toMatch(/GEMINI_API_KEY/i);
      }
    });

    it('Groq erro não-429: não chama Gemini', async () => {
      const mockCreate = jest.fn().mockRejectedValue(Object.assign(new Error('Internal server error'), { status: 500 }));
      const mockGeminiGenerateContent = jest.fn();
      const mockGemini = {} as GoogleGenerativeAI;
      const svc = buildAiService(mockCreate, mockGemini, mockGeminiGenerateContent);

      await expect(svc.extractQuoteData('texto', InsuranceProduct.AUTO, Insurer.BRADESCO)).rejects.toThrow(
        'Internal server error',
      );
      expect(mockGeminiGenerateContent).not.toHaveBeenCalled();
    });

    it('Gemini retorna JSON em markdown fenced: parseia corretamente', async () => {
      const mockCreate = jest.fn().mockRejectedValue(makeGroqRateLimitError());
      const fenced = `\`\`\`json\n${JSON.stringify(VALID_AUTO_QUOTE)}\n\`\`\``;
      const mockGeminiGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => fenced,
        },
      });
      const mockGemini = {} as GoogleGenerativeAI;
      const svc = buildAiService(mockCreate, mockGemini, mockGeminiGenerateContent);

      const result = await svc.extractQuoteData('texto', InsuranceProduct.AUTO, Insurer.BRADESCO);
      expect(result).toEqual(VALID_AUTO_QUOTE);
    });
  });

  describe('correctExtractedData', () => {
    it('chama Groq com o JSON inválido e o erro Zod e retorna JSON corrigido', async () => {
      const mockCreate = jest.fn().mockResolvedValue(makeResponse(JSON.stringify(VALID_AUTO_QUOTE)));
      const svc = buildAiService(mockCreate, null);

      const invalid = { vehicle: { model: 'X' }, premium: { total: 0 } };
      const result = await svc.correctExtractedData(invalid, 'insurer: Required', InsuranceProduct.AUTO, Insurer.BRADESCO);

      expect(result).toEqual(VALID_AUTO_QUOTE);

      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: { role: string }) => m.role === 'user');
      expect(userMessage.content).toContain('insurer: Required');
      expect(userMessage.content).toContain(JSON.stringify(invalid, null, 2));
    });

    it('fallback Gemini quando Groq 429 na correção', async () => {
      const mockCreate = jest.fn().mockRejectedValue(makeGroqRateLimitError());
      const mockGeminiGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(VALID_AUTO_QUOTE),
        },
      });
      const mockGemini = {} as GoogleGenerativeAI;
      const svc = buildAiService(mockCreate, mockGemini, mockGeminiGenerateContent);

      const result = await svc.correctExtractedData(
        { vehicle: { model: 'X' } },
        'premium: Required',
        InsuranceProduct.AUTO,
        Insurer.BRADESCO,
      );
      expect(result).toEqual(VALID_AUTO_QUOTE);
      expect(mockGeminiGenerateContent).toHaveBeenCalled();
    });
  });

  describe('extractHealthQuoteDraft', () => {
    const VALID_HEALTH_RESPONSE = {
      clientName: 'Empresa Exemplo',
      ageBandCounts: [{ bandLabel: 'até 18', minAge: 0, maxAge: 18, count: 1 }],
      lives: [],
      quoteOptions: [],
      reviewStatus: 'pending',
    };

    it('retorna JSON parseado quando Groq responde com JSON válido', async () => {
      const mockCreate = jest.fn().mockResolvedValue(makeResponse(JSON.stringify(VALID_HEALTH_RESPONSE)));
      const svc = buildAiService(mockCreate, null);

      const result = await svc.extractHealthQuoteDraft('texto saúde');

      expect(result).toEqual(VALID_HEALTH_RESPONSE);
    });

    it('remove markdown code fences antes de parsear o JSON', async () => {
      const withFences = `\`\`\`json\n${JSON.stringify(VALID_HEALTH_RESPONSE)}\n\`\`\``;
      const mockCreate = jest.fn().mockResolvedValue(makeResponse(withFences));
      const svc = buildAiService(mockCreate, null);

      const result = await svc.extractHealthQuoteDraft('texto saúde');

      expect(result).toEqual(VALID_HEALTH_RESPONSE);
    });

    it('não passa por SUPPORTED_PRODUCTS (não lança BadRequestException)', async () => {
      const mockCreate = jest.fn().mockResolvedValue(makeResponse(JSON.stringify(VALID_HEALTH_RESPONSE)));
      const svc = buildAiService(mockCreate, null);

      await expect(svc.extractHealthQuoteDraft('texto saúde')).resolves.not.toThrow();
    });

    it('lança InternalServerErrorException quando Groq retorna resposta vazia', async () => {
      const mockCreate = jest.fn().mockResolvedValue({ choices: [{ message: { content: '' } }] });
      const svc = buildAiService(mockCreate, null);

      await expect(svc.extractHealthQuoteDraft('texto')).rejects.toThrow();
    });
  });
});
