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
  });

  describe('regras de família', () => {
    it('não retorna PORTO_SEGURO quando Itaú tem sinal forte (família Porto)', () => {
      const result = detectInsurerFromText(PORTO_ITAU_TEXT);
      expect(result.detectedInsurer).not.toBe('PORTO_SEGURO');
      expect(result.family).toBe('porto');
      expect(result.reason).toMatch(/[Ii]ta[uú]/);
      expect(result.notProcessable).toBe(true);
    });

    it('não retorna PORTO_SEGURO quando Itaú tem sinal médio (sem S/A)', () => {
      const result = detectInsurerFromText(PORTO_ITAU_MEDIUM_TEXT);
      expect(result.detectedInsurer).not.toBe('PORTO_SEGURO');
      expect(result.family).toBe('porto');
    });

    it('não retorna PORTO_SEGURO quando Mitsui tem sinal forte (família Porto)', () => {
      const result = detectInsurerFromText(PORTO_MITSUI_TEXT);
      expect(result.detectedInsurer).not.toBe('PORTO_SEGURO');
      expect(result.family).toBe('porto');
      expect(result.reason).toMatch(/[Mm]itsui/);
      expect(result.notProcessable).toBe(true);
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

  describe('guard de produto', () => {
    it('retorna confiança média e notProcessable quando seguradora é detectada mas PDF é de saúde', () => {
      const result = detectInsurerFromText(BRADESCO_SAUDE_TEXT);
      expect(result.detectedInsurer).toBe('BRADESCO');
      expect(result.confidence).toBe('medium');
      expect(result.notProcessable).toBe(true);
      expect(result.reason).toMatch(/sa[uú]de/i);
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
