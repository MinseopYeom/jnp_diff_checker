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
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xl bg-white custom-scrollbar max-h-[75vh]">
      <table className="w-full text-[11px] text-left border-collapse table-fixed min-w-[1500px]">
        <thead className="sticky top-0 z-30">
          <tr className="bg-[#fff7ed] border-b border-orange-100">
            <th className="w-12 px-2 py-2 font-bold text-slate-400 border-r border-slate-200 text-center sticky left-0 bg-[#fff7ed]">L</th>
            <th className="w-12 px-2 py-2 font-bold text-slate-400 border-r border-slate-200 text-center sticky left-12 bg-[#fff7ed]">R</th>
            {sheet.headers.map((header, idx) => {
              const isMint = header.toUpperCase().includes('업데이트') || 
                           header.toUpperCase().includes('검토') || 
                           header.toUpperCase().includes('NEW') ||
                           header.toUpperCase().includes('STATUS');
              return (
                <th key={idx} className={cn(
                  "px-3 py-2 font-bold border-r border-slate-200 last:border-0 min-w-[140px]",
                  isMint ? "bg-[#e6fffa] text-teal-800" : "bg-[#fff7ed] text-orange-900"
                )}>
                  <div className="truncate text-[10px] uppercase tracking-wide opacity-80">{header}</div>
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
                      "px-2 py-0 align-middle border-r border-slate-100 last:border-0 transition-colors break-words text-[11px]",
                      row.type === 'added' && "bg-[#f0fff4]",
                      row.type === 'removed' && "bg-[#fff5f5]",
                      isMintCol && "bg-[#ebfefb]/60"
                    )}
                  >
                    {cell.type === 'modified' ? (
                      <div className="flex items-center gap-1 py-0.5 w-full">
                        <div className="flex-1 bg-[#fff5f5] border border-red-100 rounded px-1 min-h-[1.25rem] flex items-center justify-center">
                          <span className="text-red-500 text-[9px] font-medium leading-tight">
                            {String(cell.oldValue ?? '')}
                          </span>
                        </div>
                        <div className="flex-1 bg-[#f0fff4] border border-teal-100 rounded px-1 min-h-[1.25rem] flex items-center justify-center">
                           <span className="text-teal-700 font-bold text-[9px] leading-tight text-center">
                             {String(cell.newValue ?? '')}
                           </span>
                        </div>
                      </div>
                    ) : cell.type === 'added' ? (
                      <span className="text-teal-800 font-bold">
                        {String(cell.newValue ?? '')}
                      </span>
                    ) : cell.type === 'removed' ? (
                      <span className="text-red-700 font-medium">
                        {String(cell.oldValue ?? '')}
                      </span>
                    ) : (
                      <span className={cn(
                        "text-slate-700 leading-tight block",
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

      {/* Floating Toolbar for Count */}
      <div className="sticky bottom-0 bg-slate-900 text-white px-6 py-2.5 flex items-center justify-between z-40 text-[10px] font-bold uppercase tracking-widest rounded-b-xl">
        <div className="flex items-center gap-8">
           <span className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
             {sheet.rows.filter(r => r.type === 'added').length} Added
           </span>
           <span className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
             {sheet.rows.filter(r => r.type === 'removed').length} Removed
           </span>
           <span className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
             {sheet.rows.filter(r => r.type === 'modified').length} Modified
           </span>
        </div>
        <div className="text-slate-400 flex items-center gap-2">
           <RefreshCw className="w-3 h-3" />
           Total Differences: {sheet.rows.length}
        </div>
      </div>
    </div>
  );
};
