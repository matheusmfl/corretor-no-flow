export const QUOTE_PROCESS_REPOSITORY = Symbol('QUOTE_PROCESS_REPOSITORY');

export interface IQuoteProcessRepository {
  findById(id: string): Promise<unknown | null>;
  findByCompanyId(companyId: string, page: number, limit: number): Promise<unknown[]>;
  findByPublicToken(token: string): Promise<unknown | null>;
  count(companyId: string): Promise<number>;
}
