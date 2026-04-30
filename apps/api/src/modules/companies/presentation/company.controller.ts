import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import type { Response } from 'express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { Public } from '../../auth/presentation/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { CompanyResponseDto } from '../application/dtos/company-response.dto';
import { CreateCompanyDto } from '../application/dtos/create-company.dto';
import { UpdateCompanyDto } from '../application/dtos/update-company.dto';
import { CreateCompanyUseCase } from '../application/use-cases/create-company.use-case';
import { UpdateCompanyUseCase } from '../application/use-cases/update-company.use-case';
import { GetMyCompanyUseCase } from '../application/use-cases/get-my-company.use-case';

const LOGO_DIR = './uploads/logos';
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/svg+xml'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

const logoStorage = diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(LOGO_DIR, { recursive: true });
    cb(null, LOGO_DIR);
  },
  filename: (req: any, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${req.params.id}${ext}`);
  },
});

@ApiTags('Companies')
@ApiBearerAuth('access-token')
@Controller('companies')
export class CompanyController {
  constructor(
    private readonly createCompany: CreateCompanyUseCase,
    private readonly updateCompany: UpdateCompanyUseCase,
    private readonly getMyCompany: GetMyCompanyUseCase,
    private readonly prisma: PrismaService,
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
  me(@CurrentUser() user: { companyId: string }) {
    return this.getMyCompany.execute(user.companyId);
  }

  @Post(':id/logo')
  @ApiOperation({ summary: 'Upload da logo da empresa (PNG recomendado, máx 2 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { logo: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('logo', {
    storage: logoStorage,
    limits: { fileSize: MAX_SIZE_BYTES },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
      cb(new BadRequestException('Formato inválido. Use PNG, JPG ou SVG.'), false);
    },
  }))
  async uploadLogo(
    @CurrentUser() user: { id: string; companyId: string },
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (user.companyId !== id) throw new ForbiddenException();
    if (!file) throw new BadRequestException('Arquivo de logo é obrigatório.');

    const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
    const logoUrl = `${apiUrl}/api/companies/${id}/logo`;
    await this.prisma.company.update({ where: { id }, data: { logoUrl } });
    return { logoUrl };
  }

  @Get(':id/logo')
  @Public()
  @ApiOperation({ summary: 'Serve a logo da empresa' })
  async serveLogo(@Param('id') id: string, @Res() res: Response) {
    const files = fs.existsSync(LOGO_DIR)
      ? fs.readdirSync(LOGO_DIR).filter((f) => f.startsWith(id))
      : [];

    if (!files.length) throw new NotFoundException('Logo não encontrada.');

    const filePath = path.join(LOGO_DIR, files[0]);
    const ext = path.extname(files[0]).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
    };

    res.setHeader('Content-Type', mimeMap[ext] ?? 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(path.resolve(filePath));
  }
}
