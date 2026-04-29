import { Insurer, InsuranceProduct } from '@prisma/client';

export interface ExtractPdfJobData {
  quoteId: string;
  processId: string;
  filePath: string;
  product: InsuranceProduct;
  insurer: Insurer;
}
