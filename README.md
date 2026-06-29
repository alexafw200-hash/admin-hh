# PDF2HTML Studio

PDF2HTML Studio is a modern web application that converts PDF files into HTML while preserving the original layout as accurately as possible, running entirely inside the browser.

## Features

- **File Upload:** Drag and drop or file picker.
- **PDF Analysis:** Extracts text, positions, fonts, and renders canvas images.
- **Rendering Modes:**
  - **HTML Mode:** Absolute positioned text on a white canvas.
  - **Canvas Mode:** High-fidelity image render of the PDF page.
  - **Hybrid Mode:** High-fidelity canvas background with transparent, selectable HTML text layered on top.
- **User Interface:** Modern glassmorphism design, dark/light mode, and real-time conversion logs.
- **Export System:** Download as a single `.html` file or a `.zip` archive containing the output.

## Technology Stack

- React 19 (via Vite)
- Tailwind CSS 4
- `pdfjs-dist` for PDF parsing and rendering
- `jszip` for ZIP exports
- `lucide-react` for icons

## Installation & Usage

1. Clone or download the repository.
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Open the application in your browser.
5. Drag and drop a PDF file into the upload zone to see the extraction process.

## Architecture

- **`src/lib/pdf-engine.ts`**: Contains the `PdfEngine` class wrapper around `pdf.js`. It handles loading the document, rendering pages to a 2D canvas, and extracting `getTextContent()` for absolute text positioning.
- **`src/lib/exporter.ts`**: Generates the final HTML string based on the selected rendering mode. Also handles ZIP generation via JSZip.
- **`src/App.tsx`**: Main application state, theme management, and layout structure.
- **`src/components/`**: Modular UI components (Dropzone, Preview, LogViewer).

## Future Improvements

- Extract vector graphics and output them as inline SVG.
- Extract images directly instead of rendering the whole page to a canvas.
- Improved font matching and custom font embedding.
- Batch processing multiple PDFs at once.
- Pagination controls for very large PDFs to improve performance.
