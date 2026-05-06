import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { Insurer, InsuranceProduct } from '@prisma/client';
import { GEMINI_CLIENT, GROQ_CLIENT } from './ai.constants';

/** Detecta rate limit Groq (429 / rate_limit_exceeded) para acionar fallback Gemini. */
export function isGroqRateLimitExceeded(err: unknown): boolean {
  if (err == null || typeof err !== 'object') return false;
  const e = err as Record<string, unknown>;
  if (e.status === 429) return true;
  const nested = e.error as Record<string, unknown> | undefined;
  if (nested?.code === 'rate_limit_exceeded') return true;
  const msg = String(e.message ?? nested?.message ?? '');
  if (/rate_limit_exceeded/i.test(msg)) return true;
  return false;
}

function parseJsonFromLlmText(text: string): Record<string, unknown> {
  const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    throw new InternalServerErrorException('Resposta da IA não é JSON válido');
  }
}

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

function getAzulAutoPrompt(): string {
  return `Você está analisando uma Cotação de Seguro Auto da Azul Seguro Auto (marca licenciada da Porto Seguro).
O documento pode ter até 5 páginas. Cotações "resumidas" têm apenas 2 páginas mas contêm todos os dados essenciais.

Extraia TODOS os dados abaixo e retorne EXATAMENTE neste formato JSON (sem campos extras, sem markdown):

{
  "vehicle": {
    "plate": "placa do veículo (ex: ABC1D23 — campo 'Placa' ou 'Placa/Chassi')",
    "model": "marca e modelo completo (ex: JEEP COMPASS SPORT 1.3 T 270 FLEX)",
    "yearManufacture": ano de fabricação como número inteiro,
    "yearModel": ano do modelo como número inteiro,
    "chassis": "número do chassi (campo 'Chassi')",
    "fipeCode": "código FIPE (campo 'Código FIPE' ou 'Cód. FIPE')",
    "fipeValue": valor de mercado do veículo pela tabela FIPE em reais como número decimal (campo 'Valor FIPE' ou 'Valor de Referência' — normalmente acima de R$ 20.000; NÃO confundir com franquia)
  },
  "driver": {
    "name": "nome completo do segurado/condutor principal (campo 'Segurado' ou 'Condutor Principal')",
    "cpf": "CPF com pontuação (campo 'CPF')",
    "birthDate": "data de nascimento DD/MM/AAAA",
    "gender": "Masculino ou Feminino",
    "maritalStatus": "estado civil"
  },
  "quoteNumber": "número da cotação (campo 'Cotação' ou 'Número da Cotação')",
  "insurer": "Azul Seguro Auto",
  "segment": "valor exato do campo 'Segmento' do documento (ex: 'AZUL TRADICIONAL', 'AZUL AUTO ROUBO') — copie o texto exatamente como aparece",
  "validFrom": "data de início da vigência DD/MM/AAAA (campo 'Vigência' ou 'Início')",
  "validUntil": "data de fim da vigência DD/MM/AAAA",
  "bonusClass": "classe de bônus (ex: Bônus 0, Classe 0 — campo 'Bônus' ou 'Classe de Bônus')",
  "coverage": {
    "vehicle": {
      "fipePercentage": percentual FIPE coberto como número inteiro (ex: 100 ou 90 — verifique o campo 'COMPREENSIVA' ou 'INCÊNDIO, ROUBO E FURTO'),
      "lmi": "LMI do veículo como string (opcional)",
      "deductible": franquia do veículo em reais como número decimal (procure 'Franquia' na seção de coberturas — se 'Franquia: -' ou ausente, omita este campo),
      "deductibleType": "tipo da franquia (ex: Normal — omitir se não houver franquia)"
    },
    "rcf": {
      "propertyDamage": LMI de Danos Materiais em reais como número decimal (seção 'RCF-V DANOS MATERIAIS'),
      "bodilyInjury": LMI de Danos Corporais em reais como número decimal,
      "moralDamages": LMI de Danos Morais em reais como número decimal ou null,
      "combinedSingle": LMI de Limite Único Combinado em reais como número decimal ou null
    },
    "app": {
      "death": LMI de Morte por passageiro em reais como número decimal,
      "disability": LMI de Invalidez por passageiro em reais como número decimal,
      "medical": LMI de Despesas Médicas por passageiro em reais como número decimal,
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
    { "item": "nome do item (ex: Veículo, Vidros)", "value": valor em reais como número decimal, "type": "tipo (opcional)" }
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
- Em "deductibles" inclua somente itens com valor maior que zero — para Azul Auto Roubo a franquia é ausente, retorne "deductibles": []
- Campos numéricos devem ser números (não strings)
- Se um campo não estiver no documento, use null ou omita-o
- O percentual FIPE pode ser 90% (Azul Auto Roubo) ou 100% (Azul Tradicional) — extraia o valor real
- Use exatamente os nomes de campos em inglês conforme especificado
- ATENÇÃO CRÍTICA: "vehicle.fipeValue" é o valor de mercado do veículo (ex: R$ 80.000, R$ 120.000) e não a franquia. A franquia (ex: R$ 6.516) vai em "coverage.vehicle.deductible". Nunca coloque o valor da franquia em "fipeValue".`;
}

function getMitsuiSumitomoAutoPrompt(): string {
  return `Você está analisando uma Cotação de Seguro Auto Mitsui Sumitomo Seguros.
Este produto é emitido em cosseguro pela plataforma Porto Seguro (85% Porto Seguro, 15% Mitsui Sumitomo).
O cabeçalho mostra o CNPJ da Porto Seguro, mas a seguradora desta cotação é a Mitsui Sumitomo Seguros.
O documento pode ter até 5 páginas. Cotações "resumidas" têm apenas 2 páginas mas contêm todos os dados essenciais.

Extraia TODOS os dados abaixo e retorne EXATAMENTE neste formato JSON (sem campos extras, sem markdown):

{
  "vehicle": {
    "plate": "placa do veículo (ex: ABC1D23 — campo 'Placa')",
    "model": "marca e modelo completo (ex: JEEP COMPASS SPORT 1.3 T 270 FLEX)",
    "yearManufacture": ano de fabricação como número inteiro,
    "yearModel": ano do modelo como número inteiro,
    "chassis": "número do chassi (campo 'Chassi')",
    "fipeCode": "código FIPE (campo 'Fipe' ou 'Código FIPE')",
    "fipeValue": valor de mercado do veículo pela tabela FIPE em reais como número decimal (normalmente acima de R$ 20.000; NÃO confundir com franquia)
  },
  "driver": {
    "name": "nome completo do segurado/condutor principal",
    "cpf": "CPF com pontuação",
    "birthDate": "data de nascimento DD/MM/AAAA",
    "gender": "Masculino ou Feminino",
    "maritalStatus": "estado civil"
  },
  "quoteNumber": "número da cotação (campo 'Orçamento')",
  "insurer": "Mitsui Sumitomo Seguros",
  "segment": "valor exato do campo 'Segmento' do documento (ex: 'MITSUI SUMITOMO SEGUROS') — copie o texto exatamente como aparece",
  "validFrom": "data de início da vigência DD/MM/AAAA",
  "validUntil": "data de fim da vigência DD/MM/AAAA",
  "bonusClass": "classe de bônus (ex: Classe 0)",
  "coverage": {
    "vehicle": {
      "fipePercentage": percentual FIPE coberto como número inteiro (ex: 100 — seção COMPREENSIVA),
      "lmi": "LMI do veículo como string (opcional)",
      "deductible": franquia do veículo em reais como número decimal (procure 'Franquia' na seção de coberturas),
      "deductibleType": "tipo da franquia (ex: 50% da Obrigatória)"
    },
    "rcf": {
      "propertyDamage": LMI de Danos Materiais em reais como número decimal (seção 'RCF-V DANOS MATERIAIS'),
      "bodilyInjury": LMI de Danos Corporais em reais como número decimal,
      "moralDamages": LMI de Danos Morais em reais como número decimal ou null,
      "combinedSingle": LMI de Limite Único Combinado em reais como número decimal ou null
    },
    "app": {
      "death": LMI de Morte por passageiro em reais como número decimal,
      "disability": LMI de Invalidez por passageiro em reais como número decimal,
      "medical": LMI de Despesas Médicas por passageiro em reais como número decimal,
      "passengerCount": número de passageiros cobertos como inteiro
    },
    "assistance": {
      "towing": true se assistência/guincho contratado (Rede Referenciada conta como assistência),
      "glassProtection": true se cobertura de vidros contratada,
      "replacementVehicle": true se veículo reserva contratado,
      "replacementDays": número de dias de veículo reserva como inteiro
    }
  },
  "deductibles": [
    { "item": "nome do item (ex: Veículo, Vidros)", "value": valor em reais como número decimal, "type": "tipo (opcional)" }
  ],
  "premium": {
    "base": prêmio líquido/base em reais como número decimal (campo 'Prêmio Total Líquido'),
    "rcfTotal": total RCF em reais como número decimal,
    "appTotal": total APP em reais como número decimal,
    "iof": IOF em reais como número decimal,
    "total": prêmio total a pagar em reais como número decimal (campo 'Prêmio Total')
  },
  "paymentMethods": []
}

Regras importantes:
- O campo "paymentMethods" será preenchido por outro sistema — retorne-o como array vazio []
- Em "deductibles" inclua somente itens com valor maior que zero
- Campos numéricos devem ser números (não strings)
- Se um campo não estiver no documento, use null ou omita-o
- O CNPJ no cabeçalho pertence à Porto Seguro (cosseguradora líder) — mas o campo "insurer" deve ser sempre "Mitsui Sumitomo Seguros"
- ATENÇÃO CRÍTICA: "vehicle.fipeValue" é o valor de mercado do veículo e não a franquia
- Use exatamente os nomes de campos em inglês conforme especificado`;
}

function getItauAutoPrompt(): string {
  return `Você está analisando uma Cotação de Seguro Auto da Itaú Seguro Auto (marca licenciada da Porto Seguro).
O CNPJ no cabeçalho pode ser o da Porto Seguro — mesmo assim o campo "insurer" deve ser sempre "Itaú Seguro Auto".

Há produtos comerciais distintos. Use o texto do documento para decidir qual caso aplica — NÃO assume compreensiva tradicional quando o produto é outro:

1) ITAÚ TRADICIONAL (compreensiva/casco FIPE típico): extraia coberturas de veículo como em cotações completas (fipePercentage, deductible quando houver valor, deductibleType como "50% da Obrigatória" quando indicado).

2) ITAÚ SEGURO AUTO COMPACTO / COMPACTO: indenização integral parcial (ex.: 85% FIPE) — campo "coverage.vehicle.fipePercentage" deve refletir o percentual REAL (85, 100, etc.). Se "Franquia: -" ou ausente para casco compacto, NÃO invente deductible de casco tradicional.

3) ITAÚ ASSISTÊNCIA 24H: pode NÃO haver cobertura de COMPREENSIVA/casco tradicional — apenas reparos programados, APP, coberturas distintas, RCF opcional ou "não contratado". Omita coverage.vehicle inteiro se não existir Casco/compreensiva como no tradicional — isso não é erro de extração.

Extraia TODOS os dados abaixo e retorne EXATAMENTE neste formato JSON (sem campos extras, sem markdown):

{
  "vehicle": {
    "plate": "placa (campo Placa)",
    "model": "marca e modelo completos",
    "yearManufacture": ano fabricação inteiro,
    "yearModel": ano modelo inteiro,
    "chassis": "chassi",
    "fipeCode": "código Fipe/FIPE",
    "fipeValue": valor mercado FIPE em reais (não confundir com franquia nem com LMI de linhas de Coberturas — normalmente bem acima da franquia)
  },
  "driver": {
    "name": "nome do proponente/segurado",
    "cpf": "CPF com pontuação",
    "birthDate": "DD/MM/AAAA",
    "gender": "Masculino ou Feminino",
    "maritalStatus": "estado civil"
  },
  "quoteNumber": "campo Orçamento (ex: 5634702819-0-2)",
  "insurer": "Itaú Seguro Auto",
  "segment": "valor exato do campo Segmento conforme PDF — ex.: ITAÚ TRADICIONAL, ITAÚ SEGURO AUTO COMPACTO (mesmo que em linhas separadas, normalize para uma única string completa), ITAÚ ASSISTÊNCIA 24H",
  "validFrom": "início vigência DD/MM/AAAA",
  "validUntil": "fim vigência DD/MM/AAAA",
  "bonusClass": "classe de bônus (ex: Classe 0)",
  "coverage": {
    "vehicle": {
      "fipePercentage": percentual FIPE coberto como inteiro (100 no tradicional, 85 no compacto observado, omita se não houver casco)",
      "lmi": "LMI do veículo como string se fizer sentido",
      "deductible": franquia em reais se existir para o casco (senão omita)",
      "deductibleType": "ex.: 50% da Obrigatória, Normal — omita se não aplicável"
    },
    "rcf": {
      "propertyDamage": LMI danos materiais ou null se não contratado,
      "bodilyInjury": LMI danos corporais ou null,
      "moralDamages": null ou valor se houver,
      "combinedSingle": null ou valor se houver
    },
    "app": {
      "death": LMI morte por passageiro se houver,
      "disability": LMI invalidez se houver,
      "medical": despesas médicas se houver,
      "passengerCount": lotação se houver
    },
    "assistance": {
      "towing": true se houver guincho/assistência de painel,
      "glassProtection": true se vidros contratados,
      "replacementVehicle": true se carro reserva,
      "replacementDays": dias de reserva se houver
    }
  },
  "deductibles": [
    { "item": "nome", "value": valor em reais, "type": "opcional" }
  ],
  "premium": {
    "base": Prêmio Total Líquido em reais,
    "rcfTotal": soma prêmios RCF se separável, senão omita ou 0,
    "appTotal": soma APP se separável,
    "iof": IOF em reais,
    "total": Prêmio Total final em reais
  },
  "paymentMethods": []
}

Regras importantes:
- "paymentMethods" sempre []
- Omita objetos ou campos inteiramente quando o produto não tiver aquele elemento (principalmente Assistência 24h sem casco)
- Percentual FIPE do compacto deve ser extraído do texto (85.00%, etc.)
- Numéricos como número, não string
- Nunca preencher coverage.vehicle.fipePercentage=100 apenas porque o PDF é Porto/Itaú — respeite o produto`;

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

  constructor(
    @Inject(GROQ_CLIENT) private readonly groq: Groq,
    @Inject(GEMINI_CLIENT) private readonly gemini: GoogleGenerativeAI | null,
    private readonly config: ConfigService,
  ) {}

  async extractQuoteData(
    rawText: string,
    product: InsuranceProduct,
    insurer: Insurer,
    context?: { quoteId: string },
  ): Promise<Record<string, unknown>> {
    if (!SUPPORTED_PRODUCTS.includes(product as (typeof SUPPORTED_PRODUCTS)[number])) {
      throw new BadRequestException(`Produto ${product} não suportado`);
    }

    const prompt = this.buildExtractionPrompt(product, insurer, rawText);
    return this.completeJsonFromMessages(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      'extraction',
      context ? { ...context, insurer, product } : undefined,
    );
  }

  async correctExtractedData(
    invalidJson: Record<string, unknown>,
    zodError: string,
    product: InsuranceProduct,
    insurer: Insurer,
    context?: { quoteId: string },
  ): Promise<Record<string, unknown>> {
    const basePrompt = this.buildExtractionPrompt(product, insurer, '');
    return this.completeJsonFromMessages(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `${basePrompt}\n\nVocê retornou este JSON anteriormente:\n${JSON.stringify(invalidJson, null, 2)}\n\nPorém ele não satisfaz o formato esperado. Erro de validação: ${zodError}\n\nCorrija e retorne APENAS o JSON corrigido, sem markdown ou explicações.`,
        },
      ],
      'correction',
      context ? { ...context, insurer, product } : undefined,
    );
  }

  private buildExtractionPrompt(product: InsuranceProduct, insurer: Insurer, rawText: string): string {
    let prompt: string;

    if (product === InsuranceProduct.AUTO && insurer === Insurer.BRADESCO) {
      prompt = getBradescoAutoPrompt();
    } else if (product === InsuranceProduct.AUTO && insurer === Insurer.PORTO_SEGURO) {
      prompt = getPortoSeguroAutoPrompt();
    } else if (product === InsuranceProduct.AUTO && insurer === Insurer.AZUL) {
      prompt = getAzulAutoPrompt();
    } else if (product === InsuranceProduct.AUTO && insurer === Insurer.MITSUI_SUMITOMO) {
      prompt = getMitsuiSumitomoAutoPrompt();
    } else if (product === InsuranceProduct.AUTO && insurer === Insurer.ITAU) {
      prompt = getItauAutoPrompt();
    } else {
      prompt = `Extraia os dados da cotação de seguro ${product} da seguradora ${insurer} e retorne um objeto JSON estruturado com todas as informações relevantes.`;
    }

    return rawText ? `${prompt}\n\nTexto da cotação:\n${rawText}` : prompt;
  }

  private async completeJsonFromMessages(
    messages: { role: 'system' | 'user'; content: string }[],
    label: 'extraction' | 'correction',
    ctx?: { quoteId: string; insurer: Insurer; product: InsuranceProduct },
  ): Promise<Record<string, unknown>> {
    const ctxStr = ctx ? ` quoteId=${ctx.quoteId} insurer=${ctx.insurer} product=${ctx.product}` : '';

    try {
      const out = await this.invokeGroq(messages);
      this.logger.log(
        `[AI][${label}] provider=groq fallback=false${ctxStr} durationMs=${out.durationMs} tokens_in=${out.tokensIn} tokens_out=${out.tokensOut}`,
      );
      return parseJsonFromLlmText(out.body);
    } catch (err) {
      if (!isGroqRateLimitExceeded(err)) throw err;

      if (!this.gemini) {
        this.logger.warn(`[AI][${label}] provider=groq rate_limited=true fallback_unavailable=true${ctxStr}`);
        throw new InternalServerErrorException(
          'Groq rate limit (429 / rate_limit_exceeded). Defina GEMINI_API_KEY para usar fallback Gemini.',
        );
      }

      this.logger.warn(`[AI][${label}] provider=groq rate_limited=true attempting_gemini_fallback=true${ctxStr}`);
      const geminiOut = await this.invokeGemini(messages);
      this.logger.log(
        `[AI][${label}] provider=gemini fallback=true${ctxStr} durationMs=${geminiOut.durationMs}`,
      );
      return parseJsonFromLlmText(geminiOut.body);
    }
  }

  private async invokeGroq(
    messages: { role: 'system' | 'user'; content: string }[],
  ): Promise<{ body: string; durationMs: number; tokensIn: string; tokensOut: string }> {
    const t0 = Date.now();
    const response = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0,
    });
    const durationMs = Date.now() - t0;
    const usage = response.usage;
    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      throw new InternalServerErrorException('Resposta da IA não contém texto');
    }
    return {
      body: raw,
      durationMs,
      tokensIn: String(usage?.prompt_tokens ?? '?'),
      tokensOut: String(usage?.completion_tokens ?? '?'),
    };
  }

  private async invokeGemini(
    messages: { role: 'system' | 'user'; content: string }[],
  ): Promise<{ body: string; durationMs: number }> {
    if (!this.gemini) {
      throw new InternalServerErrorException('Gemini não configurado');
    }
    const systemInstruction =
      messages.find((m) => m.role === 'system')?.content ?? SYSTEM_PROMPT;
    const userText = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join('\n\n');

    const modelName =
      this.config.get<string>('GEMINI_MODEL')?.trim() || 'gemini-2.0-flash';
    const model = this.gemini.getGenerativeModel({
      model: modelName,
      systemInstruction,
    });

    const t0 = Date.now();
    const result = await model.generateContent(userText);
    const durationMs = Date.now() - t0;
    const body = result.response.text();
    if (!body?.trim()) {
      throw new InternalServerErrorException('Resposta da IA não contém texto');
    }
    return { body, durationMs };
  }
}
