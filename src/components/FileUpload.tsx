import React, { useCallback, useState } from 'react';
import { Upload, FileText, XCircle } from 'lucide-react';
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
    <div className={cn("flex flex-col gap-2", className)}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex items-center justify-center h-32 px-4 py-6 border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden",
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400 bg-white",
          file && "border-green-500 bg-green-50"
        )}
      >
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center text-center">
          {file ? (
            <>
              <FileText className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-800 truncate max-w-[200px]">
                {file.name}
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onFileSelect(null);
                }}
                className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <XCircle className="w-3 h-3" /> Remove
              </button>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">Excel or CSV files</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
