import { Injectable } from '@nestjs/common';
import { PdfExtractorService } from '../services/pdf-extractor.service';
import { detectInsurerFromText } from '../services/insurer-detector';
import type { InsurerDetectionResult } from '@corretor/types';

const SUPPORTED_INSURERS = new Set(['BRADESCO', 'PORTO_SEGURO', 'AZUL', 'MITSUI_SUMITOMO']);

export interface DetectInsurerResponse extends InsurerDetectionResult {
  supported: boolean;
}

@Injectable()
export class DetectInsurerUseCase {
  constructor(private readonly pdfExtractor: PdfExtractorService) {}

  async execute(filePath: string): Promise<DetectInsurerResponse> {
    const text = await this.pdfExtractor.extractText(filePath);
    const result = detectInsurerFromText(text);
    const supported =
      result.detectedInsurer !== null && SUPPORTED_INSURERS.has(result.detectedInsurer);
    return { ...result, supported };
  }
}
