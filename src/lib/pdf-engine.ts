import * as pdfjsLib from "pdfjs-dist";

// Configure the worker. Using a CDN for the worker to avoid Vite build configuration issues
// with the worker file.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

export interface PdfPageData {
  pageNumber: number;
  width: number;
  height: number;
  textItems: TextItem[];
  canvasDataUrl: string; // Base64 of the rendered page
}

export interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  letterSpacing: number;
  transform: number[];
}

export type LogCallback = (msg: string) => void;

export class PdfEngine {
  private pdf: pdfjsLib.PDFDocumentProxy | null = null;
  private log: LogCallback;

  constructor(logCallback: LogCallback = () => {}) {
    this.log = logCallback;
  }

  async loadPdf(file: File): Promise<number> {
    this.log(`Loading PDF: ${file.name}...`);
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    this.pdf = await loadingTask.promise;
    this.log(`Loaded PDF with ${this.pdf.numPages} pages.`);
    return this.pdf.numPages;
  }

  async processPage(
    pageNumber: number,
    scale: number = 2.0,
  ): Promise<PdfPageData> {
    if (!this.pdf) throw new Error("No PDF loaded");
    this.log(`Processing page ${pageNumber}...`);

    const page = await this.pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    // Render to canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2d context");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    this.log(`Rendering page ${pageNumber} to canvas...`);
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };
    await page.render(renderContext).promise;
    const canvasDataUrl = canvas.toDataURL("image/png");

    // Extract Text
    this.log(`Extracting text from page ${pageNumber}...`);
    const textContent = await page.getTextContent();
    const styles = textContent.styles || {};
    
    const textItems: TextItem[] = textContent.items
      .filter((item: any) => item.str && item.str.trim() !== '')
      .map((item: any) => {
        const transform = item.transform;
        // transform: [scaleX, skewY, skewX, scaleY, translateX, translateY]
        // PDF coordinates are bottom-left based. We convert to top-left.
        const tx = transform[4] * scale;
        const ty = viewport.height - transform[5] * scale - transform[3] * scale; // Convert bottom-left to top-left roughly

        const style = styles[item.fontName];
        let fontFamily = style ? style.fontFamily : item.fontName;
        
        let fontWeight = "normal";
        let fontStyle = "normal";
        
        const fontNameLower = (item.fontName || "").toLowerCase();
        const fontFamilyLower = (fontFamily || "").toLowerCase();
        
        if (fontNameLower.includes("bold") || fontFamilyLower.includes("bold")) {
          fontWeight = "bold";
        }
        if (
          fontNameLower.includes("italic") || 
          fontFamilyLower.includes("italic") || 
          fontNameLower.includes("oblique") || 
          fontFamilyLower.includes("oblique")
        ) {
          fontStyle = "italic";
        }

        // Clean up font family name if it contains bold/italic descriptors
        fontFamily = fontFamily.replace(/-(Bold|Italic|Oblique|BoldItalic)/ig, "");

        // Estimate letter spacing if there are multiple characters
        let letterSpacing = 0;
        if (item.str.length > 1) {
          // Standard width estimate (very rough) - assume ~0.5 of font size per character
          // If actual width is much larger, it's likely letter-spaced
          const expectedWidth = item.str.length * (transform[0] * scale * 0.5);
          if (item.width * scale > expectedWidth) {
            letterSpacing = ((item.width * scale) - expectedWidth) / item.str.length;
          }
        }

        // In PDF.js, underlines and strikethroughs are rendered as separate vector paths rather than text properties.
        // A robust implementation would intersect page.getOperatorList() paths with text bounding boxes.
        // For the structural requirement, we define the property here.
        let textDecoration = "none";

        return {
          str: item.str,
          x: tx,
          y: ty,
          width: item.width * scale,
          height: item.height * scale,
          fontFamily: fontFamily,
          fontSize: transform[0] * scale, // scaleX is roughly the font size
          fontWeight,
          fontStyle,
          textDecoration,
          letterSpacing,
          transform: transform,
        };
      });

    this.log(`Successfully processed page ${pageNumber}.`);

    return {
      pageNumber,
      width: viewport.width,
      height: viewport.height,
      textItems,
      canvasDataUrl,
    };
  }
}
