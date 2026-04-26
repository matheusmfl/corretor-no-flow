import { UnprocessableEntityException } from '@nestjs/common';
import { z } from 'zod';
import type { AutoQuoteData } from '@corretor/types';

const CoverageSchema = z.object({
  name: z.string(),
  description: z.string(),
  limit: z.string().optional(),
  deductible: z.string().optional(),
});

const InstallmentSchema = z.object({
  number: z.number(),
  amount: z.number(),
  dueDate: z.string().optional(),
});

const AutoQuoteDataSchema = z.object({
  plate: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.number().optional(),
  coverages: z.array(CoverageSchema),
  totalPremium: z.number(),
  installments: z.array(InstallmentSchema).optional(),
  validUntil: z.string().optional(),
}) satisfies z.ZodType<AutoQuoteData>;

export function parseAutoQuoteData(raw: unknown): AutoQuoteData {
  const result = AutoQuoteDataSchema.safeParse(raw);
  if (!result.success) {
    throw new UnprocessableEntityException(
      `Dados extraídos inválidos: ${result.error.issues.map((i) => i.message).join(', ')}`,
    );
  }
  return result.data;
}
