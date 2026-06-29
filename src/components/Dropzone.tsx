import { UploadCloud } from "lucide-react";
import React, { useCallback, useState } from "react";
import { cn } from "../lib/utils";

interface DropzoneProps {
  onFileSelect: (file: File) => void;
}

export function Dropzone({ onFileSelect }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type === "application/pdf") {
          onFileSelect(file);
        } else {
          alert("Please upload a PDF file.");
        }
      }
    },
    [onFileSelect],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        if (file.type === "application/pdf") {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect],
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl transition-colors duration-200 cursor-pointer",
        "bg-slate-900 border-slate-800",
        isDragging ? "border-blue-500 bg-blue-500/10" : "hover:bg-slate-800/50",
      )}
      onClick={() => document.getElementById("file-upload")?.click()}
    >
      <UploadCloud className="w-8 h-8 mb-4 text-slate-500" />
      <p className="mb-2 text-xs text-slate-400">
        <span className="font-semibold text-blue-400">Click to upload</span> or
        drag and drop
      </p>
      <p className="text-[10px] text-slate-500">PDF files only</p>
      <input
        id="file-upload"
        type="file"
        className="hidden"
        accept="application/pdf"
        onChange={handleFileInput}
      />
    </div>
  );
}
