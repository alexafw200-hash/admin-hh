# System Architecture

## Core Flow
1. **User Input:** A PDF file is selected via Drag & Drop or the File Picker (`Dropzone.tsx`).
2. **Processing:** 
   - `App.tsx` instantiates `PdfEngine` and passes the file buffer.
   - `pdfjs-dist` worker parses the document.
   - For each page, the engine renders a Canvas representing the visual layout.
   - Concurrently, the engine extracts text items (`getTextContent`), including string value, X/Y coordinates, width, height, and font family.
3. **Rendering:** 
   - The UI updates with real-time logs in the `LogViewer`.
   - `Exporter.generateHtml` combines the canvas images and text items into an HTML structure.
4. **Output:** The user can preview the generated HTML in an iframe/container, and export it as an HTML file or ZIP archive.

## Constraints
- **In-Browser Only:** No backend server is used. All processing happens on the client side using Web Workers (via `pdfjs-dist`).
- **Memory Management:** Large PDFs may consume significant memory due to multiple Canvas contexts and Base64 image strings.
