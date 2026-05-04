import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Type, Table as TableIcon, Maximize2, Minimize2 } from 'lucide-react';

interface FilePreviewProps {
  fileName: string;
  sheetNames: string[];
  selectedSheet: string;
  onSheetChange: (name: string) => void;
  headerRow: number;
  onHeaderRowChange: (row: number) => void;
  data: any[][];
  className?: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  fileName,
  sheetNames,
  selectedSheet,
  onSheetChange,
  headerRow,
  onHeaderRowChange,
  data,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine table dimensions
  const maxCols = Math.max(...data.map(row => row.length), 0);
  const colLetters = Array.from({ length: Math.max(maxCols, 10) }, (_, i) => 
    String.fromCharCode(65 + i)
  );

  return (
    <div className={cn("flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all duration-300", className, isExpanded ? "fixed inset-4 z-[100] shadow-2xl" : "")}>
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <TableIcon className="w-5 h-5 text-blue-600 shrink-0" />
          <span className="font-bold text-slate-700 truncate">{fileName}</span>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 hover:bg-slate-200 rounded-md text-slate-500 transition-colors"
          title={isExpanded ? "Collapse View" : "Expand View"}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      <div className={cn("relative overflow-auto bg-white custom-scrollbar", isExpanded ? "flex-1" : "max-h-[400px]")}>
        <table className="text-xs text-left border-collapse w-max min-w-full table-auto">
          <thead className="sticky top-0 z-20 bg-slate-50">
            <tr>
              <th className="w-12 border-b border-r border-slate-200 bg-slate-100 sticky left-0 z-30"></th>
              {colLetters.map(letter => (
                <th key={letter} className="px-3 py-2 border-b border-r border-slate-200 text-center font-medium text-slate-400 uppercase tracking-wider min-w-[120px]">
                  {letter}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.max(data.length, 20) }).map((_, rowIndex) => {
              const row = data[rowIndex] || [];
              const isHeader = rowIndex === headerRow;
              return (
                <tr key={rowIndex} className={cn(isHeader && "bg-blue-50/50")}>
                  <td className="sticky left-0 z-10 bg-slate-100 border-r border-b border-slate-200 text-center text-slate-400 font-mono">
                    {rowIndex + 1}
                  </td>
                  {colLetters.map((_, colIndex) => (
                    <td 
                      key={colIndex} 
                      className={cn(
                        "px-3 py-2 border-r border-b border-slate-100 h-10 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]",
                        isHeader && "font-bold text-blue-700 border-b-blue-200"
                      )}
                      title={String(row[colIndex] ?? '')}
                    >
                      {String(row[colIndex] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 border-t border-slate-200 p-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold uppercase text-slate-400">Sheet:</label>
          <select 
            value={selectedSheet}
            onChange={(e) => onSheetChange(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            {sheetNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
            <Type className="w-3 h-3" /> Header Row:
          </label>
          <input 
            type="number" 
            min="1" 
            max={data.length}
            value={isNaN(headerRow) ? '' : headerRow + 1}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              onHeaderRowChange(isNaN(val) ? 0 : Math.max(0, val - 1));
            }}
            className="w-16 text-xs bg-white border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
};
