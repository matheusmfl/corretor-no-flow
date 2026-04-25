import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ListQuotesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(companyId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.quote.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          product: true,
          status: true,
          clientName: true,
          publicToken: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.quote.count({ where: { companyId } }),
    ]);

    return { items, total, page, limit };
  }
}
