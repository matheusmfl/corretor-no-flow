import { Module } from '@nestjs/common';
import { CreateCompanyUseCase } from './application/use-cases/create-company.use-case';
import { UpdateCompanyUseCase } from './application/use-cases/update-company.use-case';
import { GetMyCompanyUseCase } from './application/use-cases/get-my-company.use-case';
import { CompanyController } from './presentation/company.controller';

@Module({
  controllers: [CompanyController],
  providers: [CreateCompanyUseCase, UpdateCompanyUseCase, GetMyCompanyUseCase],
})
export class CompanyModule {}
