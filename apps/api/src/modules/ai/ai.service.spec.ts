import Anthropic from '@anthropic-ai/sdk';
import { AiService } from './ai.service';
import { InsuranceProduct } from '@prisma/client';

const makeTextResponse = (text: string): Anthropic.Message =>
  ({
    content: [{ type: 'text', text }],
    stop_reason: 'end_turn',
  }) as unknown as Anthropic.Message;

const makeEmptyResponse = (): Anthropic.Message =>
  ({ content: [], stop_reason: 'end_turn' }) as unknown as Anthropic.Message;

describe('AiService', () => {
  let service: AiService;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    mockCreate = jest.fn();
    const mockAnthropic = { messages: { create: mockCreate } } as unknown as Anthropic;
    service = new AiService(mockAnthropic);
  });

  it('retorna JSON parseado quando Claude responde com JSON válido', async () => {
    const extracted = { insurer: 'BRADESCO', premium: 1200.5 };
    mockCreate.mockResolvedValue(makeTextResponse(JSON.stringify(extracted)));

    const result = await service.extractQuoteData('texto bruto da cotação', InsuranceProduct.AUTO);

    expect(result).toEqual(extracted);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-4-6',
        messages: [expect.objectContaining({ role: 'user' })],
      }),
    );
  });

  it('remove markdown code fences antes de parsear o JSON', async () => {
    const extracted = { insurer: 'BRADESCO', premium: 900 };
    const withFences = `\`\`\`json\n${JSON.stringify(extracted)}\n\`\`\``;
    mockCreate.mockResolvedValue(makeTextResponse(withFences));

    const result = await service.extractQuoteData('texto', InsuranceProduct.AUTO);

    expect(result).toEqual(extracted);
  });

  it('lança InternalServerErrorException quando Claude não retorna bloco de texto', async () => {
    mockCreate.mockResolvedValue(makeEmptyResponse());

    await expect(
      service.extractQuoteData('texto', InsuranceProduct.AUTO),
    ).rejects.toThrow('Resposta da IA não contém texto');
  });

  it('lança InternalServerErrorException quando Claude retorna JSON inválido', async () => {
    mockCreate.mockResolvedValue(makeTextResponse('isso não é json'));

    await expect(
      service.extractQuoteData('texto', InsuranceProduct.AUTO),
    ).rejects.toThrow('Resposta da IA não é JSON válido');
  });

  it('lança BadRequestException quando produto não é suportado', async () => {
    await expect(
      service.extractQuoteData('texto', InsuranceProduct.HEALTH),
    ).rejects.toThrow('Produto HEALTH não suportado');
  });
});
