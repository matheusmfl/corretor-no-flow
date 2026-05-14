import { UnprocessableEntityException } from '@nestjs/common';
import { z } from 'zod';
import type {
  HealthAgeBandPrice,
  HealthManualTableSource,
  HealthMemberLife,
  HealthQuoteDraft,
} from '@corretor/types';

// ─── DraftField ───────────────────────────────────────────────────────────────

const DraftFieldSourceSchema = z.enum([
  'extracted',
  'inferred',
  'manual',
  'table_lookup',
  'ocr',
  'vision_inferred',
  'not_found',
]);

/** Zod 4 refine callbacks infer a mapped type that omits `value`; keep runtime checks typed explicitly. */
type DraftFieldRefineRow = {
  value: unknown;
  source: string;
  confidence: number;
  needsReview: boolean;
};

function draftFieldSchema<T extends z.ZodTypeAny>(valueSchema: T) {
  return z
    .object({
      value: valueSchema.nullable(),
      source: DraftFieldSourceSchema,
      confidence: z.number().min(0).max(1),
      evidence: z.string().optional(),
      needsReview: z.boolean(),
    })
    .superRefine((data, ctx) => {
      const row = data as DraftFieldRefineRow;
      if (row.source === 'not_found') {
        if (row.value !== null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'not_found requer value: null',
            path: ['value'],
          });
        }
        if (!row.needsReview) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'not_found requer needsReview: true',
            path: ['needsReview'],
          });
        }
      }
    });
}

// ─── HealthMemberLife ─────────────────────────────────────────────────────────

const HealthMemberLifeSchema = z
  .object({
    age: z.number(),
    name: z.string().optional(),
    label: z.string().optional(),
    relationship: z.string().optional(),
    ageBand: z.string().optional(),
    source: DraftFieldSourceSchema,
    needsReview: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (isSensitiveSource(data.source) && !data.needsReview) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `vida com source "${data.source}" requer needsReview: true`,
        path: ['needsReview'],
      });
    }
  }) satisfies z.ZodType<HealthMemberLife>;

// ─── HealthAgeBandPrice ───────────────────────────────────────────────────────

const HealthAgeBandPriceSchema = z.object({
  bandLabel: z.string(),
  minAge: z.number(),
  maxAge: z.number(),
  pricePerLife: z.number(),
}) satisfies z.ZodType<HealthAgeBandPrice>;

// ─── HealthQuoteOption ────────────────────────────────────────────────────────

const SENSITIVE_SOURCES = ['inferred', 'ocr', 'vision_inferred'] as const;
type SensitiveSource = (typeof SENSITIVE_SOURCES)[number];

function isSensitiveSource(source: string): source is SensitiveSource {
  return (SENSITIVE_SOURCES as readonly string[]).includes(source);
}

const StringDraftFieldSchema = draftFieldSchema(z.string());

const HealthQuoteOptionSchema = z
  .object({
    sourceType: z.enum(['portal_pdf', 'manual_table', 'spreadsheet_import']),
    carrierOrOperator: z.string(),
    administratorOrChannel: z.string().optional(),
    planName: z.string(),
    productCode: z.string().optional(),
    accommodation: StringDraftFieldSchema,
    coparticipation: StringDraftFieldSchema,
    reimbursementMode: StringDraftFieldSchema,
    region: z.string().optional(),
    validUntil: StringDraftFieldSchema,
    ageBandPrices: z.array(HealthAgeBandPriceSchema).optional(),
    perLifePrices: z
      .array(z.object({ lifeIndex: z.number(), price: z.number(), bandLabel: z.string().optional() }))
      .optional(),
    monthlyTotal: z.number().optional(),
    firstInstallmentTotal: z.number().optional(),
    dental: StringDraftFieldSchema,
    notes: z.string().optional(),
    warnings: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    const sensitiveFields = [
      'accommodation',
      'coparticipation',
      'reimbursementMode',
      'validUntil',
      'dental',
    ] as const;

    for (const field of sensitiveFields) {
      const f = data[field];
      if (isSensitiveSource(f.source) && !f.needsReview) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `campo sensível "${field}" com source "${f.source}" requer needsReview: true`,
          path: [field, 'needsReview'],
        });
      }
    }
  });

// ─── HealthManualTableSource ──────────────────────────────────────────────────

const HealthManualTableSourceSchema = z.object({
  sourceName: z.string(),
  planName: z.string(),
  accommodation: z.string().optional(),
  coparticipation: z.string().optional(),
  region: z.string().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  ageBandPrices: z.array(HealthAgeBandPriceSchema),
  sourceFile: z.string().optional(),
  reviewedByBroker: z.boolean(),
}) satisfies z.ZodType<HealthManualTableSource>;

// ─── HealthQuoteDraft ─────────────────────────────────────────────────────────

const HealthQuoteDraftSchema = z.object({
  clientName: z.string().optional(),
  companyDocument: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  sourceFiles: z.array(z.string()).optional(),
  lives: z.array(HealthMemberLifeSchema),
  quoteOptions: z.array(HealthQuoteOptionSchema),
  tables: z.array(HealthManualTableSourceSchema).optional(),
  warnings: z.array(z.string()).optional(),
  reviewStatus: z.enum(['pending', 'in_review', 'confirmed']),
});

// ─── Null normalisation ───────────────────────────────────────────────────────

// Converte null → undefined recursivamente, mas preserva DraftField.value = null.
// Um DraftField é reconhecido pela presença de `source` (string) e `value` (qualquer).
// Isso permite que campos opcionais vindos da IA como `null` sejam aceitos sem
// quebrar a semântica de `not_found` onde value: null é intencional.
const DRAFT_FIELD_SOURCES = new Set([
  'extracted',
  'inferred',
  'manual',
  'table_lookup',
  'ocr',
  'vision_inferred',
  'not_found',
]);

function isDraftFieldLike(obj: Record<string, unknown>): boolean {
  return typeof obj['source'] === 'string' && DRAFT_FIELD_SOURCES.has(obj['source']) && 'value' in obj;
}

function stripNullsExceptDraftFieldValue(value: unknown): unknown {
  if (value === null) return undefined;
  if (Array.isArray(value)) return value.map(stripNullsExceptDraftFieldValue);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (isDraftFieldLike(obj)) {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [
          k,
          k === 'value' ? v : stripNullsExceptDraftFieldValue(v),
        ]),
      );
    }
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, stripNullsExceptDraftFieldValue(v)]),
    );
  }
  return value;
}

// ─── Parser ───────────────────────────────────────────────────────────────────

export function parseHealthQuoteDraft(raw: unknown): HealthQuoteDraft {
  const result = HealthQuoteDraftSchema.safeParse(stripNullsExceptDraftFieldValue(raw));
  if (!result.success) {
    throw new UnprocessableEntityException(
      `Rascunho de cotação Saúde inválido: ${result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')}`,
    );
  }
  // Zod 4 output types mark DraftField.value optional vs @corretor/types; runtime shape matches HealthQuoteDraft.
  return result.data as HealthQuoteDraft;
}
