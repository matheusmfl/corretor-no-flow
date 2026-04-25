import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateCompanyDto } from '../dtos/update-company.dto';

@Injectable()
export class UpdateCompanyUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, companyId: string, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Empresa não encontrada.');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.companyId !== companyId) throw new ForbiddenException();

    return this.prisma.company.update({ where: { id: companyId }, data: dto });
  }
}
