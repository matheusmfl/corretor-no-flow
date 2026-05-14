import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import type { HealthQuoteDraft, DraftField } from '@corretor/types';
import { HealthXlsxExportService } from '../services/health-xlsx-export.service';

const SENSITIVE_OPTION_FIELDS = [
  'accommodation',
  'coparticipation',
  'reimbursementMode',
  'validUntil',
  'dental',
] as const;

@Injectable()
export class GenerateHealthXlsxUseCase {
  constructor(private readonly xlsxExport: HealthXlsxExportService) {}

  async execute(draft: HealthQuoteDraft, forceGenerate = false): Promise<Buffer> {
    if (!forceGenerate) {
      const pendingLives = draft.lives.filter((l) => l.needsReview).length;
      const pendingFields = draft.quoteOptions.reduce((acc, opt) => {
        return (
          acc +
          SENSITIVE_OPTION_FIELDS.filter(
            (k) => (opt[k] as DraftField<string>).needsReview,
          ).length
        );
      }, 0);
      const totalPending = pendingLives + pendingFields;
      if (totalPending > 0) {
        throw new UnprocessableEntityException(
          `Rascunho tem ${totalPending} item(s) pendente(s) de revisão. ` +
            `Confirme ou use forceGenerate para gerar mesmo assim.`,
        );
      }
    }
    return this.xlsxExport.export(draft);
  }
}
