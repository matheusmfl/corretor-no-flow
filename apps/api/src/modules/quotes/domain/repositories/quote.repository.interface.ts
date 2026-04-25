export const QUOTE_REPOSITORY = Symbol('QUOTE_REPOSITORY');

export interface IQuoteRepository {
  findById(id: string): Promise<unknown | null>;
  findByCompanyId(companyId: string, page: number, limit: number): Promise<unknown[]>;
  findByPublicToken(token: string): Promise<unknown | null>;
  count(companyId: string): Promise<number>;
}
