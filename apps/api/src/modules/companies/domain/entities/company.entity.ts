import { BaseEntity } from '../../../../shared/domain/base.entity';

export class Company extends BaseEntity {
  constructor(
    id: string,
    readonly name: string,
    readonly slug: string,
    readonly cnpj: string | null,
    readonly phone: string | null,
    readonly logoUrl: string | null,
    readonly primaryColor: string,
    readonly createdAt: Date,
  ) {
    super(id);
  }
}
