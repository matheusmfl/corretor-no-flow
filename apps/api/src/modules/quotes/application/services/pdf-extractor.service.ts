import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

@Injectable()
export class PdfExtractorService {
  async extractText(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const data = new Uint8Array(buffer);

    const pdf = await pdfjsLib.getDocument({ data, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;

    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .filter((item): item is { str: string } => 'str' in item)
        .map((item) => item.str)
        .join(' ');
      pages.push(text);
    }

    return pages.join('\n\n');
  }
}
