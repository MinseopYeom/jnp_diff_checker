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
  headerRow2: number = 0
): SheetDiff => {
  // Normalize headers
  const h1 = (data1[headerRow1] || []).map(h => String(h || '').trim());
  const h2 = (data2[headerRow2] || []).map(h => String(h || '').trim());
  
  // Find headers common to both (for stricter identity matching)
  const commonHeaders = h1.filter(h => h && h2.includes(h));
  const allHeadersSet = new Set([...h1, ...h2]);
  allHeadersSet.delete('');
  const allHeaders = Array.from(allHeadersSet);

  // Find potential identity columns
  const identityKeywords = ['CODE', 'ID', 'PRIVILEGE', 'NAME', '번호', '코드', 'DESCRIPTION'];
  const identityCols = allHeaders.filter(h => 
    identityKeywords.some(k => h.toUpperCase().includes(k.toUpperCase()))
  );

  const content1 = data1.slice(headerRow1 + 1);
  const content2 = data2.slice(headerRow2 + 1);

  // Helper to stringify row for identity check
  const rowKey = (row: any[], originHeaders: string[]) => {
    // Prefer identity columns if they exist and are not empty
    const compareCols = identityCols.length > 0 ? identityCols : allHeaders;
    const values = compareCols.map(h => {
        const idx = originHeaders.indexOf(h);
        const val = idx !== -1 ? row[idx] : undefined;
        // Normalize 'O' marks and similar markers for better matching
        const strVal = String(val ?? '').trim();
        return strVal;
    });

    // If all key values are empty, this is an "Empty Row"
    if (values.every(v => v === '')) {
      return `EMPTY_ROW_${Math.random()}`; 
    }
    
    return values.join('|||');
  };

  const keys1 = content1.map(r => rowKey(r, h1));
  const keys2 = content2.map(r => rowKey(r, h2));

  // LCS implementation
  const n = keys1.length;
  const m = keys2.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (keys1[i - 1] === keys2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const rawDiff: RowDiff[] = [];
  let i = n, j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && keys1[i - 1] === keys2[j - 1]) {
      const cellDiffs: Record<string, CellDiff> = {};
      let isActuallyModified = false;
      
      allHeaders.forEach(h => {
        const val1 = content1[i - 1][h1.indexOf(h)];
        const val2 = content2[j - 1][h2.indexOf(h)];
        
        if (String(val1 ?? '').trim() === String(val2 ?? '').trim()) {
          cellDiffs[h] = { type: 'unchanged', value: val1 } as any;
        } else {
          cellDiffs[h] = { type: 'modified', oldValue: val1, newValue: val2 };
          isActuallyModified = true;
        }
      });

      rawDiff.unshift({ 
        type: isActuallyModified ? 'modified' : 'unchanged', 
        cells: cellDiffs, 
        row1Num: headerRow1 + i + 1, 
        row2Num: headerRow2 + j + 1 
      });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      const cellDiffs: Record<string, CellDiff> = {};
      allHeaders.forEach(h => {
        cellDiffs[h] = { type: 'added', newValue: content2[j - 1][h2.indexOf(h)] };
      });
      rawDiff.unshift({ type: 'added', cells: cellDiffs, row2Num: headerRow2 + j + 1 });
      j--;
    } else {
      const cellDiffs: Record<string, CellDiff> = {};
      allHeaders.forEach(h => {
        cellDiffs[h] = { type: 'removed', oldValue: content1[i - 1][h1.indexOf(h)] };
      });
      rawDiff.unshift({ type: 'removed', cells: cellDiffs, row1Num: headerRow1 + i + 1 });
      i--;
    }
  }

  // Final Pass: Merge blocks of Removed/Added rows by similarity
  const finalRows: RowDiff[] = [];
  let k = 0;
  while (k < rawDiff.length) {
    if (rawDiff[k].type === 'unchanged' || rawDiff[k].type === 'modified') {
      finalRows.push(rawDiff[k]);
      k++;
      continue;
    }

    // Collect consecutive block of removed and added rows
    const removedBlock: RowDiff[] = [];
    const addedBlock: RowDiff[] = [];
    while (k < rawDiff.length && rawDiff[k].type !== 'unchanged' && rawDiff[k].type !== 'modified') {
      if (rawDiff[k].type === 'removed') removedBlock.push(rawDiff[k]);
      else if (rawDiff[k].type === 'added') addedBlock.push(rawDiff[k]);
      k++;
    }

    // Map to track used indices in blocks
    const usedAdded = new Set<number>();
    
    // For each removed row, find the "best" match in the added block
    for (let rIdx = 0; rIdx < removedBlock.length; rIdx++) {
      const currentRemoved = removedBlock[rIdx];
      let bestMatch: { idx: number; similarity: number; mergedCells: any } | null = null;

      for (let aIdx = 0; aIdx < addedBlock.length; aIdx++) {
        if (usedAdded.has(aIdx)) continue;
        
        const currentAdded = addedBlock[aIdx];
        let matches = 0;
        let total = 0;
        const tempMergedCells: Record<string, CellDiff> = {};

        allHeaders.forEach(h => {
          const v1 = currentRemoved.cells[h]?.oldValue;
          const v2 = currentAdded.cells[h]?.newValue;
          
          if (v1 !== undefined || v2 !== undefined) {
             total++;
             if (String(v1 ?? '').trim() === String(v2 ?? '').trim()) {
               matches++;
               tempMergedCells[h] = { type: 'unchanged', value: v1 } as any;
             } else {
               tempMergedCells[h] = { type: 'modified', oldValue: v1, newValue: v2 };
             }
          } else {
             tempMergedCells[h] = { type: 'unchanged', value: undefined } as any;
          }
        });

        const similarity = total > 0 ? (matches / total) : 0;
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = { idx: aIdx, similarity, mergedCells: tempMergedCells };
        }
      }

      // If a reasonably good match is found (or if it's the only option and we want to align by position)
      // We use a threshold to prevent completely unrelated rows from merging.
      // 0.2 is a loose threshold to allow highly modified but aligned rows to merge.
      if (bestMatch && (bestMatch.similarity > 0.2 || removedBlock.length === addedBlock.length)) {
        finalRows.push({
          type: 'modified',
          cells: bestMatch.mergedCells,
          row1Num: currentRemoved.row1Num,
          row2Num: addedBlock[bestMatch.idx].row2Num
        });
        usedAdded.add(bestMatch.idx);
      } else {
        finalRows.push(currentRemoved);
      }
    }

    // Add remaining unmatched added rows
    for (let aIdx = 0; aIdx < addedBlock.length; aIdx++) {
      if (!usedAdded.has(aIdx)) {
        finalRows.push(addedBlock[aIdx]);
      }
    }
  }

  return {
    name: `${sheet1Name} vs ${sheet2Name}`,
    rows: finalRows,
    headers: allHeaders
  };
};
