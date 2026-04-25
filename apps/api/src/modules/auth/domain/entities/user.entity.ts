import { BaseEntity } from '../../../../shared/domain/base.entity';

export class User extends BaseEntity {
  constructor(
    id: string,
    readonly email: string,
    readonly name: string,
    readonly passwordHash: string,
    readonly companyId: string | null,
    readonly createdAt: Date,
  ) {
    super(id);
  }

  hasCompany(): boolean {
    return this.companyId !== null;
  }
}
