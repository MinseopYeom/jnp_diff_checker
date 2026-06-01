import React from 'react';
import { SheetDiff, CellDiff } from '../types';
import { cn } from '../lib/utils';
import { ArrowRight, RefreshCw } from 'lucide-react';

interface DiffTableProps {
  sheet: SheetDiff;
  activeTab: 'all' | 'matched' | 'modified' | 'removed' | 'added';
  onTabChange: (tab: 'all' | 'matched' | 'modified' | 'removed' | 'added') => void;
}

export const DiffTable: React.FC<DiffTableProps> = ({ sheet, activeTab, onTabChange }) => {
  const tabCounts = React.useMemo(() => {
    const rows = sheet.rows;
    return {
      all: rows.length,
      matched: rows.filter(r => r.type === 'unchanged' || r.type === 'modified').length,
      modified: rows.filter(r => r.type === 'modified').length,
      removed: rows.filter(r => r.type === 'removed').length,
      added: rows.filter(r => r.type === 'added').length,
    };
  }, [sheet.rows]);

  const displayRows = React.useMemo(() => {
    switch (activeTab) {
      case 'matched':
        return sheet.rows.filter(r => r.type === 'unchanged' || r.type === 'modified');
      case 'modified':
        return sheet.rows.filter(r => r.type === 'modified');
      case 'removed':
        return sheet.rows.filter(r => r.type === 'removed');
      case 'added':
        return sheet.rows.filter(r => r.type === 'added');
      case 'all':
      default:
        return sheet.rows;
    }
  }, [sheet.rows, activeTab]);

  const tabs = [
    { id: 'all', label: '전체 결과', count: tabCounts.all, color: 'text-slate-600 bg-slate-100 border-slate-200' },
    { id: 'matched', label: '매칭 성공', count: tabCounts.matched, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { id: 'modified', label: '값 변경됨', count: tabCounts.modified, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { id: 'removed', label: '원본에만 존재 (삭제)', count: tabCounts.removed, color: 'text-red-600 bg-red-50 border-red-100' },
    { id: 'added', label: '수정본에만 존재 (추가)', count: tabCounts.added, color: 'text-teal-600 bg-teal-50 border-teal-100' },
  ] as const;

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
      {/* Interactive Tabs Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer border",
                  isActive
                    ? "bg-white text-slate-900 border-slate-300 shadow-sm ring-1 ring-slate-200"
                    : "bg-transparent text-slate-500 border-transparent hover:bg-slate-100/70 hover:text-slate-700"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  "px-2 py-0.5 text-[10px] font-black rounded-md leading-none border tabular-nums",
                  tab.color
                )}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

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
                        <span className="text-slate-700 leading-tight block px-1">
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
      <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between z-20 text-[10px] font-bold uppercase tracking-widest shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-8">
           <span className="flex items-center gap-2 text-slate-400">
             <div className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-[0_0_8px_rgba(156,163,175,0.6)]" />
             {sheet.rows.filter(r => r.type === 'unchanged').length} 동일 (Identical)
           </span>
           <span className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
             {tabCounts.modified} 값 변경 (Modified)
           </span>
           <span className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
             {tabCounts.removed} 원본 전용 (Only File 1)
           </span>
           <span className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
             {tabCounts.added} 수정본 전용 (Only File 2)
           </span>
        </div>
        <div className="text-slate-400 flex items-center gap-3">
           <RefreshCw className="w-3.5 h-3.5 animate-pulse" />
           <span className="text-slate-200">전체 결과: {sheet.rows.length}행</span>
        </div>
      </div>
    </div>
  );
};
