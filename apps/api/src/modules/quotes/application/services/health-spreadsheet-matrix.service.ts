import { Injectable } from '@nestjs/common';
import type { HealthQuoteDraft, HealthQuoteOption } from '@corretor/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SpreadsheetRow {
  label: string;
  age: number | null;
  relationship: string | null;
  planValues: Array<number | null>;
  isTotal: boolean;
}

export interface SpreadsheetPlanColumn {
  planName: string;
  carrierOrOperator: string;
}

export interface SpreadsheetNote {
  key: string;
  value: string;
  needsReview: boolean;
}

export interface SpreadsheetMatrix {
  headers: string[];
  planColumns: SpreadsheetPlanColumn[];
  rows: SpreadsheetRow[];
  notes: SpreadsheetNote[];
}

// ─── Pure builder ────────────────────────────────────────────────────────────

export function buildHealthSpreadsheetMatrix(draft: HealthQuoteDraft): SpreadsheetMatrix {
  const options = draft.quoteOptions;

  const planColumns: SpreadsheetPlanColumn[] = options.map((o) => ({
    planName: o.planName,
    carrierOrOperator: o.carrierOrOperator,
  }));

  const headers = [
    'Nome / Beneficiário',
    'Idade',
    'Parentesco',
    ...options.map((o) => o.planName),
  ];

  // ─── Life rows
  const lifeRows: SpreadsheetRow[] = draft.lives.map((life, lifeIndex) => {
    const label = life.name ?? life.label ?? life.relationship ?? `Beneficiário ${lifeIndex + 1}`;
    const planValues = options.map((opt) => {
      const entry = opt.perLifePrices?.find((p) => p.lifeIndex === lifeIndex);
      return entry?.price ?? null;
    });
    return {
      label,
      age: life.age,
      relationship: life.relationship ?? null,
      planValues,
      isTotal: false,
    };
  });

  // ─── Total row
  const totalValues = options.map((opt) => {
    if (opt.monthlyTotal !== undefined && opt.monthlyTotal !== null) {
      return opt.monthlyTotal;
    }
    return parseFloat(
      (opt.perLifePrices ?? []).reduce((sum, p) => sum + p.price, 0).toFixed(2),
    );
  });

  const totalRow: SpreadsheetRow = {
    label: 'Total',
    age: null,
    relationship: null,
    planValues: totalValues,
    isTotal: true,
  };

  const rows = [...lifeRows, totalRow];

  // ─── Notes
  const notes: SpreadsheetNote[] = [];

  options.forEach((opt) => {
    notes.push({
      key: `Fonte — ${opt.planName}`,
      value: `${opt.carrierOrOperator} / ${opt.planName}`,
      needsReview: false,
    });

    if (opt.validUntil.value) {
      notes.push({
        key: `Validade — ${opt.planName}`,
        value: opt.validUntil.value,
        needsReview: opt.validUntil.needsReview,
      });
    } else {
      notes.push({
        key: `validUntil — ${opt.planName}`,
        value: 'Validade não informada',
        needsReview: true,
      });
    }

    const sensitiveFields = ['accommodation', 'coparticipation', 'reimbursementMode', 'dental'] as const;
    for (const field of sensitiveFields) {
      const f = opt[field];
      if (f.needsReview) {
        notes.push({
          key: `${field} — ${opt.planName}`,
          value: f.value ?? `${field} não informado`,
          needsReview: true,
        });
      }
    }

    if (opt.warnings?.length) {
      opt.warnings.forEach((w) =>
        notes.push({ key: `Aviso — ${opt.planName}`, value: w, needsReview: true }),
      );
    }
  });

  if (draft.warnings?.length) {
    draft.warnings.forEach((w) =>
      notes.push({ key: 'Aviso geral', value: w, needsReview: true }),
    );
  }

  return { headers, planColumns, rows, notes };
}

// ─── Injectable wrapper ───────────────────────────────────────────────────────

@Injectable()
export class HealthSpreadsheetMatrixService {
  build(draft: HealthQuoteDraft): SpreadsheetMatrix {
    return buildHealthSpreadsheetMatrix(draft);
  }
}
