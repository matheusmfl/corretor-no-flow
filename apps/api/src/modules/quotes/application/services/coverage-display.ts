import type { AutoQuoteData, CoverageStatus, RichCoverage } from '@corretor/types';

// Products with no vehicle casco — vehicle/rcf/app are not_applicable for these.
// Add new segment strings here as new no-casco products are confirmed from real PDFs.
const NO_CASCO_SEGMENTS = new Set([
  'ASSISTÊNCIA EXCLUSIVA', // Tokio Marine Assistência Exclusiva
]);

// ── Static tooltip catalog ─────────────────────────────────────────────────────
// Text comes from insurer knowledge (portal/guide), NOT from the extracted PDF.
// Never fail extraction if the PDF does not contain these texts.

const TOKIO_ASSISTANCE_TOOLTIP: Record<string, string> = {
  'Completa': '200 km de reboque com possibilidade de ampliação, mecânico, transporte para retorno ao domicílio, hospedagem, chaveiro, entre outros.',
  'VIP': 'Cobertura Completa + 2 utilizações para pane, 2 dias de carro reserva para pane, higienização do veículo, serviço de leva e traz do carro reserva, reparos residenciais, entre outros.',
};

// Non-km services complement — used when km breakdown is displayed separately in PDF footnotes
// so the catalog km mention doesn't contradict the extracted total km.
const TOKIO_ASSISTANCE_SERVICES: Record<string, string> = {
  'Completa': 'mecânico, transporte para retorno ao domicílio, hospedagem, chaveiro, entre outros',
  'VIP': '2 utilizações para pane, 2 dias de carro reserva para pane, higienização do veículo, serviço de leva e traz do carro reserva, reparos residenciais, entre outros',
};

const TOKIO_GLASS_TOOLTIP: Record<string, string> = {
  'Básico': 'Reparo do para-brisa quando possível ou reposição dos vidros laterais, para-brisa e traseiro.',
  'Completo': 'Garantias do plano Básico + faróis, lanternas, retrovisores, máquina dos vidros, teto solar e panorâmico.',
};

// ── Bradesco static catalog ────────────────────────────────────────────────────
// Keyed by clause code (digits inside parens in the PDF, e.g. "043").
// Update this record when Bradesco adds or changes assistance options.
// The km value here is a fallback for display; prefer towingKmTotal extracted from the PDF.
const BRADESCO_ASSISTANCE_CATALOG: Record<string, { tooltip: string }> = {
  '043': { tooltip: 'Assist Dia/Noite 200 km — guincho, pane seca, chaveiro, troca de pneu.' },
  '063': { tooltip: 'Assist Dia/Noite 100 km — guincho, pane seca, chaveiro, troca de pneu.' },
  '108': { tooltip: 'Assist Dia/Noite ilimitado — guincho, pane seca, chaveiro, troca de pneu.' },
  '113': { tooltip: 'Assist Auto Dia/Noite Passeio 400 km — guincho, pane seca, chaveiro, troca de pneu.' },
};

// Keyed by tier label as extracted from the PDF (e.g. "Vidro Protegido Plus Logomarca").
// Add entries as new tier variants are confirmed from real PDFs.
const BRADESCO_GLASS_CATALOG: Record<string, string> = {
  'Reparo de Para-Brisa': 'Reparo do para-brisa quando possível.',
  'Vidro Protegido': 'Para-brisa e vidros laterais.',
  'Vidro Protegido Plus': 'Todos os vidros (para-brisa, laterais, traseiro) + faróis, lanternas e teto solar.',
  'Vidro Protegido Plus Logomarca': 'Todos os vidros (para-brisa, laterais, traseiro) + faróis, lanternas e teto solar, com aplicação de logomarca nos vidros.',
  'Vidro Protegido Premium': 'Proteção premium de vidros.',
  'Vidro Protegido Premium Logomarca': 'Proteção premium de vidros com aplicação de logomarca.',
};

// Extracts the numeric clause code from a planName string, e.g. "(043) Assist..." → "043".
function extractBradescoClauseCode(planName: string | undefined): string | undefined {
  if (!planName) return undefined;
  const match = planName.match(/\((\d+)\)/);
  return match ? match[1] : undefined;
}

function towingTooltip(insurer: string, planName: string | undefined): string | undefined {
  if (insurer === 'TOKIO_MARINE' && planName) return TOKIO_ASSISTANCE_TOOLTIP[planName];
  if (insurer === 'BRADESCO') {
    const code = extractBradescoClauseCode(planName);
    return code ? BRADESCO_ASSISTANCE_CATALOG[code]?.tooltip : undefined;
  }
  return undefined;
}

function buildTowingFootnote(
  insurer: string,
  planName: string | undefined,
  kmBase: number | undefined,
  kmAdditional: number | undefined,
  kmTotal: number | undefined,
): string | undefined {
  if (insurer !== 'TOKIO_MARINE' || !planName) return undefined;
  const catalogText = TOKIO_ASSISTANCE_TOOLTIP[planName];
  if (!catalogText) return undefined;

  if (kmBase != null && kmAdditional != null && kmTotal != null) {
    const services = TOKIO_ASSISTANCE_SERVICES[planName];
    const servicesText = services ? ` Também contempla ${services}, conforme guia de serviços Tokio.` : '';
    return `Plano ${planName}: inclui ${kmBase} km padrão de reboque. Esta cotação possui ${kmAdditional} km adicional, totalizando ${kmTotal} km.${servicesText}`;
  }

  return `Plano ${planName}: ${catalogText}`;
}

function glassTooltip(insurer: string, tier: string | undefined): string | undefined {
  if (insurer === 'TOKIO_MARINE' && tier) return TOKIO_GLASS_TOOLTIP[tier];
  if (insurer === 'BRADESCO' && tier) return BRADESCO_GLASS_CATALOG[tier];
  return undefined;
}

// true = contratado, false = não contratado, undefined/null = não encontrado no PDF.
function triState(value: boolean | undefined | null): CoverageStatus {
  if (value === true) return 'contracted';
  if (value === false) return 'not_contracted';
  return 'not_found';
}

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
  const { coverage, segment, insurer, coverageDetails } = data;
  const noCasco = NO_CASCO_SEGMENTS.has((segment ?? '').toUpperCase());
  const a = coverage.assistance ?? {};
  const cdAssist = coverageDetails?.assistance ?? {};
  const cdGlass = coverageDetails?.glass ?? {};
  const cdReplVeh = coverageDetails?.replacementVehicle ?? {};
  const cdServices = coverageDetails?.services ?? {};
  const cdRepair = coverageDetails?.repair ?? {};

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
      kmTotal: cdAssist.towingKmTotal,
      kmBase: cdAssist.towingKmBase,
      kmAdditional: cdAssist.towingKmAdditional,
      planName: cdAssist.planName,
      tooltip: towingTooltip(insurer, cdAssist.planName),
      footnote: buildTowingFootnote(
        insurer,
        cdAssist.planName,
        cdAssist.towingKmBase,
        cdAssist.towingKmAdditional,
        cdAssist.towingKmTotal,
      ),
    },
    glass: {
      status: boolStatus(a.glassProtection, false),
      tier: cdGlass.tier,
      tooltip: glassTooltip(insurer, cdGlass.tier),
    },
    replacementVehicle: {
      status: boolStatus(a.replacementVehicle, false),
      days: a.replacementDays,
      category: cdReplVeh.category,
    },
    martelinho: { status: triState(cdServices.martelinho) },
    latariaEPintura: { status: triState(cdServices.latariaEPintura) },
    repareFacil: { status: triState(cdServices.repareFacil) },
    trocaParaChoque: { status: triState(cdServices.trocaParaChoque) },
    rodaPneuSuspensao: { status: triState(cdServices.rodaPneuSuspensao) },
    logoMarcaVidros: { status: triState(cdServices.logoMarcaVidros) },
    repairShopType: cdRepair.shopType,
    partsType: cdRepair.partsType,
  };
}
