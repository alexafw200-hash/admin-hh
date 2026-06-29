import React, { useEffect, useRef } from "react";

interface LogViewerProps {
  logs: string[];
}

export function LogViewer({ logs }: LogViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-40 border-t border-slate-800 bg-black flex flex-col shrink-0">
      <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Output Console
        </span>
        <span className="text-[10px] text-green-500 font-mono">
          ● Rendering Service Active
        </span>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 p-4 font-mono text-[11px] text-slate-400 overflow-y-auto leading-relaxed space-y-1"
      >
        {logs.length === 0 ? (
          <div className="text-slate-600">Waiting for input...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex gap-4">
              <span className="text-slate-600 shrink-0">
                [{new Date().toLocaleTimeString("en-US", { hour12: false })}]
              </span>
              <span className="text-slate-300">{log}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
