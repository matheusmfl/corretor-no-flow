import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { z } from 'zod';
import type { HealthMemberLife, HealthQuoteDraft } from '@corretor/types';
import { AiService } from '../../../ai/ai.service';
import { parseHealthQuoteDraft } from '../../domain/schemas/health-quote-draft.schema';

// ─── AgeBandCount validation (P1) ────────────────────────────────────────────

const AgeBandCountSchema = z
  .object({
    bandLabel: z.string(),
    minAge: z.number(),
    maxAge: z.number(),
    count: z.number().int().min(0),
  })
  .refine((d) => d.maxAge >= d.minAge, {
    message: 'maxAge deve ser >= minAge',
    path: ['maxAge'],
  });

const AgeBandCountsSchema = z.array(AgeBandCountSchema);

export type AgeBandCount = z.infer<typeof AgeBandCountSchema>;

const OPEN_ENDED_MAX_AGE = 999;
const UNKNOWN_OPERATOR_LABEL = 'Operadora nÃ£o identificada';
const UNKNOWN_OPERATOR_WARNING =
  'Operadora nÃ£o identificada em uma opÃ§Ã£o; confirme antes de enviar ao cliente.';

// ─── Placeholder builder ──────────────────────────────────────────────────────

// Expande contagens por faixa em vidas placeholder revisáveis.
// age = ponto médio da faixa; source="inferred" porque o PDF só traz distribuição.
export function buildAgeBandPlaceholders(bands: AgeBandCount[]): HealthMemberLife[] {
  const lives: HealthMemberLife[] = [];
  let idx = 1;
  for (const band of bands) {
    for (let i = 0; i < band.count; i++) {
      lives.push({
        age: Math.round((band.minAge + band.maxAge) / 2),
        ageBand: band.bandLabel,
        label: `Vida ${idx} - ${band.bandLabel}`,
        source: 'inferred',
        needsReview: true,
      });
      idx++;
    }
  }
  return lives;
}

function normalizeOpenEndedBand(row: unknown): unknown {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
  const band = { ...(row as Record<string, unknown>) };
  if (band.maxAge === null) band.maxAge = OPEN_ENDED_MAX_AGE;
  return band;
}

function normalizeHealthAiResponse(raw: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...raw };

  if (Array.isArray(normalized.ageBandCounts)) {
    normalized.ageBandCounts = normalized.ageBandCounts.map(normalizeOpenEndedBand);
  }

  if (!Array.isArray(normalized.quoteOptions)) return normalized;

  const warnings = Array.isArray(normalized.warnings) ? [...normalized.warnings] : [];
  let addedUnknownOperatorWarning = false;

  normalized.quoteOptions = normalized.quoteOptions.map((option) => {
    if (!option || typeof option !== 'object' || Array.isArray(option)) return option;
    const next = { ...(option as Record<string, unknown>) };

    if (next.carrierOrOperator === null || next.carrierOrOperator === undefined || next.carrierOrOperator === '') {
      next.carrierOrOperator = UNKNOWN_OPERATOR_LABEL;
      addedUnknownOperatorWarning = true;
    }

    if (Array.isArray(next.ageBandPrices)) {
      next.ageBandPrices = next.ageBandPrices.map(normalizeOpenEndedBand);
    }

    return next;
  });

  if (addedUnknownOperatorWarning && !warnings.includes(UNKNOWN_OPERATOR_WARNING)) {
    warnings.push(UNKNOWN_OPERATOR_WARNING);
  }
  if (warnings.length > 0) normalized.warnings = warnings;

  return normalized;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export interface ExtractSourceMeta {
  sourceFiles?: string[];
}

@Injectable()
export class HealthQuoteDraftExtractorService {
  constructor(private readonly ai: AiService) {}

  async extract(rawText: string, sourceMeta?: ExtractSourceMeta): Promise<HealthQuoteDraft> {
    const raw = await this.ai.extractHealthQuoteDraft(rawText);

    // P2a: null ou primitivo da IA devem lançar UnprocessableEntityException, não TypeError.
    // Passando diretamente ao parser garantimos a mensagem padronizada.
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      return parseHealthQuoteDraft(raw);
    }

    // P1: validar ageBandCounts antes de expandir — entradas inválidas não podem
    // virar placeholders silenciosos (count negativo, decimal ou maxAge < minAge).
    const normalizedRaw = normalizeHealthAiResponse(raw);
    const countsResult = AgeBandCountsSchema.safeParse(normalizedRaw.ageBandCounts ?? []);
    if (!countsResult.success) {
      throw new UnprocessableEntityException(
        `ageBandCounts inválido: ${countsResult.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')}`,
      );
    }

    const placeholders = buildAgeBandPlaceholders(countsResult.data);

    const merged: Record<string, unknown> = { ...normalizedRaw };
    delete merged.ageBandCounts;

    // P2: lives não-array da IA não pode ser espalhado sem causar TypeError.
    // Se não for array, mantemos o valor inválido no merged e deixamos
    // o parseHealthQuoteDraft rejeitar com UnprocessableEntityException.
    if (raw.lives !== undefined && !Array.isArray(raw.lives)) {
      return parseHealthQuoteDraft(merged);
    }
    const existingLives = (raw.lives as unknown[]) ?? [];
    merged.lives = [...existingLives, ...placeholders];

    // P3: sourceFiles do chamador sobrescreve o que a IA devolveu sempre que
    // o parâmetro for fornecido — inclusive array vazio (origem vem do upload).
    if (sourceMeta?.sourceFiles !== undefined) {
      merged.sourceFiles = sourceMeta.sourceFiles;
    }

    return parseHealthQuoteDraft(merged);
  }
}
