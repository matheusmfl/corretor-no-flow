import { Insurer } from '@prisma/client';
import type { InsurerDetectionResult, InsurerDetectionSignal } from '@corretor/types';

type SignalType = 'strong' | 'medium' | 'weak';

interface PatternDef {
  insurer: string;
  source: string;
  pattern: RegExp;
}

// ── Strong patterns: razão social, CNPJ, cabeçalho dominante ─────────────────
const STRONG_PATTERNS: PatternDef[] = [
  { insurer: 'BRADESCO',     source: 'razao_social', pattern: /bradesco\s+seguros\s+s\.?\s*\/?\s*a\.?/i },
  { insurer: 'BRADESCO',     source: 'cnpj',         pattern: /92\.693\.973\/0001-33/ },
  { insurer: 'BRADESCO',     source: 'produto',      pattern: /bradesco\s+auto(?:\s*[\/e]\s*re)?/i },
  { insurer: 'PORTO_SEGURO', source: 'razao_social', pattern: /porto\s+seguro\s+companhia/i },
  { insurer: 'PORTO_SEGURO', source: 'razao_social', pattern: /porto\s+seguro\s+cia\./i },
  { insurer: 'PORTO_SEGURO', source: 'razao_social', pattern: /porto\s+seguro\s+seguros\s+gerais/i },
  // CNPJ real nos PDFs: 61.198.164.0001/60 (ponto antes de 0001, não barra)
  { insurer: 'PORTO_SEGURO', source: 'cnpj',         pattern: /61\.198\.164[./]0001[-/]60/ },
  { insurer: 'PORTO_SEGURO', source: 'dominio',      pattern: /portoseguro\.com\.br/i },
  { insurer: 'TOKIO_MARINE', source: 'razao_social', pattern: /tokio\s+marine/i },
  { insurer: 'SULAMERICA',   source: 'razao_social', pattern: /sul\s*am[eé]rica\s+seguros/i },
  { insurer: 'ALIRO',        source: 'razao_social', pattern: /aliro\s+seguros/i },
  { insurer: 'ALIRO',        source: 'cabecalho',    pattern: /^aliro\b/im },
  { insurer: 'ALLIANZ',      source: 'razao_social', pattern: /allianz\s+seguros/i },
  { insurer: 'SUHAI',        source: 'razao_social', pattern: /suhai\s+seguradora/i },
  { insurer: 'YELLOW',       source: 'razao_social', pattern: /yellow\s+seguros/i },
  // ITAU: não está no enum Prisma mas é emissor real em PDFs da família Porto
  { insurer: 'ITAU',         source: 'razao_social', pattern: /ita[uú]\s+seguros\s+s\.?\s*\/?\s*a\.?/i },
  { insurer: 'ITAU',         source: 'produto',      pattern: /cota[cç][aã]o\s+ita[uú]/i },
  { insurer: 'ITAU',         source: 'produto',      pattern: /ita[uú]\s+auto/i },
  // MITSUI: não está no enum Prisma mas circula em PDFs da plataforma Porto
  { insurer: 'MITSUI',       source: 'razao_social', pattern: /mitsui\s+sumitomo/i },
  { insurer: 'MITSUI',       source: 'razao_social', pattern: /mitsui\s+seguros/i },
];

// ── Medium patterns: marca/produto em contexto plausível ─────────────────────
const MEDIUM_PATTERNS: PatternDef[] = [
  { insurer: 'BRADESCO',     source: 'marca', pattern: /seguros?\s+bradesco/i },
  { insurer: 'PORTO_SEGURO', source: 'marca', pattern: /porto\s+seguro/i },
  { insurer: 'ALLIANZ',      source: 'marca', pattern: /allianz/i },
  { insurer: 'ALIRO',        source: 'marca', pattern: /\baliro\b/i },
  // Família Porto: menção mais fraca que razão social formal mas suficiente para
  // suprimir detecção de Porto quando o emissor real é da família
  { insurer: 'ITAU',         source: 'marca', pattern: /ita[uú]\s+seguros/i },
  { insurer: 'MITSUI',       source: 'marca', pattern: /\bmitsui\b/i },
];

// ── Regras de família: seguradora específica suprime menção de grupo ──────────
// Aplica quando o emissor real (specificInsurer) aparece mesmo sem sinais fortes,
// evitando que o PDF seja classificado como a seguradora-mãe (groupInsurer).
const FAMILY_RULES: Array<{ family: string; specificInsurer: string; groupInsurer: string }> = [
  { family: 'porto',   specificInsurer: 'ITAU',   groupInsurer: 'PORTO_SEGURO' },
  { family: 'porto',   specificInsurer: 'MITSUI',  groupInsurer: 'PORTO_SEGURO' },
  { family: 'allianz', specificInsurer: 'ALIRO',   groupInsurer: 'ALLIANZ' },
];

// ── Produto AUTO: keywords que confirmam que o PDF é de automóvel ────────────
const AUTO_PRODUCT_PATTERNS: RegExp[] = [
  /seguro\s+autom[oó]vel/i,
  /seguro\s+auto\b/i,
  /cota[cç][aã]o\s+auto/i,
  /ve[ií]culo\s+segurado/i,
  /franquia\s+do\s+ve[ií]culo/i,
  /danos?\s+ao\s+ve[ií]culo/i,
  /cobertura\s+casco/i,
];

// ── Produto SAÚDE: keywords que indicam ramo saúde, não AUTO ─────────────────
const HEALTH_PRODUCT_PATTERNS: RegExp[] = [
  /plano\s+de\s+sa[uú]de/i,
  /seguro\s+sa[uú]de/i,
  /cobertura\s+hospitalar/i,
  /internac[aã]o\s+hospitalar/i,
  /consultas?\s+m[eé]dicas?/i,
  /reembolso\s+m[eé]dico/i,
  /rede\s+credenciada/i,
];

const PRISMA_INSURERS = new Set<string>(Object.values(Insurer));

function collectSignals(text: string, patterns: PatternDef[], type: SignalType): InsurerDetectionSignal[] {
  const found: InsurerDetectionSignal[] = [];
  for (const def of patterns) {
    const m = text.match(def.pattern);
    if (m) {
      found.push({ insurer: def.insurer, type, source: def.source, value: m[0] });
    }
  }
  return found;
}

export function detectInsurerFromText(text: string): InsurerDetectionResult {
  const hasHealthSignals = HEALTH_PRODUCT_PATTERNS.some((p) => p.test(text));
  const hasAutoSignals   = AUTO_PRODUCT_PATTERNS.some((p) => p.test(text));

  const rawSignals: InsurerDetectionSignal[] = [
    ...collectSignals(text, STRONG_PATTERNS, 'strong'),
    ...collectSignals(text, MEDIUM_PATTERNS, 'medium'),
  ];

  // Apply family rules: when specificInsurer has a strong signal,
  // downgrade all groupInsurer signals to weak (they are group/template references)
  const downgradedInsurers = new Set<string>();
  const appliedFamilies: string[] = [];

  for (const rule of FAMILY_RULES) {
    // Trigger on medium OR strong: even a brand mention (medium) is sufficient
    // to prevent the group insurer from being returned with high confidence.
    const specificHasSignal = rawSignals.some(
      (s) => s.insurer === rule.specificInsurer && (s.type === 'strong' || s.type === 'medium'),
    );
    if (specificHasSignal) {
      downgradedInsurers.add(rule.groupInsurer);
      appliedFamilies.push(rule.family);
    }
  }

  const signals: InsurerDetectionSignal[] = rawSignals.map((s) =>
    downgradedInsurers.has(s.insurer) ? { ...s, type: 'weak' as SignalType } : s,
  );

  // Build sets of insurers with strong / medium effective signals
  const strongInsurerSet = new Set(
    signals.filter((s) => s.type === 'strong').map((s) => s.insurer),
  );
  const mediumInsurerSet = new Set(
    signals.filter((s) => s.type === 'medium').map((s) => s.insurer),
  );

  // candidates = Prisma enum values that appear in strong or medium signals
  const allDetected = new Set([...strongInsurerSet, ...mediumInsurerSet]);
  const candidates = [...allDetected]
    .filter((i) => PRISMA_INSURERS.has(i)) as Insurer[];

  // family is shared across all branches: present whenever a family rule fired
  const family = appliedFamilies[0] as string | undefined;
  const familyProp = family ? { family } : {};

  // ── Decision tree ──────────────────────────────────────────────────────────

  if (strongInsurerSet.size === 0 && mediumInsurerSet.size === 0) {
    return {
      detectedInsurer: null,
      confidence: 'low',
      ...familyProp,
      candidates,
      signals,
      reason: 'Nenhum padrão de seguradora reconhecido',
    };
  }

  if (strongInsurerSet.size > 1) {
    const names = [...strongInsurerSet].join(', ');
    return {
      detectedInsurer: null,
      confidence: 'low',
      ...familyProp,
      candidates,
      signals,
      reason: `Texto ambíguo: sinais fortes para ${names}`,
    };
  }

  if (strongInsurerSet.size === 1) {
    const winner = [...strongInsurerSet][0];

    if (!PRISMA_INSURERS.has(winner)) {
      const label = winner === 'ITAU' ? 'Itaú Seguros' : winner === 'MITSUI' ? 'Mitsui Seguros' : winner;
      return {
        detectedInsurer: null,
        confidence: 'medium',
        notProcessable: true,
        ...familyProp,
        candidates,
        signals,
        reason: `${label} detectado como emissor mas não registrado como seguradora processável`,
      };
    }

    // Guard: health signals with no auto signals indicate wrong product line
    if (hasHealthSignals && !hasAutoSignals) {
      return {
        detectedInsurer: winner as Insurer,
        confidence: 'medium',
        notProcessable: true,
        ...familyProp,
        candidates,
        signals,
        reason: 'PDF parece ser do ramo saúde — confirme que é um seguro automóvel antes de processar',
      };
    }

    return {
      detectedInsurer: winner as Insurer,
      confidence: 'high',
      ...familyProp,
      candidates,
      signals,
    };
  }

  // Only medium signals
  if (mediumInsurerSet.size === 1) {
    const winner = [...mediumInsurerSet][0];
    if (PRISMA_INSURERS.has(winner)) {
      return {
        detectedInsurer: winner as Insurer,
        confidence: 'medium',
        ...familyProp,
        candidates,
        signals,
      };
    }
  }

  return {
    detectedInsurer: null,
    confidence: 'low',
    ...familyProp,
    candidates,
    signals,
    reason: 'Sinais insuficientes ou ambíguos para decidir seguradora',
  };
}
