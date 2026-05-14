import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { HealthQuoteDraft } from '@corretor/types';
import { buildHealthSpreadsheetMatrix } from './health-spreadsheet-matrix.service';

@Injectable()
export class HealthXlsxExportService {
  async export(draft: HealthQuoteDraft): Promise<Buffer> {
    const matrix = buildHealthSpreadsheetMatrix(draft);
    const workbook = new ExcelJS.Workbook();

    // ─── Aba "Cotação"
    const sheet = workbook.addWorksheet('Cotação');

    sheet.addRow(matrix.headers);
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9EAD3' },
    };

    for (const row of matrix.rows) {
      const values = [row.label, row.age ?? '', row.relationship ?? '', ...row.planValues];
      const excelRow = sheet.addRow(values);

      if (row.isTotal) {
        excelRow.font = { bold: true };
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF2CC' },
        };
      }

      // Format monetary columns (starting at index 4 = column D+)
      row.planValues.forEach((_, colOffset) => {
        const cell = excelRow.getCell(4 + colOffset);
        if (typeof cell.value === 'number') {
          cell.numFmt = 'R$ #,##0.00';
        }
      });
    }

    sheet.columns.forEach((col) => {
      col.width = 18;
    });

    // ─── Aba "Notas"
    const notesSheet = workbook.addWorksheet('Notas');
    notesSheet.addRow(['Campo', 'Valor', 'Requer Revisão']);
    const notesHeader = notesSheet.getRow(1);
    notesHeader.font = { bold: true };

    for (const note of matrix.notes) {
      notesSheet.addRow([note.key, note.value, note.needsReview ? 'Sim' : 'Não']);
    }

    notesSheet.columns.forEach((col) => {
      col.width = 35;
    });

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
