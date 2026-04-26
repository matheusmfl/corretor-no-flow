import { BaseEntity } from '../../../../shared/domain/base.entity';
import { QuoteProcessStatus } from '../value-objects/quote-status.vo';

export class QuoteProcess extends BaseEntity {
  constructor(
    id: string,
    readonly companyId: string,
    readonly product: string,
    readonly status: QuoteProcessStatus,
    readonly publicToken: string | null,
    readonly expiresAt: Date | null,
    readonly clientName: string | null,
    readonly clientPhone: string | null,
  ) {
    super(id);
  }

  isPublishable(): boolean {
    return this.status === QuoteProcessStatus.READY
  }

  isPublished(): boolean {
    return this.status === QuoteProcessStatus.PUBLISHED
  }
}
