import { Injectable } from '@nestjs/common';
import type { ListProcessesQuery } from '@corretor/types';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ListQuotesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(companyId: string, query: ListProcessesQuery = {}) {
    const { status, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = {
      companyId,
      ...(status ? { status } : {}),
      ...(search ? { clientName: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.quoteProcess.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          product: true,
          status: true,
          clientName: true,
          publicToken: true,
          openedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.quoteProcess.count({ where }),
    ]);

    return { items, total, page, limit };
  }
}
