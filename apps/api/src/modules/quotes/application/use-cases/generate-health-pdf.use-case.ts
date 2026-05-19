import { Injectable } from '@nestjs/common';
import type { HealthQuoteDraft } from '@corretor/types';
import { HealthPdfTemplateService } from '../services/health-pdf-template.service';
import { PdfRendererService } from '../services/pdf-renderer.service';

@Injectable()
export class GenerateHealthPdfUseCase {
  constructor(
    private readonly template: HealthPdfTemplateService,
    private readonly renderer: PdfRendererService,
  ) {}

  async execute(draft: HealthQuoteDraft): Promise<Buffer> {
    const html = this.template.render(draft);
    return this.renderer.renderToPdf(html);
  }
}
