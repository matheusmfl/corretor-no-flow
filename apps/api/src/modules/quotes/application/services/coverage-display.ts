import type { AutoQuoteData, CoverageStatus, RichCoverage } from '@corretor/types';

// Products with no vehicle casco — vehicle/rcf/app are not_applicable for these.
// Add new segment strings here as new no-casco products are confirmed from real PDFs.
const NO_CASCO_SEGMENTS = new Set([
  'ASSISTÊNCIA EXCLUSIVA', // Tokio Marine Assistência Exclusiva
]);

function boolStatus(value: boolean | undefined, isNA: boolean): CoverageStatus {
  if (isNA) return 'not_applicable';
  if (value === true) return 'contracted';
  if (value === false) return 'not_contracted';
  return 'not_found';
}

function objStatus(obj: object | null | undefined, isNA: boolean): CoverageStatus {
  if (isNA) return 'not_applicable';
  return obj != null ? 'contracted' : 'not_found';
}

/**
 * Derives a RichCoverage display object from the extracted AutoQuoteData.
 *
 * This is a pure, side-effect-free function — safe to call at render time
 * (PDF generation, public link, review screen) without re-extraction.
 *
 * The four-state semantic (contracted / not_contracted / not_applicable / not_found)
 * lets the UI render coverage differences clearly instead of showing blank or "Incluso".
 */
export function buildCoverageDisplay(data: AutoQuoteData): RichCoverage {
  const { coverage, segment } = data;
  const noCasco = NO_CASCO_SEGMENTS.has((segment ?? '').toUpperCase());
  const a = coverage.assistance ?? {};

  return {
    vehicle: {
      status: objStatus(coverage.vehicle, noCasco),
      fipePercentage: coverage.vehicle?.fipePercentage,
      deductible: coverage.vehicle?.deductible,
      deductibleType: coverage.vehicle?.deductibleType,
    },
    rcf: {
      status: objStatus(coverage.rcf, noCasco),
      propertyDamage: coverage.rcf?.propertyDamage,
      bodilyInjury: coverage.rcf?.bodilyInjury,
      moralDamages: coverage.rcf?.moralDamages,
    },
    app: {
      status: objStatus(coverage.app, noCasco),
      death: coverage.app?.death,
      disability: coverage.app?.disability,
      passengerCount: coverage.app?.passengerCount,
    },
    towing: {
      status: boolStatus(a.towing, false),
    },
    glass: {
      status: boolStatus(a.glassProtection, false),
    },
    replacementVehicle: {
      status: boolStatus(a.replacementVehicle, false),
      days: a.replacementDays,
    },
    fastRepair: { status: 'not_found' },
  };
}
