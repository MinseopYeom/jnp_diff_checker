import * as XLSX from 'xlsx';
import { ComparisonResult, SheetDiff, RowDiff, CellDiff, DiffType } from '../types';

export const parseExcelFile = async (file: File): Promise<XLSX.WorkBook> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      resolve(workbook);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const getSheetData = (workbook: XLSX.WorkBook, sheetName: string): any[][] => {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { header: 1 });
};

const areRowsEqual = (row1: any[], row2: any[], headers: string[], h1: string[], h2: string[]) => {
  if (!row1 || !row2) return false;
  for (const h of headers) {
    const v1 = row1[h1.indexOf(h)];
    const v2 = row2[h2.indexOf(h)];
    if (v1 !== v2) return false;
  }
  return true;
};

export const compareSheets = (
  data1: any[][],
  data2: any[][],
  sheet1Name: string,
  sheet2Name: string,
  headerRow1: number = 0,
  headerRow2: number = 0,
  uniqueColumns: string[] = []
): SheetDiff => {
  // Normalize headers
  const h1 = (data1[headerRow1] || []).map(h => String(h || '').trim());
  const h2 = (data2[headerRow2] || []).map(h => String(h || '').trim());
  
  const allHeadersSet = new Set([...h1, ...h2]);
  allHeadersSet.delete('');
  const allHeaders = Array.from(allHeadersSet);

  const content1 = data1.slice(headerRow1 + 1);
  const content2 = data2.slice(headerRow2 + 1);

  // If no unique columns are specified, fallback to using all headers
  const colsToUse = uniqueColumns.length > 0 ? uniqueColumns : allHeaders;

  // Helper to compute join key for a row
  const getRowKey = (row: any[], headers: string[], cols: string[]) => {
    const values = cols.map(col => {
      const idx = headers.indexOf(col);
      const val = idx !== -1 ? row[idx] : undefined;
      const strVal = String(val ?? '').trim();
      // Normalize 'O' marks and similar markers or trailing decimals
      return strVal.endsWith('.0') ? strVal.slice(0, -2) : strVal;
    });

    // Check if row is completely empty
    if (values.every(v => v === '')) {
      return `EMPTY_ROW_${Math.random()}`; 
    }
    
    return values.join('|||');
  };

  // Build File 1 Map: key -> array of matching rows (to support duplicates if any)
  const file1Map = new Map<string, { row: any[]; num: number; matched: boolean }[]>();
  content1.forEach((row, idx) => {
    const key = getRowKey(row, h1, colsToUse);
    const rowNum = headerRow1 + idx + 2;
    const list = file1Map.get(key) || [];
    list.push({ row, num: rowNum, matched: false });
    file1Map.set(key, list);
  });

  const finalRows: RowDiff[] = [];
  let lastMatchedRow1Num = 0;
  let addedOffset = 0;

  // Iterate over File 2 rows to match or find added rows
  content2.forEach((row2, idx2) => {
    const row2Num = headerRow2 + idx2 + 2;
    const key = getRowKey(row2, h2, colsToUse);
    
    const file1Rows = file1Map.get(key);
    const match = file1Rows?.find(r => !r.matched);

    if (match) {
      match.matched = true;
      lastMatchedRow1Num = match.num;
      addedOffset = 0;

      const cellDiffs: Record<string, CellDiff> = {};
      let isActuallyModified = false;

      allHeaders.forEach(h => {
        const idx1 = h1.indexOf(h);
        const idx2 = h2.indexOf(h);

        const val1 = idx1 !== -1 ? match.row[idx1] : undefined;
        const val2 = idx2 !== -1 ? row2[idx2] : undefined;

        const str1 = val1 !== undefined ? String(val1).trim() : '';
        const str2 = val2 !== undefined ? String(val2).trim() : '';

        const norm1 = str1.endsWith('.0') ? str1.slice(0, -2) : str1;
        const norm2 = str2.endsWith('.0') ? str2.slice(0, -2) : str2;

        if (norm1 === norm2) {
          cellDiffs[h] = { type: 'unchanged', value: val1 } as any;
        } else {
          cellDiffs[h] = { type: 'modified', oldValue: val1, newValue: val2 };
          isActuallyModified = true;
        }
      });

      finalRows.push({
        type: isActuallyModified ? 'modified' : 'unchanged',
        cells: cellDiffs,
        row1Num: match.num,
        row2Num: row2Num,
        sortKey: match.num
      } as any);
    } else {
      addedOffset++;
      const cellDiffs: Record<string, CellDiff> = {};
      allHeaders.forEach(h => {
        const idx2 = h2.indexOf(h);
        const val2 = idx2 !== -1 ? row2[idx2] : undefined;
        cellDiffs[h] = { type: 'added', newValue: val2 };
      });

      finalRows.push({
        type: 'added',
        cells: cellDiffs,
        row2Num: row2Num,
        sortKey: lastMatchedRow1Num + 0.0001 * addedOffset
      } as any);
    }
  });

  // Collect remaining unmatched (removed) rows from File 1
  for (const [_, list] of file1Map.entries()) {
    list.forEach(match => {
      if (!match.matched) {
        const cellDiffs: Record<string, CellDiff> = {};
        allHeaders.forEach(h => {
          const idx1 = h1.indexOf(h);
          const val1 = idx1 !== -1 ? match.row[idx1] : undefined;
          cellDiffs[h] = { type: 'removed', oldValue: val1 };
        });

        finalRows.push({
          type: 'removed',
          cells: cellDiffs,
          row1Num: match.num,
          sortKey: match.num - 0.00005
        } as any);
      }
    });
  }

  // Sort rows to align them naturally based on their appearance
  finalRows.sort((a: any, b: any) => a.sortKey - b.sortKey);
  
  // Clean up sortKey
  finalRows.forEach((r: any) => delete r.sortKey);

  return {
    name: `${sheet1Name} vs ${sheet2Name}`,
    rows: finalRows,
    headers: allHeaders
  };
};;
