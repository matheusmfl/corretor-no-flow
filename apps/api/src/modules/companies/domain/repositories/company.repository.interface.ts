import { Company } from '../entities/company.entity';

export const COMPANY_REPOSITORY = Symbol('ICompanyRepository');

export interface CreateCompanyData {
  name: string;
  slug: string;
  cnpj?: string;
  phone?: string;
  primaryColor?: string;
}

export interface ICompanyRepository {
  findById(id: string): Promise<Company | null>;
  findBySlug(slug: string): Promise<Company | null>;
  findByUserId(userId: string): Promise<Company | null>;
  create(userId: string, data: CreateCompanyData): Promise<Company>;
  update(id: string, data: Partial<CreateCompanyData & { logoUrl: string }>): Promise<Company>;
}
