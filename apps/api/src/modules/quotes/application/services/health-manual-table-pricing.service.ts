import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import type { HealthAgeBandPrice, HealthManualTableSource, HealthMemberLife, HealthQuoteOption } from '@corretor/types';

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function parseAgeBandLabel(label: string): { minAge: number; maxAge: number } {
  const s = label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

  // "59+" | "59 ou mais" | "59 ou+"
  // maxAge usa teto finito 999 em vez de Infinity — JSON.stringify(Infinity) === "null",
  // o que quebraria o contrato numérico ao serializar HealthAgeBandPrice.
  const openEnded = s.match(/^(\d+)\s*(?:\+|ou\s*(?:mais|\+))$/);
  if (openEnded) return { minAge: parseInt(openEnded[1], 10), maxAge: 999 };

  // "ate 18" | "ate18"
  const ate = s.match(/^ate\s*(\d+)$/);
  if (ate) return { minAge: 0, maxAge: parseInt(ate[1], 10) };

  // "19 a 23" | "19-23"
  const range = s.match(/^(\d+)\s*(?:a|-)\s*(\d+)$/);
  if (range) return { minAge: parseInt(range[1], 10), maxAge: parseInt(range[2], 10) };

  throw new Error(`Rótulo de faixa etária não reconhecido: "${label}"`);
}

export function findAgeBandPrice(age: number, bands: HealthAgeBandPrice[]): HealthAgeBandPrice | null {
  return bands.find((b) => b.minAge <= age && age <= b.maxAge) ?? null;
}

// ─── DraftField builders ──────────────────────────────────────────────────────

function tableLookup(value: string) {
  return { value, source: 'table_lookup' as const, confidence: 1, needsReview: false };
}

const NOT_FOUND = { value: null, source: 'not_found' as const, confidence: 0, needsReview: true };

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class HealthManualTablePricingService {
  applyTable(table: HealthManualTableSource, lives: HealthMemberLife[]): HealthQuoteOption {
    const warnings: string[] = [];

    const perLifePrices = lives.map((life, lifeIndex) => {
      const band = findAgeBandPrice(life.age, table.ageBandPrices);
      if (!band) {
        throw new UnprocessableEntityException(
          `Tabela "${table.planName}" não cobre a idade ${life.age} — adicione a faixa correspondente`,
        );
      }
      return { lifeIndex, price: band.pricePerLife, bandLabel: band.bandLabel };
    });

    const monthlyTotal = parseFloat(
      perLifePrices.reduce((sum, p) => sum + p.price, 0).toFixed(2),
    );

    const validUntilField = table.validUntil
      ? tableLookup(table.validUntil)
      : (() => {
          warnings.push('Tabela sem validade definida — confirmar antes de enviar ao cliente');
          return NOT_FOUND;
        })();

    return {
      sourceType: 'manual_table',
      carrierOrOperator: table.sourceName,
      planName: table.planName,
      ...(table.region !== undefined ? { region: table.region } : {}),
      accommodation: table.accommodation ? tableLookup(table.accommodation) : NOT_FOUND,
      coparticipation: table.coparticipation ? tableLookup(table.coparticipation) : NOT_FOUND,
      reimbursementMode: NOT_FOUND,
      validUntil: validUntilField,
      dental: NOT_FOUND,
      ageBandPrices: table.ageBandPrices,
      perLifePrices,
      monthlyTotal,
      ...(warnings.length ? { warnings } : {}),
    };
  }
}
