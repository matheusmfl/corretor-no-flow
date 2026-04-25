import { Module } from '@nestjs/common';
import { CreateCompanyUseCase } from './application/use-cases/create-company.use-case';
import { UpdateCompanyUseCase } from './application/use-cases/update-company.use-case';
import { CompanyController } from './presentation/company.controller';

@Module({
  controllers: [CompanyController],
  providers: [CreateCompanyUseCase, UpdateCompanyUseCase],
})
export class CompanyModule {}
