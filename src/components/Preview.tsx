import { ZoomIn, ZoomOut } from "lucide-react";
import React, { useState } from "react";
import { cn } from "../lib/utils";

interface PreviewProps {
  htmlContent: string;
}

export function Preview({ htmlContent }: PreviewProps) {
  const [zoom, setZoom] = useState(1);

  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.25));

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden w-full">
      {/* Toolbar */}
      <div className="h-12 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/20 shrink-0">
        <div className="flex gap-6 text-xs font-medium text-slate-400 h-full">
          <span className="text-blue-400 border-b-2 border-blue-400 py-3.5 h-12 flex items-center">
            Live Preview
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800 px-2 py-1 rounded text-[11px] font-mono">
            <button
              onClick={zoomOut}
              className="text-slate-500 hover:text-slate-300"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-slate-200 w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="text-slate-500 hover:text-slate-300"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Output Area */}
      <div className="flex-1 overflow-auto p-8 bg-[#0a0f1e] flex justify-center items-start relative">
        <div
          className="transition-transform origin-top relative shadow-2xl"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Render HTML Content in a sandboxed iframe or directly. We will use a shadow DOM or direct dangerouslySetInnerHTML */}
          <div
            className="preview-container"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>
    </div>
  );
}
