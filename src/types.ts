export interface ExcelWorkbook {
  name: string;
  sheetNames: string[];
  workbook: any; // Original XLSX workbook
}

export interface ComparisonOptions {
  sheet1Name: string;
  sheet2Name: string;
  headerRow1: number;
  headerRow2: number;
}

export interface ExcelRow {
  index: number;
  cells: Record<string, any>;
}

export interface ExcelSheet {
  name: string;
  data: any[][];
}

export type DiffType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface CellDiff {
  type: DiffType;
  oldValue?: any;
  newValue?: any;
}

export interface RowDiff {
  type: DiffType;
  cells: Record<string, CellDiff>;
  row1Num?: number;
  row2Num?: number;
}

export interface SheetDiff {
  name: string;
  rows: RowDiff[];
  headers: string[];
}

export interface ComparisonResult {
  file1Name: string;
  file2Name: string;
  sheets: SheetDiff[];
}
