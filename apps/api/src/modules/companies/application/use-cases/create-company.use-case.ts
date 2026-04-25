import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Slug } from '../../domain/value-objects/slug.vo';
import { CreateCompanyDto } from '../dtos/create-company.dto';

@Injectable()
export class CreateCompanyUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, dto: CreateCompanyDto) {
    const slug = new Slug(dto.displayName);

    const [slugTaken, documentTaken, susepTaken] = await Promise.all([
      this.prisma.company.findUnique({ where: { slug: slug.value } }),
      this.prisma.company.findUnique({ where: { document: dto.document } }),
      this.prisma.company.findUnique({ where: { susepNumber: dto.susepNumber } }),
    ]);

    if (slugTaken) throw new ConflictException('Nome de empresa já em uso.');
    if (documentTaken) throw new ConflictException('Documento (CPF/CNPJ) já cadastrado.');
    if (susepTaken) throw new ConflictException('Número SUSEP já cadastrado.');

    const company = await this.prisma.company.create({
      data: {
        accountType: dto.accountType,
        legalName: dto.legalName,
        tradeName: dto.tradeName ?? null,
        displayName: dto.displayName,
        slug: slug.value,
        document: dto.document,
        susepNumber: dto.susepNumber,
        whatsapp: dto.whatsapp,
        contactEmail: dto.contactEmail ?? null,
        primaryColor: dto.primaryColor ?? '#003B0F',
        state: dto.state ?? null,
        city: dto.city ?? null,
        users: { connect: { id: userId } },
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { companyId: company.id },
    });

    return company;
  }
}
