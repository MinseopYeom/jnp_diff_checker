import React, { useCallback, useState } from 'react';
import { Upload, FileText, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface FileUploadProps {
  label: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ label, file, onFileSelect, className }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2 h-full w-full", className)}>
      <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">{label}</label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex-1 flex flex-col items-center justify-center px-6 py-12 border-2 border-dashed rounded-3xl transition-all cursor-pointer overflow-hidden group",
          isDragging 
            ? "border-blue-500 bg-blue-50/50 scale-[0.99] ring-4 ring-blue-50" 
            : "border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50/50",
          file && "border-teal-500 bg-teal-50/30"
        )}
      >
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        
        <div className="flex flex-col items-center text-center relative z-0">
          {file ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-teal-600" />
              </div>
              <span className="text-base font-bold text-slate-800 truncate max-w-[250px] mb-1">
                {file.name}
              </span>
              <p className="text-xs text-slate-400 mb-4">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onFileSelect(null);
                }}
                className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-full transition-colors flex items-center gap-1.5 border border-red-100"
              >
                <XCircle className="w-4 h-4" /> Remove File
              </button>
            </motion.div>
          ) : (
            <>
              <div className={cn(
                "w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-all duration-300",
                isDragging ? "bg-blue-100 scale-110" : "bg-slate-50 group-hover:bg-blue-50 group-hover:scale-105"
              )}>
                <Upload className={cn(
                  "w-10 h-10 transition-colors duration-300",
                  isDragging ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500"
                )} />
              </div>
              <p className="text-lg font-bold text-slate-700 mb-1">
                {isDragging ? "Drop it here!" : "Click to upload"}
              </p>
              <p className="text-sm text-slate-400">
                or drag and drop your file here
              </p>
              <div className="mt-8 flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-md uppercase">XLSX</span>
                <span className="px-3 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-md uppercase">XLS</span>
                <span className="px-3 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-md uppercase">CSV</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
