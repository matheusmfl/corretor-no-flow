import { UnprocessableEntityException } from '@nestjs/common';
import { z } from 'zod';
import type { AutoQuoteData } from '@corretor/types';

const VehicleSchema = z.object({
  plate: z.string().optional(),
  model: z.string(),
  yearManufacture: z.number().optional(),
  yearModel: z.number().optional(),
  chassis: z.string().optional(),
  fipeCode: z.string().optional(),
  fipeValue: z.number().optional(),
});

const DriverSchema = z.object({
  name: z.string().optional(),
  cpf: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
});

const VehicleCoverageSchema = z.object({
  fipePercentage: z.number().optional(),
  lmi: z.string().optional(),
  deductible: z.number().optional(),
  deductibleType: z.string().optional(),
});

const RcfCoverageSchema = z.object({
  propertyDamage: z.number().optional(),
  bodilyInjury: z.number().optional(),
  moralDamages: z.number().optional(),
  combinedSingle: z.number().optional(),
});

const AppCoverageSchema = z.object({
  death: z.number().optional(),
  disability: z.number().optional(),
  medical: z.number().optional(),
  passengerCount: z.number().optional(),
});

const AssistanceCoverageSchema = z.object({
  towing: z.boolean().optional(),
  glassProtection: z.boolean().optional(),
  replacementVehicle: z.boolean().optional(),
  replacementDays: z.number().optional(),
});

const DeductibleItemSchema = z.object({
  item: z.string(),
  value: z.number(),
  type: z.string().optional(),
});

const PremiumSchema = z.object({
  base: z.number().optional(),
  rcfTotal: z.number().optional(),
  appTotal: z.number().optional(),
  iof: z.number().optional(),
  total: z.number(),
});

const PaymentInstallmentSchema = z.object({
  number: z.number(),
  amount: z.number(),
  total: z.number().optional(),
  hasInterest: z.boolean().optional(),
  discountLabel: z.string().optional(),
});

const PaymentMethodSchema = z.object({
  id: z.string(),
  type: z.enum(['debit', 'credit_bradesco', 'credit_card', 'coupon']),
  label: z.string(),
  installments: z.array(PaymentInstallmentSchema),
});

const AutoQuoteDataSchema = z.object({
  vehicle: VehicleSchema,
  driver: DriverSchema,
  quoteNumber: z.string().optional(),
  insurer: z.string(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  bonusClass: z.string().optional(),
  coverage: z.object({
    vehicle: VehicleCoverageSchema.optional(),
    rcf: RcfCoverageSchema.optional(),
    app: AppCoverageSchema.optional(),
    assistance: AssistanceCoverageSchema.optional(),
  }),
  deductibles: z.array(DeductibleItemSchema),
  premium: PremiumSchema,
  paymentMethods: z.array(PaymentMethodSchema),
}) satisfies z.ZodType<AutoQuoteData>;

// Converte null → undefined recursivamente antes de validar com Zod.
// A IA frequentemente retorna null para campos opcionais ausentes.
function stripNulls(value: unknown): unknown {
  if (value === null) return undefined;
  if (Array.isArray(value)) return value.map(stripNulls);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, stripNulls(v)]),
    );
  }
  return value;
}

export function parseAutoQuoteData(raw: unknown): AutoQuoteData {
  const result = AutoQuoteDataSchema.safeParse(stripNulls(raw));
  if (!result.success) {
    throw new UnprocessableEntityException(
      `Dados extraídos inválidos: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  }
  return result.data;
}
