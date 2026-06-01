import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Layers, FileSearch, ArrowRightLeft, AlertCircle, PlayCircle, Download, Filter, LogOut, User } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { DiffTable } from './components/DiffTable';
import { FilePreview } from './components/FilePreview';
import { LoginPage } from './components/LoginPage';
import { parseExcelFile, compareSheets, getSheetData } from './lib/excel';
import { ComparisonResult, SheetDiff } from './types';
import { cn } from './lib/utils';
import * as XLSX from 'xlsx';
import { jwtDecode } from 'jwt-decode';

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  hd?: string; // hosted domain
}

export default function App() {
  const [user, setUser] = useState<GoogleUser | null>(() => {
    const saved = localStorage.getItem('jnp_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authError, setAuthError] = useState<string | null>(null);

  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);

  const [workbook1, setWorkbook1] = useState<XLSX.WorkBook | null>(null);
  const [workbook2, setWorkbook2] = useState<XLSX.WorkBook | null>(null);

  const [selectedSheet1, setSelectedSheet1] = useState<string>('');
  const [selectedSheet2, setSelectedSheet2] = useState<string>('');

  const [headerRow1, setHeaderRow1] = useState(0);
  const [headerRow2, setHeaderRow2] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'matched' | 'modified' | 'removed' | 'added'>('all');
  const [uniqueColumns, setUniqueColumns] = useState<string[]>([]);

  const handleLoginSuccess = (credential: string) => {
    try {
      const decoded: GoogleUser = jwtDecode(credential);

      // Security Check: Only @jnpmedi.com domain allowed
      // Check both email suffix and hosted domain (hd) field for robustness
      const isAuthorized = decoded.email.endsWith('@jnpmedi.com') || decoded.hd === 'jnpmedi.com';

      if (isAuthorized) {
        setUser(decoded);
        localStorage.setItem('jnp_user', JSON.stringify(decoded));
        setAuthError(null);
      } else {
        setAuthError("This service is restricted to @jnpmedi.com accounts only. Please sign in with your corporate email.");
      }
    } catch (err) {
      setAuthError("Failed to authenticate. Please try again.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('jnp_user');
    reset();
  };

  // Load Workbooks when files change
  useEffect(() => {
    if (file1) {
      parseExcelFile(file1).then(wb => {
        setWorkbook1(wb);
        setSelectedSheet1(wb.SheetNames[0] || '');
      }).catch(() => setError("Failed to parse File 1"));
    } else {
      setWorkbook1(null);
      setSelectedSheet1('');
    }
  }, [file1]);

  useEffect(() => {
    if (file2) {
      parseExcelFile(file2).then(wb => {
        setWorkbook2(wb);
        setSelectedSheet2(wb.SheetNames[0] || '');
      }).catch(() => setError("Failed to parse File 2"));
    } else {
      setWorkbook2(null);
      setSelectedSheet2('');
    }
  }, [file2]);

  const sheetData1 = useMemo(() =>
    workbook1 && selectedSheet1 ? getSheetData(workbook1, selectedSheet1) : []
    , [workbook1, selectedSheet1]);

  const sheetData2 = useMemo(() =>
    workbook2 && selectedSheet2 ? getSheetData(workbook2, selectedSheet2) : []
    , [workbook2, selectedSheet2]);

  const commonHeaders = useMemo(() => {
    if (!sheetData1.length || !sheetData2.length) return [];
    const h1 = (sheetData1[headerRow1] || []).map(h => String(h || '').trim());
    const h2 = (sheetData2[headerRow2] || []).map(h => String(h || '').trim());
    const set2 = new Set(h2.map(h => h.toUpperCase()));
    return h1.filter(h => h && set2.has(h.toUpperCase()));
  }, [sheetData1, sheetData2, headerRow1, headerRow2]);

  useEffect(() => {
    if (commonHeaders.length > 0) {
      const identityKeywords = ['CODE', 'ID', 'PRIVILEGE', 'NAME', '번호', '코드', 'DESCRIPTION'];
      const defaults = commonHeaders.filter(h =>
        identityKeywords.some(k => h.toUpperCase().includes(k.toUpperCase()))
      );
      setUniqueColumns(defaults.length > 0 ? defaults : [commonHeaders[0]]);
    } else {
      setUniqueColumns([]);
    }
  }, [commonHeaders]);

  const handleCompare = () => {
    if (!workbook1 || !workbook2 || !selectedSheet1 || !selectedSheet2) return;

    setLoading(true);
    setError(null);
    try {
      const sheetDiff = compareSheets(
        sheetData1,
        sheetData2,
        selectedSheet1,
        selectedSheet2,
        headerRow1,
        headerRow2,
        uniqueColumns
      );

      setResult({
        file1Name: file1?.name || 'File 1',
        file2Name: file2?.name || 'File 2',
        sheets: [sheetDiff]
      });
    } catch (err) {
      console.error(err);
      setError("Comparison failed. Please check the files and sheet selection.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile1(null);
    setFile2(null);
    setResult(null);
    setError(null);
    setHeaderRow1(0);
    setHeaderRow2(0);
    setActiveTab('all');
  };

  const handleDownloadExcel = () => {
    if (!result) return;

    try {
      const sheet = result.sheets[0];
      
      let rows = sheet.rows;
      if (activeTab === 'matched') {
        rows = sheet.rows.filter(r => r.type === 'unchanged' || r.type === 'modified');
      } else if (activeTab === 'modified') {
        rows = sheet.rows.filter(r => r.type === 'modified');
      } else if (activeTab === 'removed') {
        rows = sheet.rows.filter(r => r.type === 'removed');
      } else if (activeTab === 'added') {
        rows = sheet.rows.filter(r => r.type === 'added');
      }

      const wsData = [
        ['Status', 'Row(L)', 'Row(R)', ...sheet.headers]
      ];

      rows.forEach(row => {
        const rowData = [
          row.type.toUpperCase(),
          row.row1Num || '',
          row.row2Num || ''
        ];

        sheet.headers.forEach(header => {
          const cell = row.cells[header] as any;
          if (!cell) {
            rowData.push('');
            return;
          }

          if (cell.type === 'modified') {
            rowData.push(`[Old] ${cell.oldValue ?? ''} -> [New] ${cell.newValue ?? ''}`);
          } else if (cell.type === 'added') {
            rowData.push(cell.newValue || '');
          } else if (cell.type === 'removed') {
            rowData.push(cell.oldValue || '');
          } else {
            rowData.push(cell.value || '');
          }
        });

        wsData.push(rowData);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Differences");

      XLSX.writeFile(wb, `Diff_Result_${file1?.name}_vs_${file2?.name}.xlsx`);
    } catch (err) {
      console.error(err);
      setError("Failed to export Excel file.");
    }
  };

  const totalDiffsInActiveSheet = useMemo(() => {
    if (!result) return 0;
    return result.sheets[0]?.rows.length || 0;
  }, [result]);

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} error={authError} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-full px-6 h-16 flex items-center justify-between">
          <button
            onClick={reset}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity active:scale-95 cursor-pointer text-left"
            title="Reset to home"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">JNPEMDI</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none">Excel Diff Checker</p>
            </div>
          </button>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-6 h-6 rounded-full ring-2 ring-white" />
              ) : (
                <User className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-xs font-bold text-slate-600">{user.email}</span>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
            >
              <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              Sign Out
            </button>

            {result && (
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Reset
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-full mx-auto px-6 py-6 min-h-[calc(100vh-64px)] flex flex-col">
        {!result ? (
          <div className="flex flex-col flex-1">
            <div className="grid lg:grid-cols-2 gap-6 flex-1 mb-6">
              {/* File 1 Slot */}
              <div className="flex flex-col gap-4">
                {!file1 ? (
                  <FileUpload
                    label="Select Original File"
                    file={file1}
                    onFileSelect={setFile1}
                    className="flex-1 min-h-[400px]"
                  />
                ) : (
                  <FilePreview
                    fileName={file1.name}
                    sheetNames={workbook1?.SheetNames || []}
                    selectedSheet={selectedSheet1}
                    onSheetChange={setSelectedSheet1}
                    headerRow={headerRow1}
                    onHeaderRowChange={setHeaderRow1}
                    data={sheetData1}
                    className="flex-1"
                  />
                )}
              </div>

              {/* File 2 Slot */}
              <div className="flex flex-col gap-4">
                {!file2 ? (
                  <FileUpload
                    label="Select Modified File"
                    file={file2}
                    onFileSelect={setFile2}
                    className="flex-1 min-h-[400px]"
                  />
                ) : (
                  <FilePreview
                    fileName={file2.name}
                    sheetNames={workbook2?.SheetNames || []}
                    selectedSheet={selectedSheet2}
                    onSheetChange={setSelectedSheet2}
                    headerRow={headerRow2}
                    onHeaderRowChange={setHeaderRow2}
                    data={sheetData2}
                    className="flex-1"
                  />
                )}
              </div>
            </div>

            {/* Unique Column Selection Section */}
            {file1 && file2 && commonHeaders.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md mb-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-5 h-5 text-blue-600 animate-pulse" />
                  <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
                    Unique Column Configuration (Join Key)
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    - Select columns to identify and match rows between files
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto p-1 custom-scrollbar">
                  {commonHeaders.map((header) => {
                    const isChecked = uniqueColumns.includes(header);
                    return (
                      <button
                        key={header}
                        onClick={() => {
                          if (isChecked) {
                            setUniqueColumns(uniqueColumns.filter((c) => c !== header));
                          } else {
                            setUniqueColumns([...uniqueColumns, header]);
                          }
                        }}
                        className={cn(
                          "px-4 py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 cursor-pointer",
                          isChecked
                            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        {header}
                      </button>
                    );
                  })}
                </div>

                {uniqueColumns.length === 0 && (
                  <div className="mt-3 flex items-center gap-2 text-amber-600 text-xs font-semibold animate-pulse">
                    <AlertCircle className="w-4 h-4" />
                    Please select at least one unique column to proceed.
                  </div>
                )}
              </motion.div>
            )}

            {/* Actions Bar */}
            <div className="sticky bottom-6 flex flex-col items-center gap-4">
              {error && (
                <div className="flex items-center gap-3 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 shadow-sm animate-bounce">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-xs font-bold">{error}</p>
                </div>
              )}

              <button
                onClick={handleCompare}
                disabled={!workbook1 || !workbook2 || loading || uniqueColumns.length === 0}
                className={cn(
                  "group relative px-12 py-4 bg-teal-500 text-white rounded-xl font-bold shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden",
                  !loading && workbook1 && workbook2 && uniqueColumns.length > 0 && "hover:bg-teal-600 hover:shadow-teal-200"
                )}
              >
                <div className="flex items-center gap-3 relative z-10">
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
                  {loading ? "Analyzing..." : "Compare Selection"}
                </div>
              </button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6 max-w-full mx-auto w-full"
          >
            {/* Report Header - Professional Diffchecker Style */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl flex flex-col xl:flex-row items-center justify-between gap-6 overflow-hidden">
              <div className="flex flex-wrap items-center gap-6 w-full lg:w-auto">
                <div className="flex items-center gap-2 flex-1 lg:flex-none">
                  <div className="px-4 py-2 bg-slate-100 rounded-xl text-[11px] font-mono text-slate-500 max-w-[200px] truncate border border-slate-200" title={file1?.name}>
                    {file1?.name}
                  </div>
                  <ArrowRightLeft className="w-4 h-4 text-slate-300" />
                  <div className="px-4 py-2 bg-teal-50 rounded-xl text-[11px] font-mono text-teal-600 max-w-[200px] truncate border border-teal-100" title={file2?.name}>
                    {file2?.name}
                  </div>
                </div>

                <div className="h-10 w-px bg-slate-100 hidden lg:block" />

                <div className="flex items-center gap-8">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Differences Found</span>
                    <span className="text-3xl font-black text-teal-600 tabular-nums leading-none">
                      {result.sheets[0]?.rows.filter(r => r.type !== 'unchanged').length}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Comparing Sheet</span>
                    <span className="text-base font-bold text-slate-900 max-w-[250px] truncate">
                      {selectedSheet1} <span className="text-slate-300 font-normal mx-1">vs</span> {selectedSheet2}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleDownloadExcel}
                  className="flex items-center gap-2 px-4 py-3 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Export Excel
                </button>

                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" /> New Comparison
                </button>
              </div>
            </div>

            {/* Results Table */}
            <div className="flex-1">
              <DiffTable 
                sheet={result.sheets[0]} 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
              />
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-200 mt-auto">
        <div className="max-w-full px-6 flex flex-col md:flex-row items-center justify-between gap-6 opacity-50">
          <p className="text-sm">© 2026 JNPMEDI Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm font-medium">
            <a href="#" className="hover:text-blue-600 transition-colors">Documentation</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
