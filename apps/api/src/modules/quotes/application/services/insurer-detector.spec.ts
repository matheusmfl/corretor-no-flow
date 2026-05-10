import * as fs from 'fs';
import * as path from 'path';
import { detectInsurerFromText } from './insurer-detector';

const BRADESCO_TEXT = `
  BRADESCO SEGUROS S/A
  CNPJ 92.693.973/0001-33
  Proposta de Seguro Automóvel
`;

const PORTO_TEXT = `
  Porto Seguro Companhia de Seguros Gerais
  CNPJ: 61.198.164.0001/60
  Cotação de Seguro Auto
`;

const PORTO_ITAU_TEXT = `
  ITAÚ SEGUROS S/A
  Cotação Itaú Auto
  Porto Seguro Companhia de Seguros — Condições Gerais aplicáveis
`;

const ALLIANZ_ALIRO_TEXT = `
  ALIRO SEGUROS S/A
  Proposta de Seguro Automóvel
  Grupo Allianz — administração e resseguro
`;

// Mitsui aparece em PDFs emitidos pela plataforma Porto mas sem razão social formal
const PORTO_MITSUI_TEXT = `
  Porto Seguro Companhia de Seguros Gerais
  CNPJ: 61.198.164.0001/60
  Mitsui Sumitomo Seguros — emissor do contrato
`;

// Mitsui com apenas marca (medium) + porto forte
const PORTO_MITSUI_MEDIUM_TEXT = `
  Porto Seguro Companhia de Seguros Gerais
  CNPJ: 61.198.164.0001/60
  Seguro emitido em parceria com Mitsui
`;

// Itaú com apenas "Itaú Seguros" (sem S/A) — medium signal
const PORTO_ITAU_MEDIUM_TEXT = `
  Porto Seguro Companhia de Seguros Gerais
  CNPJ: 61.198.164.0001/60
  Emitido por Itaú Seguros em regime de parceria
`;

// Azul Tradicional — família Porto com headline de produto Azul
const PORTO_AZUL_TRADICIONAL_TEXT = `
  Porto Seguro Companhia de Seguros Gerais
  CNPJ: 61.198.164.0001/60
  Azul Tradicional e Proteção Combinada
  Orçamento de Seguro Auto
`;

// Azul Auto Roubo — produto incêndio/roubo/furto da Azul
const PORTO_AZUL_ROUBO_TEXT = `
  Porto Seguro Companhia de Seguros Gerais
  CNPJ: 61.198.164.0001/60
  Azul Auto Roubo
  Orçamento de Seguro Auto
`;

// Itaú Seguro Auto Compacto — produto compacto com 85% FIPE
const PORTO_ITAU_COMPACTO_TEXT = `
  Porto Seguro Companhia de Seguros Gerais
  CNPJ: 61.198.164.0001/60
  Itaú Seguro Auto Compacto
  Orçamento de Seguro Auto
`;

// Itaú Assistência 24h — produto sem casco tradicional
const PORTO_ITAU_ASSISTENCIA_TEXT = `
  Porto Seguro Companhia de Seguros Gerais
  CNPJ: 61.198.164.0001/60
  Itaú Assistência 24h
  Orçamento de Seguro Auto
`;

// Texto com sinais fortes de AUTO mas sem seguradora conhecida
const AUTO_CLEAR_TEXT = `
  Orçamento de Seguro Auto
  Veículo: VOLKSWAGEN GOL 1.0
  Placa: ABC1D23
  FIPE: 005171-4
  Franquia do veículo: R$ 3.500,00
`;

// Texto somente de saúde, sem seguradora identificada
const HEALTH_ONLY_TEXT = `
  Plano de Saúde Individual
  Cobertura hospitalar
  Consultas médicas e internação hospitalar incluídas
  Rede credenciada disponível
`;

// PDF de saúde com menção isolada de "seguro auto" no rodapé (ruído)
const HEALTH_WITH_AUTO_NOISE_TEXT = `
  BRADESCO SEGUROS S/A
  CNPJ 92.693.973/0001-33
  Plano de Saúde — Cobertura Hospitalar
  Consultas médicas e internação hospitalar incluídas
  Veja também: seguro auto particular
`;

// Bradesco detectado mas PDF é de saúde
const BRADESCO_SAUDE_TEXT = `
  BRADESCO SEGUROS S/A
  CNPJ 92.693.973/0001-33
  Plano de Saúde — Cobertura Hospitalar
  Consultas médicas e internação hospitalar incluídas
`;

const WEAK_GROUP_ONLY_TEXT = `
  cotação de seguro auto
  banco parceiro Grupo Porto
  condições gerais aplicáveis
`;

const AMBIGUOUS_TWO_STRONG_TEXT = `
  BRADESCO SEGUROS S/A
  Porto Seguro Companhia de Seguros Gerais
`;

const TOKIO_TEXT = `
  Tokio Marine HDI Seguros S/A
  Proposta de Seguro Automóvel — Tokio Marine
`;

// Renovação Bradesco onde a congênere anterior é Tokio Marine — deve retornar BRADESCO
const BRADESCO_RENOVACAO_TOKIO_CONGENERE_TEXT = `
BRADESCO SEGUROS S/A
CNPJ 92.693.973/0001-33
Proposta de Seguro Automóvel — Bradesco Auto/RE
Tipo Seguro: Renovação Congênere
Nome da Congênere: Tokio Marine Seguros
Placa: ABC1D23
Chassi: 00000000000000000
Código FIPE: 005227-2
RCF-V Danos Materiais R$ 50.000,00
`;

// Renovação Tokio com Bradesco como congênere anterior — detector deve retornar TOKIO_MARINE
const TOKIO_RENOVACAO_BRADESCO_CONGENERE_TEXT = `
Cotação Tokio Marine
Processo SUSEP nº 15414.100335/2004-74 (Automóvel)
Aceitação sujeita a análise da Seguradora
Nº Cotação: 1016728949 | Validade cotação: 13/05/2026 | Vigência: 06/05/2026 a 06/05/2027
Selecionamos o produto ideal para você:
Auto
Valor Referenciado (VMR), Colisão, Incêndio e Roubo/Furto
Tipo Seguro Vigência
Renovação Congênere 06/05/2026 - 06/05/2027 Sim ABC-0A00
VOLKSWAGEN GOL CITY/TREND 1.0 MI TOTAL FLEX 8V 2P
Código FIPE: 005227-2
Nome da Congênere Número da apólice Fim de vigência Classe de Bônus
5312 - BRADESCO SEGUROS S/A 178550 15/05/2026 2
Colisão, Incêndio e Roubo/Furto Valor Referenciado (VMR) % de Ajuste - 100,00%
RCF-V - Danos Materiais R$ 50.000,00
Prêmio Líquido total R$ 3.013,84
`;

describe('detectInsurerFromText', () => {
  describe('detecção com alta confiança', () => {
    it('detecta BRADESCO com confiança alta a partir de razão social e CNPJ', () => {
      const result = detectInsurerFromText(BRADESCO_TEXT);
      expect(result.detectedInsurer).toBe('BRADESCO');
      expect(result.confidence).toBe('high');
    });

    it('detecta PORTO_SEGURO com confiança alta a partir de razão social e CNPJ', () => {
      const result = detectInsurerFromText(PORTO_TEXT);
      expect(result.detectedInsurer).toBe('PORTO_SEGURO');
      expect(result.confidence).toBe('high');
    });

    it('detecta TOKIO_MARINE com confiança alta (suporte a parser é responsabilidade do endpoint)', () => {
      const result = detectInsurerFromText(TOKIO_TEXT);
      expect(result.detectedInsurer).toBe('TOKIO_MARINE');
      expect(result.confidence).toBe('high');
    });

    it('detecta TOKIO_MARINE com alta confiança em renovação onde Bradesco é a congênere anterior', () => {
      const result = detectInsurerFromText(TOKIO_RENOVACAO_BRADESCO_CONGENERE_TEXT);
      expect(result.detectedInsurer).toBe('TOKIO_MARINE');
      expect(result.confidence).toBe('high');
    });

    it('não retorna BRADESCO quando aparece apenas como congênere anterior em PDF Tokio', () => {
      const result = detectInsurerFromText(TOKIO_RENOVACAO_BRADESCO_CONGENERE_TEXT);
      expect(result.detectedInsurer).not.toBe('BRADESCO');
    });

    it('detecta BRADESCO com alta confiança em renovação onde Tokio é a congênere anterior', () => {
      const result = detectInsurerFromText(BRADESCO_RENOVACAO_TOKIO_CONGENERE_TEXT);
      expect(result.detectedInsurer).toBe('BRADESCO');
      expect(result.confidence).toBe('high');
    });
  });

  describe('regras de família', () => {
    it('retorna ITAU com alta confiança quando sinal forte presente (família Porto)', () => {
      const result = detectInsurerFromText(PORTO_ITAU_TEXT);
      expect(result.detectedInsurer).toBe('ITAU');
      expect(result.confidence).toBe('high');
      expect(result.family).toBe('porto');
      expect(result.notProcessable).toBeUndefined();
    });

    it('não retorna PORTO_SEGURO quando Itaú tem sinal forte (família Porto)', () => {
      const result = detectInsurerFromText(PORTO_ITAU_TEXT);
      expect(result.detectedInsurer).not.toBe('PORTO_SEGURO');
      expect(result.family).toBe('porto');
    });

    it('retorna ITAU com confiança média quando apenas marca presente (família Porto)', () => {
      const result = detectInsurerFromText(PORTO_ITAU_MEDIUM_TEXT);
      expect(result.detectedInsurer).toBe('ITAU');
      expect(result.family).toBe('porto');
      expect(result.notProcessable).toBeUndefined();
    });

    it('não retorna PORTO_SEGURO quando Itaú tem sinal médio (sem S/A)', () => {
      const result = detectInsurerFromText(PORTO_ITAU_MEDIUM_TEXT);
      expect(result.detectedInsurer).not.toBe('PORTO_SEGURO');
      expect(result.family).toBe('porto');
    });

    it('detecta MITSUI_SUMITOMO com alta confiança quando sinal forte presente (família Porto)', () => {
      const result = detectInsurerFromText(PORTO_MITSUI_TEXT);
      expect(result.detectedInsurer).toBe('MITSUI_SUMITOMO');
      expect(result.confidence).toBe('high');
      expect(result.family).toBe('porto');
      expect(result.notProcessable).toBeUndefined();
    });

    it('não retorna PORTO_SEGURO quando Mitsui tem sinal forte (família Porto)', () => {
      const result = detectInsurerFromText(PORTO_MITSUI_TEXT);
      expect(result.detectedInsurer).not.toBe('PORTO_SEGURO');
      expect(result.family).toBe('porto');
    });

    it('detecta MITSUI_SUMITOMO com confiança média quando apenas marca presente (família Porto)', () => {
      const result = detectInsurerFromText(PORTO_MITSUI_MEDIUM_TEXT);
      expect(result.detectedInsurer).toBe('MITSUI_SUMITOMO');
      expect(result.family).toBe('porto');
      expect(result.notProcessable).toBeUndefined();
    });

    it('não retorna PORTO_SEGURO quando Mitsui tem sinal médio (marca apenas)', () => {
      const result = detectInsurerFromText(PORTO_MITSUI_MEDIUM_TEXT);
      expect(result.detectedInsurer).not.toBe('PORTO_SEGURO');
      expect(result.family).toBe('porto');
    });

    it('detecta ALIRO quando Aliro tem sinal forte e Allianz é menção de grupo (família Allianz)', () => {
      const result = detectInsurerFromText(ALLIANZ_ALIRO_TEXT);
      expect(result.detectedInsurer).toBe('ALIRO');
      expect(result.family).toBe('allianz');
    });
  });

  describe('regras de família — Azul', () => {
    it('detecta AZUL como seguradora suportada com alta confiança a partir de produto Azul Tradicional', () => {
      const result = detectInsurerFromText(PORTO_AZUL_TRADICIONAL_TEXT);
      expect(result.detectedInsurer).toBe('AZUL');
      expect(result.confidence).toBe('high');
      expect(result.family).toBe('porto');
      expect(result.notProcessable).toBeUndefined();
    });

    it('não retorna PORTO_SEGURO quando Azul Tradicional aparece como produto (família Porto)', () => {
      const result = detectInsurerFromText(PORTO_AZUL_TRADICIONAL_TEXT);
      expect(result.detectedInsurer).not.toBe('PORTO_SEGURO');
      expect(result.family).toBe('porto');
    });

    it('não retorna PORTO_SEGURO quando Azul Auto Roubo aparece como produto (família Porto)', () => {
      const result = detectInsurerFromText(PORTO_AZUL_ROUBO_TEXT);
      expect(result.detectedInsurer).not.toBe('PORTO_SEGURO');
      expect(result.detectedInsurer).toBe('AZUL');
      expect(result.family).toBe('porto');
    });

    it('sinais de PORTO_SEGURO são downgraded para weak quando Azul é detectado', () => {
      const result = detectInsurerFromText(PORTO_AZUL_TRADICIONAL_TEXT);
      const portoSignals = result.signals.filter((s) => s.insurer === 'PORTO_SEGURO');
      expect(portoSignals.every((s) => s.type === 'weak')).toBe(true);
    });
  });

  describe('regras de família — Itaú headlines', () => {
    it('não retorna PORTO_SEGURO quando Itaú Seguro Auto Compacto aparece como produto', () => {
      const result = detectInsurerFromText(PORTO_ITAU_COMPACTO_TEXT);
      expect(result.detectedInsurer).not.toBe('PORTO_SEGURO');
      expect(result.family).toBe('porto');
    });

    it('não retorna PORTO_SEGURO quando Itaú Assistência 24h aparece como produto', () => {
      const result = detectInsurerFromText(PORTO_ITAU_ASSISTENCIA_TEXT);
      expect(result.detectedInsurer).not.toBe('PORTO_SEGURO');
      expect(result.family).toBe('porto');
    });
  });

  describe('guard de produto', () => {
    it('retorna confiança média e notProcessable quando seguradora é detectada mas PDF é de saúde', () => {
      const result = detectInsurerFromText(BRADESCO_SAUDE_TEXT);
      expect(result.detectedInsurer).toBe('BRADESCO');
      expect(result.confidence).toBe('medium');
      expect(result.notProcessable).toBe(true);
      expect(result.reason).toMatch(/sa[uú]de/i);
      expect(result.detectedProduct).toBe('HEALTH');
    });

    it('bloqueia PDF de saúde mesmo com menção isolada de seguro auto (sinais saúde dominantes)', () => {
      const result = detectInsurerFromText(HEALTH_WITH_AUTO_NOISE_TEXT);
      expect(result.notProcessable).toBe(true);
      expect(result.detectedProduct).toBe('HEALTH');
      expect(result.reason).toMatch(/sa[uú]de/i);
    });
  });

  describe('detectedProduct e productConfidence', () => {
    it('retorna detectedProduct AUTO com productConfidence high quando múltiplos sinais de veículo presentes', () => {
      const result = detectInsurerFromText(AUTO_CLEAR_TEXT);
      expect(result.detectedProduct).toBe('AUTO');
      expect(result.productConfidence).toBe('high');
    });

    it('retorna detectedProduct HEALTH quando sinais de saúde presentes e sem sinais AUTO', () => {
      const result = detectInsurerFromText(HEALTH_ONLY_TEXT);
      expect(result.detectedProduct).toBe('HEALTH');
    });

    it('retorna detectedProduct AUTO para Porto Seguro válido', () => {
      const result = detectInsurerFromText(PORTO_TEXT);
      expect(result.detectedProduct).toBe('AUTO');
    });

    it('retorna detectedProduct null para texto sem sinais de produto', () => {
      const result = detectInsurerFromText('proposta de seguro para veículo');
      expect(result.detectedProduct).toBeNull();
    });
  });

  describe('casos de baixa confiança', () => {
    it('retorna null e confiança baixa quando apenas marca de grupo aparece como sinal fraco', () => {
      const result = detectInsurerFromText(WEAK_GROUP_ONLY_TEXT);
      expect(result.detectedInsurer).toBeNull();
      expect(result.confidence).toBe('low');
    });

    it('retorna null e confiança baixa para texto ambíguo com dois sinais fortes sem regra de família', () => {
      const result = detectInsurerFromText(AMBIGUOUS_TWO_STRONG_TEXT);
      expect(result.detectedInsurer).toBeNull();
      expect(result.confidence).toBe('low');
    });

    it('retorna null e confiança baixa para texto sem padrões conhecidos', () => {
      const result = detectInsurerFromText('proposta de seguro para veículo');
      expect(result.detectedInsurer).toBeNull();
      expect(result.confidence).toBe('low');
    });
  });

  describe('fixtures reais', () => {
    const fixturesDir = path.join(__dirname, 'fixtures');

    it('detecta PORTO_SEGURO com alta confiança a partir do fixture real (complete)', () => {
      const text = fs.readFileSync(path.join(fixturesDir, 'porto-seguro-auto-complete.txt'), 'utf-8');
      const result = detectInsurerFromText(text);
      expect(result.detectedInsurer).toBe('PORTO_SEGURO');
      expect(result.confidence).toBe('high');
    });

    it('detecta PORTO_SEGURO com alta confiança a partir do fixture real (incomplete)', () => {
      const text = fs.readFileSync(path.join(fixturesDir, 'porto-seguro-auto-incomplete.txt'), 'utf-8');
      const result = detectInsurerFromText(text);
      expect(result.detectedInsurer).toBe('PORTO_SEGURO');
      expect(result.confidence).toBe('high');
    });

    it('detecta MITSUI_SUMITOMO com alta confiança a partir do fixture real (complete)', () => {
      const text = fs.readFileSync(path.join(fixturesDir, 'mitsui-sumitomo-auto-complete.txt'), 'utf-8');
      const result = detectInsurerFromText(text);
      expect(result.detectedInsurer).toBe('MITSUI_SUMITOMO');
      expect(result.confidence).toBe('high');
      expect(result.family).toBe('porto');
    });

    it('não retorna PORTO_SEGURO para fixture Mitsui Sumitomo', () => {
      const text = fs.readFileSync(path.join(fixturesDir, 'mitsui-sumitomo-auto-complete.txt'), 'utf-8');
      const result = detectInsurerFromText(text);
      expect(result.detectedInsurer).not.toBe('PORTO_SEGURO');
    });

    it('detecta ITAU com alta confiança a partir do fixture real Itaú Tradicional', () => {
      const text = fs.readFileSync(path.join(fixturesDir, 'itau-tradicional-auto-complete.txt'), 'utf-8');
      const result = detectInsurerFromText(text);
      expect(result.detectedInsurer).toBe('ITAU');
      expect(result.confidence).toBe('high');
      expect(result.family).toBe('porto');
      expect(result.notProcessable).toBeUndefined();
    });

    it('não retorna PORTO_SEGURO para fixture Itaú Tradicional', () => {
      const text = fs.readFileSync(path.join(fixturesDir, 'itau-tradicional-auto-complete.txt'), 'utf-8');
      const result = detectInsurerFromText(text);
      expect(result.detectedInsurer).not.toBe('PORTO_SEGURO');
    });
  });

  describe('estrutura do resultado', () => {
    it('popula sinais com tipo, fonte e valor', () => {
      const result = detectInsurerFromText(BRADESCO_TEXT);
      expect(result.signals.length).toBeGreaterThan(0);
      const strongSignal = result.signals.find((s) => s.type === 'strong');
      expect(strongSignal).toBeDefined();
      expect(strongSignal).toHaveProperty('source');
      expect(strongSignal).toHaveProperty('value');
    });

    it('inclui BRADESCO em candidates quando detectado', () => {
      const result = detectInsurerFromText(BRADESCO_TEXT);
      expect(result.candidates).toContain('BRADESCO');
    });

    it('inclui múltiplos candidates quando há sinais de mais de uma seguradora', () => {
      const result = detectInsurerFromText(AMBIGUOUS_TWO_STRONG_TEXT);
      expect(result.candidates.length).toBeGreaterThan(1);
    });

    it('lista signals de família Porto quando regra é aplicada', () => {
      const result = detectInsurerFromText(PORTO_ITAU_TEXT);
      expect(result.signals.some((s) => s.insurer === 'ITAU' && s.type === 'strong')).toBe(true);
    });

    it('sinais de PORTO_SEGURO são downgraded para weak quando família Porto se aplica', () => {
      const result = detectInsurerFromText(PORTO_ITAU_TEXT);
      const portoSignals = result.signals.filter((s) => s.insurer === 'PORTO_SEGURO');
      expect(portoSignals.every((s) => s.type === 'weak')).toBe(true);
    });
  });
});
