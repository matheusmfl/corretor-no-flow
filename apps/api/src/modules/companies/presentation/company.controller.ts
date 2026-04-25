import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { CompanyResponseDto } from '../application/dtos/company-response.dto';
import { CreateCompanyDto } from '../application/dtos/create-company.dto';
import { UpdateCompanyDto } from '../application/dtos/update-company.dto';
import { CreateCompanyUseCase } from '../application/use-cases/create-company.use-case';
import { UpdateCompanyUseCase } from '../application/use-cases/update-company.use-case';

@ApiTags('Companies')
@ApiBearerAuth('access-token')
@Controller('companies')
export class CompanyController {
  constructor(
    private readonly createCompany: CreateCompanyUseCase,
    private readonly updateCompany: UpdateCompanyUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Onboarding: criar empresa do corretor' })
  @ApiOkResponse({ type: CompanyResponseDto })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateCompanyDto) {
    return this.createCompany.execute(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados da empresa' })
  @ApiOkResponse({ type: CompanyResponseDto })
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.updateCompany.execute(user.id, id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Buscar empresa do corretor autenticado' })
  @ApiOkResponse({ type: CompanyResponseDto })
  getMyCompany(@CurrentUser() user: { companyId: string }) {
    // TODO: GetMyCompanyUseCase
    return { companyId: user.companyId };
  }
}
