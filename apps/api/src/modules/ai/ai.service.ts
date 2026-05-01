import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';
import { Insurer, InsuranceProduct } from '@prisma/client';
import { GROQ_CLIENT } from './ai.constants';

const SUPPORTED_PRODUCTS = [InsuranceProduct.AUTO] as const;

const SYSTEM_PROMPT = `Você é um especialista em extração de dados de cotações de seguros brasileiros.
Dado o texto bruto de uma cotação, extraia todas as informações relevantes e retorne APENAS um objeto JSON válido.
Não inclua explicações, markdown, ou qualquer texto fora do JSON.`;

function getPortoSeguroAutoPrompt(): string {
  return `Você está analisando uma Cotação de Seguro Auto da Porto Seguro.
O documento pode ter até 5 páginas. Cotações "resumidas" têm apenas 2 páginas mas contêm todos os dados essenciais.

Extraia TODOS os dados abaixo e retorne EXATAMENTE neste formato JSON (sem campos extras, sem markdown):

{
  "vehicle": {
    "plate": "placa do veículo (ex: ABC1D23 — campo 'Placa' ou 'Placa/Chassi')",
    "model": "marca e modelo completo (ex: JEEP COMPASS SPORT)",
    "yearManufacture": ano de fabricação como número inteiro,
    "yearModel": ano do modelo como número inteiro,
    "chassis": "número do chassi (campo 'Chassi')",
    "fipeCode": "código FIPE (campo 'Código FIPE' ou 'Cód. FIPE')",
    "fipeValue": valor FIPE em reais como número decimal
  },
  "driver": {
    "name": "nome completo do segurado/condutor principal (campo 'Segurado' ou 'Condutor Principal')",
    "cpf": "CPF com pontuação (campo 'CPF')",
    "birthDate": "data de nascimento DD/MM/AAAA",
    "gender": "Masculino ou Feminino",
    "maritalStatus": "estado civil"
  },
  "quoteNumber": "número da cotação (ex: 5634702819-0-1 — campo 'Cotação' ou 'Número da Cotação')",
  "insurer": "Porto Seguro",
  "validFrom": "data de início da vigência DD/MM/AAAA (campo 'Vigência' ou 'Início')",
  "validUntil": "data de fim da vigência DD/MM/AAAA",
  "bonusClass": "classe de bônus (ex: Bônus 0, 10% sem sinistro — campo 'Bônus' ou 'Classe de Bônus')",
  "coverage": {
    "vehicle": {
      "fipePercentage": percentual FIPE coberto como número inteiro (ex: 100),
      "lmi": "LMI do veículo como string (opcional)",
      "deductible": franquia do veículo em reais como número decimal (procure 'Franquia' na seção de coberturas),
      "deductibleType": "tipo da franquia (ex: Reduzida, Normal, Majorada)"
    },
    "rcf": {
      "propertyDamage": LMI de Danos Materiais em reais como número decimal (seção 'RC Facultativo' ou 'RCF'),
      "bodilyInjury": LMI de Danos Corporais em reais como número decimal,
      "moralDamages": LMI de Danos Morais em reais como número decimal ou null,
      "combinedSingle": LMI de Limite Único Combinado em reais como número decimal ou null
    },
    "app": {
      "death": LMI de Morte por passageiro em reais como número decimal (seção 'APP' ou 'Acidentes Pessoais de Passageiros'),
      "disability": LMI de Invalidez por passageiro em reais como número decimal,
      "medical": LMI de Despesas Médicas/Hospitalares por passageiro em reais como número decimal,
      "passengerCount": número de passageiros cobertos como inteiro
    },
    "assistance": {
      "towing": true se assistência/guincho contratado,
      "glassProtection": true se cobertura de vidros contratada,
      "replacementVehicle": true se veículo reserva contratado,
      "replacementDays": número de dias de veículo reserva como inteiro
    }
  },
  "deductibles": [
    { "item": "nome do item (ex: Veículo, Vidros, Faróis)", "value": valor em reais como número decimal, "type": "tipo (opcional)" }
  ],
  "premium": {
    "base": prêmio líquido/base em reais como número decimal,
    "rcfTotal": total RCF em reais como número decimal,
    "appTotal": total APP em reais como número decimal,
    "iof": IOF em reais como número decimal,
    "total": prêmio total a pagar em reais como número decimal (campo 'Prêmio Total' ou 'Total a Pagar')
  },
  "paymentMethods": []
}

Regras importantes:
- O campo "paymentMethods" será preenchido por outro sistema — retorne-o como array vazio []
- Em "deductibles" inclua somente itens com valor maior que zero
- Campos numéricos devem ser números (não strings)
- Se um campo não estiver no documento, use null ou omita-o
- Use exatamente os nomes de campos em inglês conforme especificado`;
}

function getBradescoAutoPrompt(): string {
  return `Você está analisando um Demonstrativo de Cálculo do Bradesco Auto/RE.
O documento tem até 5 páginas, sendo que apenas as 3 primeiras contêm dados relevantes (as demais são cláusulas contratuais).

Extraia TODOS os dados abaixo e retorne EXATAMENTE neste formato JSON (sem campos extras, sem markdown):

{
  "vehicle": {
    "plate": "placa do veículo no formato AAA-0000 (padrão antigo) ou AAA0A00 (Mercosul) — no documento Bradesco aparece com o nome 'Licença' ou 'Licença do Veículo'",
    "model": "marca, modelo e versão completa",
    "yearManufacture": ano de fabricação como número inteiro,
    "yearModel": ano do modelo como número inteiro,
    "chassis": "número do chassi",
    "fipeCode": "código FIPE",
    "fipeValue": valor FIPE de referência em reais como número decimal
  },
  "driver": {
    "name": "nome completo do segurado/condutor principal",
    "cpf": "CPF com pontuação",
    "birthDate": "data de nascimento DD/MM/AAAA",
    "gender": "Masculino ou Feminino",
    "maritalStatus": "estado civil"
  },
  "quoteNumber": "número da proposta/cotação",
  "insurer": "Bradesco Auto/RE",
  "validFrom": "início da validade da cotação DD/MM/AAAA",
  "validUntil": "fim da validade da cotação DD/MM/AAAA",
  "bonusClass": "classe de bônus (ex: 10% - Sem Sinistro)",
  "coverage": {
    "vehicle": {
      "fipePercentage": percentual FIPE coberto como número inteiro (ex: 100),
      "lmi": "LMI do veículo como string (opcional)",
      "deductible": franquia principal do veículo em reais como número decimal,
      "deductibleType": "tipo da franquia (ex: Reduzida, Normal)"
    },
    "rcf": {
      "propertyDamage": LMI de Danos Materiais (D.M.) em reais como número decimal,
      "bodilyInjury": LMI de Danos Corporais (D.C.) em reais como número decimal,
      "moralDamages": LMI de Danos Morais em reais como número decimal (procure por "Danos Morais" ou "D.M.R." na seção RCF — valor separado de D.M. e D.C.),
      "combinedSingle": LMI de Garantia Única (G.U.) em reais como número decimal ou null se não contratado
    },
    "app": {
      "death": LMI de Morte por passageiro em reais como número decimal (procure por "Morte" ou "Morte Acidental" na seção APP/Acidentes Pessoais — ex: R$ 5.000,00 → 5000),
      "disability": LMI de Invalidez Permanente por passageiro em reais como número decimal (procure por "Invalidez" ou "IPA" — ex: R$ 5.000,00 → 5000),
      "medical": LMI de Despesas Médicas/Hospitalares por passageiro em reais como número decimal,
      "passengerCount": número de passageiros cobertos como inteiro (lotação oficial do veículo)
    },
    "assistance": {
      "towing": true se guincho contratado,
      "glassProtection": true se proteção de vidros contratada,
      "replacementVehicle": true se veículo reserva contratado,
      "replacementDays": número de dias de veículo reserva como inteiro
    }
  },
  "deductibles": [
    { "item": "nome do item (ex: Veículo, Vidro Dianteiro, Vidros Laterais, Vidro Traseiro, Espelhos, Faróis)", "value": valor em reais como número decimal, "type": "tipo (opcional)" }
  ],
  "premium": {
    "base": prêmio AUTO base em reais como número decimal,
    "rcfTotal": total RCF em reais como número decimal,
    "appTotal": total APP em reais como número decimal,
    "iof": IOF em reais como número decimal,
    "total": total a pagar em reais como número decimal
  },
  "paymentMethods": []
}

Regras importantes:
- O campo "paymentMethods" será preenchido por outro sistema — retorne-o como array vazio []
- Em "deductibles" inclua somente itens com valor maior que zero
- Campos numéricos devem ser números (não strings)
- Se um campo não estiver no documento, use null ou omita-o
- Use exatamente os nomes de campos em inglês conforme especificado`;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(@Inject(GROQ_CLIENT) private readonly groq: Groq) {}

  async extractQuoteData(rawText: string, product: InsuranceProduct, insurer: Insurer): Promise<Record<string, unknown>> {
    if (!SUPPORTED_PRODUCTS.includes(product as (typeof SUPPORTED_PRODUCTS)[number])) {
      throw new BadRequestException(`Produto ${product} não suportado`);
    }

    const prompt = this.buildExtractionPrompt(product, insurer, rawText);
    return this.callGroq([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]);
  }

  async correctExtractedData(
    invalidJson: Record<string, unknown>,
    zodError: string,
    product: InsuranceProduct,
    insurer: Insurer,
  ): Promise<Record<string, unknown>> {
    this.logger.debug(`Tentando corrigir JSON inválido. Erro Zod: ${zodError}`);

    const basePrompt = this.buildExtractionPrompt(product, insurer, '');
    return this.callGroq([
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `${basePrompt}\n\nVocê retornou este JSON anteriormente:\n${JSON.stringify(invalidJson, null, 2)}\n\nPorém ele não satisfaz o formato esperado. Erro de validação: ${zodError}\n\nCorrija e retorne APENAS o JSON corrigido, sem markdown ou explicações.`,
      },
    ]);
  }

  private buildExtractionPrompt(product: InsuranceProduct, insurer: Insurer, rawText: string): string {
    let prompt: string;

    if (product === InsuranceProduct.AUTO && insurer === Insurer.BRADESCO) {
      prompt = getBradescoAutoPrompt();
    } else if (product === InsuranceProduct.AUTO && insurer === Insurer.PORTO_SEGURO) {
      prompt = getPortoSeguroAutoPrompt();
    } else {
      prompt = `Extraia os dados da cotação de seguro ${product} da seguradora ${insurer} e retorne um objeto JSON estruturado com todas as informações relevantes.`;
    }

    return rawText ? `${prompt}\n\nTexto da cotação:\n${rawText}` : prompt;
  }

  private async callGroq(messages: { role: 'system' | 'user'; content: string }[]): Promise<Record<string, unknown>> {
    const response = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0,
    });

    const text = response.choices[0]?.message?.content;
    this.logger.debug(`Resposta bruta do Groq:\n${text}`);

    if (!text) {
      throw new InternalServerErrorException('Resposta da IA não contém texto');
    }

    const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();

    try {
      return JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      throw new InternalServerErrorException('Resposta da IA não é JSON válido');
    }
  }
}
