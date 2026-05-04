import React from 'react';
import { SheetDiff, CellDiff } from '../types';
import { cn } from '../lib/utils';
import { ArrowRight, RefreshCw } from 'lucide-react';

interface DiffTableProps {
  sheet: SheetDiff;
  showOnlyDiffs?: boolean;
}

export const DiffTable: React.FC<DiffTableProps> = ({ sheet, showOnlyDiffs = false }) => {
  const displayRows = showOnlyDiffs 
    ? sheet.rows.filter(r => r.type !== 'unchanged')
    : sheet.rows;

  if (sheet.rows.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-sm animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-full">
             <ArrowRight className="w-8 h-8 rotate-45" />
          </div>
        </div>
        <p className="text-lg font-bold text-slate-900">No differences identified</p>
        <p className="text-sm">Sheet <span className="font-mono text-blue-600">{sheet.name}</span> is identical in both files.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 shadow-2xl bg-white overflow-hidden max-h-[85vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-max min-w-full text-[11px] text-left border-collapse table-auto">
          <thead className="sticky top-0 z-30">
            <tr className="bg-[#fff7ed] border-b border-orange-100">
              <th className="w-12 px-2 py-2 font-bold text-slate-400 border-r border-slate-200 text-center sticky left-0 bg-[#fff7ed] z-40">L</th>
              <th className="w-12 px-2 py-2 font-bold text-slate-400 border-r border-slate-200 text-center sticky left-12 bg-[#fff7ed] z-40">R</th>
              {sheet.headers.map((header, idx) => {
                const isMint = header.toUpperCase().includes('업데이트') || 
                             header.toUpperCase().includes('검토') || 
                             header.toUpperCase().includes('NEW') ||
                             header.toUpperCase().includes('STATUS');
                return (
                  <th key={idx} className={cn(
                    "px-4 py-3 font-bold border-r border-slate-200 last:border-0 min-w-[160px] whitespace-nowrap",
                    isMint ? "bg-[#e6fffa] text-teal-800" : "bg-[#fff7ed] text-orange-900"
                  )}>
                    <div className="text-[10px] uppercase tracking-wide opacity-80">{header}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white">
            {displayRows.map((row, rowIdx) => (
              <tr 
                key={rowIdx} 
                className={cn(
                  "group transition-all h-8 border-b border-slate-100",
                  row.type === 'added' && "bg-[#f0fff4]",
                  row.type === 'removed' && "bg-[#fff5f5]",
                  row.type === 'modified' && "bg-white",
                  row.type === 'unchanged' && "bg-white hover:bg-slate-50/80"
                )}
              >
                <td className={cn(
                  "px-3 py-0 font-mono text-[9px] text-center sticky left-0 z-10 border-r border-slate-200",
                  row.type === 'removed' ? "text-red-600 font-bold bg-[#fff5f5]" : 
                  row.type === 'added' ? "text-slate-300 bg-[#f0fff4]" : "text-slate-400 bg-white"
                )}>
                  {row.row1Num || ''}
                </td>
                <td className={cn(
                  "px-3 py-0 font-mono text-[9px] text-center sticky left-12 z-10 border-r border-slate-200",
                  row.type === 'added' ? "text-teal-600 font-bold bg-[#f0fff4]" : 
                  row.type === 'removed' ? "text-slate-300 bg-[#fff5f5]" : "text-slate-400 bg-white"
                )}>
                  {row.row2Num || ''}
                </td>
                {sheet.headers.map((header, colIdx) => {
                  const cell = row.cells[header] as (CellDiff & { value?: any }) | undefined;
                  
                  if (!cell) {
                    return <td key={colIdx} className="px-3 py-0 border-r border-slate-100 last:border-0" />;
                  }

                  const isMintCol = header.toUpperCase().includes('업데이트') || 
                                  header.toUpperCase().includes('검토') || 
                                  header.toUpperCase().includes('NEW') ||
                                  header.toUpperCase().includes('STATUS');

                  return (
                    <td 
                      key={colIdx} 
                      className={cn(
                        "px-4 py-2 align-middle border-r border-slate-100 last:border-0 transition-colors text-[11px] whitespace-nowrap",
                        row.type === 'added' && "bg-[#f0fff4]",
                        row.type === 'removed' && "bg-[#fff5f5]",
                        isMintCol && "bg-[#ebfefb]/60"
                      )}
                      title={cell.type === 'modified' ? `Old: ${cell.oldValue}\nNew: ${cell.newValue}` : String(cell.value ?? cell.newValue ?? cell.oldValue ?? '')}
                    >
                      {cell.type === 'modified' ? (
                        <div className="flex items-center gap-2 py-0.5">
                          <div className="bg-[#fff5f5] border border-red-100 rounded px-2 py-1 min-h-[1.5rem] flex items-center">
                            <span className="text-red-500 text-[10px] font-medium leading-none">
                              {String(cell.oldValue ?? '')}
                            </span>
                          </div>
                          <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                          <div className="bg-[#f0fff4] border border-teal-100 rounded px-2 py-1 min-h-[1.5rem] flex items-center">
                             <span className="text-teal-700 font-bold text-[10px] leading-none text-center">
                               {String(cell.newValue ?? '')}
                             </span>
                          </div>
                        </div>
                      ) : cell.type === 'added' ? (
                        <span className="text-teal-800 font-bold px-1">
                          {String(cell.newValue ?? '')}
                        </span>
                      ) : cell.type === 'removed' ? (
                        <span className="text-red-700 font-medium px-1">
                          {String(cell.oldValue ?? '')}
                        </span>
                      ) : (
                        <span className={cn(
                          "text-slate-700 leading-tight block px-1",
                          String(cell.value).trim().toUpperCase() === 'O' && "text-[#ef4444] font-black text-center text-[13px] scale-x-110",
                          isMintCol && "text-teal-700 font-medium"
                        )}>
                          {String(cell.value ?? '')}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fixed Toolbar for Count */}
      <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between z-50 text-[10px] font-bold uppercase tracking-widest shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-8">
           <span className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
             {sheet.rows.filter(r => r.type === 'added').length} Added
           </span>
           <span className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
             {sheet.rows.filter(r => r.type === 'removed').length} Removed
           </span>
           <span className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
             {sheet.rows.filter(r => r.type === 'modified').length} Modified
           </span>
        </div>
        <div className="text-slate-400 flex items-center gap-3">
           <RefreshCw className="w-3.5 h-3.5 animate-pulse" />
           <span className="text-slate-200">Total Differences: {sheet.rows.length}</span>
        </div>
      </div>
    </div>
  );
};
