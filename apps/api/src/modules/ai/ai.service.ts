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

const HEALTH_SYSTEM_PROMPT = `Você é um especialista em extração de dados de cotações de planos de saúde brasileiros.
Retorne APENAS um objeto JSON válido conforme o formato solicitado.
Não inclua explicações, markdown, ou qualquer texto fora do JSON.
Regra crítica: nunca invente rede credenciada, coparticipação, carência ou reembolso sem evidência textual clara.`;

function getHealthQuoteDraftPrompt(): string {
  return `Você está analisando o texto bruto de uma cotação de plano de saúde (e possivelmente odonto).

Retorne EXATAMENTE o seguinte formato JSON:

{
  "clientName": "razão social ou nome do cliente, ou null se ausente",
  "companyDocument": "CNPJ ou CPF, ou null se ausente",
  "state": "UF de 2 letras, ou null",
  "city": "cidade, ou null",
  "sourceFiles": [],
  "ageBandCounts": [
    { "bandLabel": "rótulo da faixa exatamente como aparece (ex: até 18, 34-38)", "minAge": número, "maxAge": número, "count": número de vidas nessa faixa }
  ],
  "lives": [],
  "quoteOptions": [
    {
      "sourceType": "portal_pdf",
      "carrierOrOperator": "operadora ou seguradora exatamente como aparece",
      "administratorOrChannel": "administradora ou canal se diferente da operadora, ou null",
      "planName": "nome do plano exatamente como aparece",
      "productCode": "código do produto se disponível, ou null",
      "accommodation": { "value": "Enfermaria|Apartamento|null", "source": "extracted|inferred|not_found", "confidence": 0.0-1.0, "evidence": "trecho do texto", "needsReview": true|false },
      "coparticipation": { "value": "descrição ou null", "source": "...", "confidence": 0.0-1.0, "evidence": "...", "needsReview": true|false },
      "reimbursementMode": { "value": "descrição ou null", "source": "...", "confidence": 0.0-1.0, "evidence": "...", "needsReview": true|false },
      "validUntil": { "value": "data ou null", "source": "...", "confidence": 0.0-1.0, "evidence": "...", "needsReview": true|false },
      "dental": { "value": "descrição ou null se não há odonto nesta opção", "source": "...", "confidence": 0.0-1.0, "evidence": "...", "needsReview": true|false },
      "ageBandPrices": [
        { "bandLabel": "rótulo da faixa", "minAge": número, "maxAge": número, "pricePerLife": valor em reais }
      ],
      "monthlyTotal": total mensal em reais como número,
      "warnings": ["avisos de validade, recálculo, etc."]
    }
  ],
  "warnings": [],
  "reviewStatus": "pending"
}

Regras obrigatórias:

1. ageBandCounts: quando o PDF traz contagem de vidas por faixa etária (ex: "até 18: 1, 34-38: 1, 39-43: 1"), use "ageBandCounts" com count por faixa. Não crie vidas individuais nesses casos — o sistema faz isso automaticamente.

2. lives: use apenas quando o PDF ou planilha traz nomes ou idades individuais explícitas. Nesse caso cada vida deve ter: {"age": número, "name": "nome ou null", "source": "extracted", "needsReview": false}.

3. Se o PDF contém Saúde E Odonto no mesmo arquivo, crie entradas SEPARADAS em quoteOptions — uma para o plano médico, outra para o odonto.

4. Para cada DraftField (accommodation, coparticipation, reimbursementMode, validUntil, dental):
   - source "extracted": campo aparece claramente no texto
   - source "inferred": IA inferiu a partir de evidência indireta — needsReview DEVE ser true
   - source "not_found": campo ausente no texto — value DEVE ser null e needsReview DEVE ser true
   - confidence entre 0.0 e 1.0

5. Campos sensíveis com source "inferred" EXIGEM needsReview: true: accommodation, coparticipation, reimbursementMode, validUntil, dental.

6. NÃO invente rede credenciada, carência, reembolso ou coparticipação sem evidência textual explícita.

7. Campos opcionais ausentes devem ser null (não omitidos).`;
}


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

function getTokioMarineAutoPrompt(): string {
  return `Você está analisando uma Cotação de Seguro Auto da Tokio Marine.
O cabeçalho do documento é "Cotação Tokio Marine / Processo SUSEP nº 15414.100335/2004-74 (Automóvel)".
Pode ser uma renovação: o campo "Nome da Congênere" lista a SEGURADORA ANTERIOR — não a atual. O campo "insurer" deve ser sempre "Tokio Marine".

Há 5 produtos distintos. Use o texto para identificar qual se aplica:
1) Auto — cobertura completa, VMR 100%, oficina Livre Escolha, peças novas originais.
2) Auto Clássico — VMR 100%, oficina Rede Referenciada, carro reserva 7 dias, peças novas originais.
3) Auto Roubo + Rastreador — cobertura Incêndio e Roubo/Furto, VMR 100%, rastreador ITURAN obrigatório. NÃO rotular como compreensiva.
4) Auto Proteção Mensal — VMR 90%, RCF R$ 25.000, sem vidros/carro reserva, peças Novas Compatíveis. Produto mensal.
5) Assistência Exclusiva — sem casco (Casco, RCF e APP aparecem como "Não contratada"). Apenas Assistência 24 horas. Omita coverage.vehicle e coverage.rcf e coverage.app inteiramente.

Extraia TODOS os dados abaixo e retorne EXATAMENTE neste formato JSON (sem campos extras, sem markdown):

{
  "vehicle": {
    "plate": "placa do veículo (campo 'Placa')",
    "model": "marca e modelo completo (ex: VOLKSWAGEN GOL CITY/TREND 1.0 MI TOTAL FLEX 8V 2P)",
    "yearManufacture": ano de fabricação como número inteiro,
    "yearModel": ano do modelo como número inteiro,
    "chassis": "número do chassi (campo 'Chassi')",
    "fipeCode": "código FIPE (campo 'Código FIPE')",
    "fipeValue": valor de mercado FIPE em reais como número decimal — omitir se não disponível
  },
  "driver": {
    "name": "nome completo do proponente (campo 'Proponente')",
    "cpf": "CPF com pontuação",
    "birthDate": "data de nascimento DD/MM/AAAA se disponível",
    "gender": "Masculino ou Feminino se disponível",
    "maritalStatus": "estado civil se disponível"
  },
  "quoteNumber": "número da cotação (campo 'Nº Cotação')",
  "insurer": "Tokio Marine",
  "segment": "nome do produto exatamente como aparece no documento — ex: Auto, Auto Clássico, Auto Roubo + Rastreador, Auto Proteção Mensal, Assistência Exclusiva",
  "validFrom": "data de início da vigência DD/MM/AAAA",
  "validUntil": "data de fim da vigência DD/MM/AAAA",
  "bonusClass": "Classe de Bônus (campo 'Classe de Bônus') se disponível",
  "coverage": {
    "vehicle": {
      "fipePercentage": percentual VMR como número inteiro (campo '% de Ajuste' — ex: 100 ou 90) — omitir para Assistência Exclusiva,
      "deductible": valor da franquia parcial em reais como número decimal (campo 'Indenização Parcial do Veículo') — omitir para Assistência Exclusiva,
      "deductibleType": "tipo da franquia (ex: Básica)" — omitir para Assistência Exclusiva
    },
    "rcf": {
      "propertyDamage": LMI Danos Materiais em reais como número decimal — omitir se Não contratada,
      "bodilyInjury": LMI Danos Corporais em reais como número decimal — omitir se Não contratada,
      "moralDamages": null,
      "combinedSingle": null
    },
    "app": {
      "death": LMI Morte por passageiro em reais — omitir se Não contratada,
      "disability": LMI Invalidez por passageiro em reais — omitir se Não contratada,
      "medical": null,
      "passengerCount": lotação como número inteiro se disponível
    },
    "assistance": {
      "towing": true se Assistência 24 horas contratada,
      "glassProtection": true se Vidros contratados, false se 'Não possui' ou 'Não contratada' — omitir se ausente,
      "replacementVehicle": true se Carro reserva contratado, false se 'Não possui',
      "replacementDays": número de dias de carro reserva como inteiro (ex: 15 em '15 diárias Básico') — omitir se não contratado
    }
  },
  "coverageDetails": {
    "assistance": {
      "planName": "plano de assistência exatamente como aparece (ex: Completa, VIP) — omitir se não disponível",
      "towingKmBase": km padrão do plano como número inteiro quando o PDF exibe a fórmula (ex: '200 km (padrão)' → 200) — omitir se não disponível,
      "towingKmAdditional": km adicional contratado como número inteiro (campo 'Km adicional de reboque' — ex: 100) — omitir se 'Não possui' ou ausente,
      "towingKmTotal": total de km como número inteiro quando o PDF exibe o resultado (ex: '= 300 KM' → 300) — omitir se não disponível
    },
    "glass": {
      "tier": "tier de vidro exatamente como aparece (ex: Completo, Básico, Não possui) — omitir se campo vidros não aparecer"
    },
    "replacementVehicle": {
      "category": "categoria do carro reserva exatamente como aparece (ex: Básico (Mecânico)) — omitir se não contratado"
    },
    "services": {
      "martelinho": true se 'Martelinho e para-choque' = 'Possui', false se 'Não possui' — omitir se campo não aparecer no documento,
      "latariaEPintura": true se 'Lataria e pintura' = 'Possui', false se 'Não possui' — omitir se campo não aparecer,
      "rodaPneuSuspensao": true se 'Roda, pneu e suspensão' = 'Possui', false se 'Não possui' — omitir se campo não aparecer,
      "logoMarcaVidros": true se 'Logomarca (vidros)' = 'Possui', false se 'Não possui' — omitir se campo não aparecer
    },
    "repair": {
      "shopType": "tipo de oficina exatamente como aparece (ex: Livre Escolha, Rede Referenciada) — omitir se não disponível",
      "partsType": "tipo de peça exatamente como aparece (ex: Novas originais, Novas Compatíveis) — omitir se não disponível"
    }
  },
  "deductibles": [
    { "item": "Veículo", "value": valor da franquia em reais como número decimal }
  ],
  "premium": {
    "base": Prêmio Líquido total em reais como número decimal (campo 'Prêmio Líquido total'),
    "iof": null,
    "total": prêmio total do período em reais como número decimal — para produtos anuais use o valor 'à vista' da capa (ex: R$ 3.236,26); para Auto Proteção Mensal use o total anualizado da tabela de pagamento (coluna 'Total (R$)' da linha 12x — ex: 2.731,41), NÃO o valor mensal da capa (ex: NÃO usar R$ 227,56)
  },
  "paymentMethods": []
}

Regras importantes:
- "paymentMethods" sempre []
- "insurer" sempre "Tokio Marine" — NUNCA usar o valor de "Nome da Congênere" (seguradora anterior)
- Para Assistência Exclusiva: omitir coverage.vehicle, coverage.rcf, coverage.app inteiramente
- Para Auto Roubo + Rastreador: coverage.vehicle.fipePercentage = 100, NÃO classificar como compreensiva
- Para Auto Proteção Mensal: coverage.vehicle.fipePercentage = 90, produto é mensal
- Para campos de serviço (coverageDetails.services): usar exatamente o que o PDF mostra — NÃO inferir pelo produto. Se o campo não aparecer na tabela de serviços, omitir (não colocar false)
- coverageDetails pode ser omitido inteiramente quando nenhum campo de enriquecimento estiver disponível
- Campos numéricos como números, não strings
- Se campo não existir no documento, use null ou omita`;
}

function getBradescoAutoPrompt(): string {
  return `Você está analisando um Demonstrativo de Cálculo do Bradesco Auto/RE.
O documento tem até 5 páginas. Apenas as páginas 1 e 2 contêm dados relevantes para extração:
- Página 1: dados do segurado, dados do seguro, objeto do seguro, CLÁUSULAS contratadas.
- Página 2: LMI (limites de indenização), FRANQUIAS, PRÊMIOS.

IMPORTANTE — Bradesco Seguro Auto Lar (produto 1776):
O PDF pode conter uma seção "LIMITES MÁXIMOS DE INDENIZAÇÃO - LMI (R$) RESIDENCIAL" com coberturas de imóvel (incêndio, vendaval, RC Familiar, etc.).
IGNORE totalmente essa seção residencial. Extraia APENAS coberturas da seção AUTO (veículo, RCF, APP, assistência).

Extraia TODOS os dados abaixo e retorne EXATAMENTE neste formato JSON (sem campos extras, sem markdown):

{
  "vehicle": {
    "plate": "placa do veículo (campo 'Placa' no documento)",
    "model": "marca e modelo completos (campos 'Marca' + 'Tipo do Veículo')",
    "yearManufacture": ano de fabricação como número inteiro (campo 'Ano Fab.'),
    "yearModel": ano do modelo como número inteiro (campo 'Ano Mod.'),
    "chassis": "número do chassi (campo 'Chassi')",
    "fipeCode": "código FIPE (campo 'Código FIPE')",
    "fipeValue": null
  },
  "driver": {
    "name": "nome completo do segurado (campo 'Nome' em DADOS DO PROPONENTE)",
    "cpf": "CPF com pontuação (campo 'CPF/CNPJ' em DADOS DO PROPONENTE)",
    "birthDate": "data de nascimento DD/MM/AAAA (campo 'Data Nasc.')",
    "gender": "Masculino ou Feminino (campo 'Sexo')",
    "maritalStatus": "estado civil (campo 'Estado Civil')"
  },
  "quoteNumber": "número da cotação (campo 'Nº Cotação')",
  "insurer": "BRADESCO",
  "segment": "produto exatamente como aparece no campo 'Produto' — ex: 'Tradicional', '1583 - BRADESCO SEGURO AUTO CLASSIC', '1776 - SEGURO AUTO LAR'",
  "validFrom": "início da vigência DD/MM/AAAA (primeira data em 'Vigência')",
  "validUntil": "fim da vigência DD/MM/AAAA (segunda data em 'Vigência')",
  "bonusClass": "valor do campo 'Bônus' como string (ex: '02')",
  "vehicleUsage": "valor do campo 'Uso Veículo' como string (ex: 'Particular', 'Comercial')",
  "coverage": {
    "vehicle": {
      "fipePercentage": percentual do campo 'Fator de Ajuste' como número inteiro (ex: 100),
      "lmi": null,
      "deductible": franquia do veículo em reais como número decimal (linha 'Veículo' em FRANQUIAS),
      "deductibleType": "tipo da franquia extraído do texto da franquia entre parênteses — ex: 'Obrigatória', 'Reduzida', 'Normal'"
    },
    "rcf": {
      "propertyDamage": LMI de D.M. (Danos Materiais) em reais como número decimal,
      "bodilyInjury": LMI de D.C. (Danos Corporais) em reais como número decimal,
      "moralDamages": LMI de D. Morais em reais como número decimal (seção RCF, separado de D.M. e D.C.),
      "combinedSingle": LMI de G.U. (Garantia Única) em reais como número decimal ou null
    },
    "app": {
      "death": LMI de Morte p/ Passageiro em reais como número decimal,
      "disability": LMI de Invalidez p/ Passageiro em reais como número decimal,
      "medical": LMI de Despesas Médicas em reais como número decimal,
      "passengerCount": lotação oficial como número inteiro (campo 'Lotação Oficial')
    },
    "assistance": {
      "towing": true se qualquer cláusula de assistência/guincho estiver em CLÁUSULAS (procure por 'Assist'),
      "glassProtection": true se qualquer cláusula de vidros estiver em CLÁUSULAS (procure por 'Vidro'),
      "replacementVehicle": true se qualquer cláusula de carro reserva estiver em CLÁUSULAS (procure por 'Auto Reserva' ou 'Reserva'),
      "replacementDays": número de dias de carro reserva como inteiro — extraia do nome da cláusula (ex: 'Auto Reserva 07 Dias' → 7, 'Auto Reserva Plus 07 Dias' → 7)
    }
  },
  "coverageDetails": {
    "assistance": {
      "planName": "texto completo da cláusula de assistência como aparece em CLÁUSULAS, incluindo código entre parênteses — ex: '(043) Assist Dia/Noite 200Km', '(113) Assist Auto Dia/Noite - Passeio 400 KM'",
      "towingKmTotal": número de km de guincho extraído do nome da cláusula como inteiro (ex: '200Km' → 200, '400 KM' → 400) — null se não encontrado
    },
    "glass": {
      "tier": "nome do plano de vidros SEM o código entre parênteses — ex: 'Vidro Protegido Plus', 'Vidro Protegido Plus Logomarca', 'Reparo de Para-Brisa' — null se não contratado"
    },
    "replacementVehicle": {
      "category": "texto completo da cláusula de carro reserva como aparece em CLÁUSULAS, incluindo código — ex: 'Auto Reserva 07 Dias (060)', 'Auto Reserva Plus 07 Dias (030)' — null se não contratado"
    },
    "services": {
      "martelinho": true se a cláusula '(125) Repare Fácil - Sup. Martelinho' aparecer em CLÁUSULAS — false se ausente,
      "repareFacil": true se a cláusula '(126) Repare Fácil - Rep. Rapido' aparecer em CLÁUSULAS — false se ausente,
      "trocaParaChoque": true se a cláusula '(128) Troca de Para-Choque' aparecer em CLÁUSULAS — false se ausente,
      "rodaPneuSuspensao": true se a cláusula '(163) Rodas Pneus e Suspensão' aparecer em CLÁUSULAS — false se ausente,
      "logoMarcaVidros": true se o nome do plano de vidros contiver 'Logomarca' — false caso contrário
    }
  },
  "deductibles": [
    { "item": "nome do item da franquia (ex: 'Veículo', 'Para-Brisa', 'Vidros Laterais', 'Vidro Traseiro', 'Super Martelinho', 'Reparo Rápido')", "value": valor em reais como número decimal }
  ],
  "premium": {
    "base": prêmio AUTO (A) em reais como número decimal,
    "rcfTotal": total RCF (B) em reais como número decimal,
    "appTotal": total APP (C) em reais como número decimal,
    "iof": IOF em reais como número decimal,
    "total": TOTAL A PAGAR em reais como número decimal
  },
  "paymentMethods": []
}

Regras importantes:
- O campo "paymentMethods" será preenchido por outro sistema — retorne-o como array vazio []
- Em "deductibles" inclua somente itens com valor maior que zero. Inclua franquias de vidros, martelinho e reparo quando presentes.
- Campos numéricos devem ser números (não strings). Campos ausentes devem ser null ou omitidos.
- Use exatamente os nomes de campos em inglês conforme especificado.
- NÃO invente dados que não estão no documento. Se uma cláusula não aparecer em CLÁUSULAS, use false para flags booleanas.
- Para "martelinho", "repareFacil", "trocaParaChoque", "rodaPneuSuspensao": use false (não null) quando a cláusula não estiver presente — a diferença entre false e null/omitido é importante.`;
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

  async extractHealthQuoteDraft(
    rawText: string,
  ): Promise<Record<string, unknown>> {
    const prompt = getHealthQuoteDraftPrompt();
    return this.completeJsonFromMessages(
      [
        { role: 'system', content: HEALTH_SYSTEM_PROMPT },
        { role: 'user', content: `${prompt}\n\nTexto da cotação:\n${rawText}` },
      ],
      'extraction',
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
    } else if (product === InsuranceProduct.AUTO && insurer === Insurer.TOKIO_MARINE) {
      prompt = getTokioMarineAutoPrompt();
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
