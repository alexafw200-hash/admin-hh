import { FileType, Moon, Sun } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Dropzone } from "./components/Dropzone";
import { LogViewer } from "./components/LogViewer";
import { Preview } from "./components/Preview";
import { Exporter, RenderMode } from "./lib/exporter";
import { PdfEngine, PdfPageData } from "./lib/pdf-engine";
import { cn } from "./lib/utils";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [pdfData, setPdfData] = useState<PdfPageData[]>([]);
  const [renderMode, setRenderMode] = useState<RenderMode>("hybrid");
  const [generatedHtml, setGeneratedHtml] = useState<string>("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setLogs([]);
    setPdfData([]);
    setGeneratedHtml("");

    try {
      addLog(`Initializing engine...`);
      const engine = new PdfEngine(addLog);

      const numPages = await engine.loadPdf(file);
      const pages: PdfPageData[] = [];

      for (let i = 1; i <= numPages; i++) {
        const pageData = await engine.processPage(i);
        pages.push(pageData);
      }

      setPdfData(pages);

      // Generate initial HTML
      addLog(`Generating output HTML...`);
      const html = Exporter.generateHtml(pages, renderMode);
      setGeneratedHtml(html);

      addLog(`Conversion complete!`);
    } catch (err: any) {
      addLog(`ERROR: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-generate HTML when mode changes
  useEffect(() => {
    if (pdfData.length > 0) {
      setGeneratedHtml(Exporter.generateHtml(pdfData, renderMode));
    }
  }, [renderMode, pdfData]);

  const downloadHtml = () => {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "output.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadZip = async () => {
    if (!generatedHtml) return;
    try {
      addLog("Generating ZIP file...");
      const blob = await Exporter.generateZip(generatedHtml);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pdf-export.zip";
      a.click();
      URL.revokeObjectURL(url);
      addLog("ZIP download started.");
    } catch (err: any) {
      addLog(`ZIP ERROR: ${err.message}`);
    }
  };

  return (
    <div className="h-screen w-full bg-[#020617] text-slate-300 flex flex-col overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/60 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            P
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            PDF2HTML{" "}
            <span className="text-blue-400 font-light italic">Studio</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-800 rounded-lg p-1 text-xs font-medium">
            <button
              onClick={() => setTheme("dark")}
              className={cn(
                "px-3 py-1 rounded-md shadow-sm transition-colors",
                theme === "dark" ? "bg-slate-700 text-white" : "text-slate-400",
              )}
            >
              Dark
            </button>
            <button
              onClick={() => setTheme("light")}
              className={cn(
                "px-3 py-1 rounded-md transition-colors",
                theme === "light"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400",
              )}
            >
              Light
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Upload & Structure */}
        <aside className="w-60 border-r border-slate-800 bg-slate-950/50 flex flex-col shrink-0">
          <div className="p-4 flex-1 overflow-y-auto">
            <h2 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4 px-2">
              Upload Source
            </h2>
            <Dropzone onFileSelect={processFile} />

            {isProcessing && (
              <div className="mt-4 flex items-center justify-center space-x-2 text-blue-500">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium animate-pulse">
                  Processing PDF...
                </span>
              </div>
            )}

            {pdfData.length > 0 && (
              <>
                <h2 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-8 mb-4 px-2">
                  Project Structure
                </h2>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2 p-2 bg-slate-800/50 text-blue-300 font-medium cursor-pointer border-l-2 border-blue-500">
                    <span className="text-blue-400">📄</span> output.html
                  </li>
                  <li className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-800/50 cursor-pointer">
                    <span className="text-slate-500 opacity-50">📄</span>{" "}
                    README.txt
                  </li>
                </ul>
              </>
            )}
          </div>
        </aside>

        {/* Center Panel: Preview & Console */}
        <main className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
          {generatedHtml ? (
            <Preview htmlContent={generatedHtml} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0f1e] text-slate-500">
              <FileType className="w-16 h-16 mb-4 opacity-20" />
              <p>Upload a PDF to see the live preview.</p>
            </div>
          )}
          <LogViewer logs={logs} />
        </main>

        {/* Right Panel: Export Settings */}
        <aside className="w-72 border-l border-slate-800 bg-slate-950/50 p-6 flex flex-col gap-8 shrink-0">
          <section>
            <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-3 bg-blue-500"></span> Rendering Mode
            </h3>
            <div className="grid grid-cols-1 gap-2 font-medium">
              <label
                className={cn(
                  "flex items-center gap-3 p-2 border rounded-lg cursor-pointer transition-all",
                  renderMode === "html"
                    ? "bg-slate-900 border-slate-700"
                    : "border-slate-800 opacity-60 hover:opacity-100",
                )}
              >
                <input
                  type="radio"
                  name="mode"
                  className="accent-blue-500"
                  checked={renderMode === "html"}
                  onChange={() => setRenderMode("html")}
                />
                <span className="text-xs">Pure HTML5</span>
              </label>
              <label
                className={cn(
                  "flex items-center gap-3 p-2 border rounded-lg cursor-pointer transition-all",
                  renderMode === "canvas"
                    ? "bg-slate-900 border-slate-700"
                    : "border-slate-800 opacity-60 hover:opacity-100",
                )}
              >
                <input
                  type="radio"
                  name="mode"
                  className="accent-blue-500"
                  checked={renderMode === "canvas"}
                  onChange={() => setRenderMode("canvas")}
                />
                <span className="text-xs">Canvas Overlay</span>
              </label>
              <label
                className={cn(
                  "flex items-center gap-3 p-2 border rounded-lg cursor-pointer transition-all",
                  renderMode === "hybrid"
                    ? "bg-slate-900 border-slate-700"
                    : "border-slate-800 opacity-60 hover:opacity-100",
                )}
              >
                <input
                  type="radio"
                  name="mode"
                  className="accent-blue-500"
                  checked={renderMode === "hybrid"}
                  onChange={() => setRenderMode("hybrid")}
                />
                <span className="text-xs">Hybrid Precision</span>
              </label>
            </div>
          </section>

          <section className="flex-1">
            <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-3 bg-blue-500"></span> Export Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Embed CSS</span>
                <div className="w-8 h-4 bg-blue-600 rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Base64 Images</span>
                <div className="w-8 h-4 bg-blue-600 rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Layout Type</span>
                <span className="text-slate-300 font-mono">Absolute</span>
              </div>
            </div>
          </section>

          <div className="mt-auto flex flex-col gap-2">
            <button
              onClick={downloadHtml}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-white transition-all border border-slate-700"
            >
              Download Single HTML
            </button>
            <button
              onClick={downloadZip}
              className="w-full py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition-all"
            >
              Export Full ZIP
            </button>
          </div>
        </aside>
      </div>

      <footer className="h-8 border-t border-slate-800 bg-slate-900 px-6 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
        <div className="flex items-center gap-4">
          <span>Version 1.0.4-stable</span>
          <span className="text-slate-700">|</span>
          <span>PDF.js Integration</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Ready
          </span>
          <span className="flex items-center gap-1.5">JSZip</span>
        </div>
      </footer>
    </div>
  );
}
