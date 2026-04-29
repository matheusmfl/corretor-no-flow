import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

@Injectable()
export class PdfExtractorService {
  async extractText(filePath: string, maxPage?: number): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const data = new Uint8Array(buffer);

    const pdf = await pdfjsLib.getDocument({ data, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;

    const limit = maxPage ? Math.min(pdf.numPages, maxPage) : pdf.numPages;
    const pages: string[] = [];
    for (let i = 1; i <= limit; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .filter((item) => 'str' in item)
        .map((item) => (item as { str: string }).str)
        .join(' ');
      pages.push(text);
    }

    return pages.join('\n\n');
  }
}
