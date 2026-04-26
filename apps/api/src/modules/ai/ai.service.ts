import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { InsuranceProduct } from '@prisma/client';
import { ANTHROPIC_CLIENT } from './ai.constants';

const SUPPORTED_PRODUCTS = [InsuranceProduct.AUTO] as const;

const SYSTEM_PROMPT = `Você é um especialista em extração de dados de cotações de seguros brasileiros.
Dado o texto bruto de uma cotação, extraia todas as informações relevantes e retorne APENAS um objeto JSON válido.
Não inclua explicações, markdown, ou qualquer texto fora do JSON.`;

const PRODUCT_PROMPTS: Partial<Record<InsuranceProduct, string>> = {
  [InsuranceProduct.AUTO]: `Extraia os dados da cotação de seguro AUTO. Inclua: seguradora, prêmio total, parcelas, coberturas, dados do veículo (marca, modelo, ano), franquias e quaisquer outros campos presentes.`,
};

@Injectable()
export class AiService {
  constructor(@Inject(ANTHROPIC_CLIENT) private readonly anthropic: Anthropic) {}

  async extractQuoteData(rawText: string, product: InsuranceProduct): Promise<Record<string, unknown>> {
    if (!SUPPORTED_PRODUCTS.includes(product as (typeof SUPPORTED_PRODUCTS)[number])) {
      throw new BadRequestException(`Produto ${product} não suportado`);
    }

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `${PRODUCT_PROMPTS[product]}\n\nTexto da cotação:\n${rawText}`,
        },
      ],
    });

    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text');
    if (!textBlock) {
      throw new InternalServerErrorException('Resposta da IA não contém texto');
    }

    const cleaned = textBlock.text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();

    try {
      return JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      throw new InternalServerErrorException('Resposta da IA não é JSON válido');
    }
  }
}
