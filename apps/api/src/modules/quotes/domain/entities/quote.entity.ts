import { BaseEntity } from '../../../../shared/domain/base.entity';
import { QuoteStatus } from '../value-objects/quote-status.vo';

export class Quote extends BaseEntity {
  constructor(
    id: string,
    readonly companyId: string,
    readonly product: string,
    readonly status: QuoteStatus,
    readonly publicToken: string | null,
    readonly expiresAt: Date | null,
  ) {
    super(id);
  }

  isPendingReview(): boolean {
    return this.status === QuoteStatus.PENDING_REVIEW;
  }

  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }
}
