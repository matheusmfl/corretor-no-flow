import Groq from 'groq-sdk';
import { AiService } from './ai.service';
import { InsuranceProduct, Insurer } from '@prisma/client';

const makeResponse = (text: string) => ({
  choices: [{ message: { content: text } }],
});

const VALID_AUTO_QUOTE = {
  vehicle: { model: 'Jeep Compass Sport 1.3', plate: 'PCI4A59', yearManufacture: 2025, yearModel: 2026, chassis: '988675CA2TKV89231', fipeCode: '13398', fipeValue: 7866.50 },
  driver: { name: 'Fabiano Alves da Silveira', cpf: '547.154.404-82', birthDate: '21/07/1971', gender: 'Masculino', maritalStatus: 'Casado' },
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

describe('AiService', () => {
  let service: AiService;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    mockCreate = jest.fn();
    const mockGroq = {
      chat: { completions: { create: mockCreate } },
    } as unknown as Groq;
    service = new AiService(mockGroq);
  });

  describe('extractQuoteData', () => {
    it('retorna JSON parseado quando Groq responde com JSON válido', async () => {
      mockCreate.mockResolvedValue(makeResponse(JSON.stringify(VALID_AUTO_QUOTE)));

      const result = await service.extractQuoteData('texto bruto da cotação', InsuranceProduct.AUTO, Insurer.BRADESCO);

      expect(result).toEqual(VALID_AUTO_QUOTE);
    });

    it('remove markdown code fences antes de parsear o JSON', async () => {
      const withFences = `\`\`\`json\n${JSON.stringify(VALID_AUTO_QUOTE)}\n\`\`\``;
      mockCreate.mockResolvedValue(makeResponse(withFences));

      const result = await service.extractQuoteData('texto', InsuranceProduct.AUTO, Insurer.BRADESCO);

      expect(result).toEqual(VALID_AUTO_QUOTE);
    });

    it('usa prompt Bradesco-específico quando insurer é BRADESCO', async () => {
      mockCreate.mockResolvedValue(makeResponse(JSON.stringify(VALID_AUTO_QUOTE)));

      await service.extractQuoteData('texto', InsuranceProduct.AUTO, Insurer.BRADESCO);

      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: { role: string }) => m.role === 'user');
      expect(userMessage.content).toContain('Bradesco');
    });

    it('lança InternalServerErrorException quando Groq não retorna texto', async () => {
      mockCreate.mockResolvedValue(makeResponse(''));

      await expect(
        service.extractQuoteData('texto', InsuranceProduct.AUTO, Insurer.BRADESCO),
      ).rejects.toThrow('Resposta da IA não contém texto');
    });

    it('lança InternalServerErrorException quando Groq retorna JSON inválido', async () => {
      mockCreate.mockResolvedValue(makeResponse('isso não é json'));

      await expect(
        service.extractQuoteData('texto', InsuranceProduct.AUTO, Insurer.BRADESCO),
      ).rejects.toThrow('Resposta da IA não é JSON válido');
    });

    it('lança BadRequestException quando produto não é suportado', async () => {
      await expect(
        service.extractQuoteData('texto', InsuranceProduct.HEALTH, Insurer.BRADESCO),
      ).rejects.toThrow('Produto HEALTH não suportado');
    });
  });

  describe('correctExtractedData', () => {
    it('chama Groq com o JSON inválido e o erro Zod e retorna JSON corrigido', async () => {
      const corrected = { ...VALID_AUTO_QUOTE };
      mockCreate.mockResolvedValue(makeResponse(JSON.stringify(corrected)));

      const invalid = { vehicle: { model: 'X' }, premium: { total: 0 } };
      const result = await service.correctExtractedData(invalid, 'insurer: Required', InsuranceProduct.AUTO, Insurer.BRADESCO);

      expect(result).toEqual(corrected);

      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: { role: string }) => m.role === 'user');
      expect(userMessage.content).toContain('insurer: Required');
      expect(userMessage.content).toContain(JSON.stringify(invalid, null, 2));
    });
  });
});
