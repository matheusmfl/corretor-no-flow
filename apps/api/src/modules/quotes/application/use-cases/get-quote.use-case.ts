import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class GetQuoteUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(companyId: string, processId: string) {
    const process = await this.prisma.quoteProcess.findUnique({
      where: { id: processId },
      include: { quotes: true },
    });
    if (!process) throw new NotFoundException('Processo não encontrado.');
    if (process.companyId !== companyId) throw new ForbiddenException();
    return process;
  }
}
