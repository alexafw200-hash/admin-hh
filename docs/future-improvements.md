# Future Improvements

While PDF2HTML Studio provides a strong foundation for in-browser PDF conversion, there are several areas for potential enhancement:

## 1. Advanced Layout Recognition
- Group adjacent text items into distinct paragraph blocks (`<p>`).
- Detect table structures (borders, alignments) and output semantic `<table>` tags.
- Identify headings (`<h1>`, `<h2>`) based on relative font sizes and weights.

## 2. Resource Extraction
- Extract original embedded fonts (WOFF/TTF) and include them via `@font-face` in the CSS, rather than relying on system fallback fonts.
- Extract vector paths (lines, curves) and convert them to inline SVG elements.
- Extract individual images instead of snapshotting the entire page via Canvas.

## 3. Performance & Scalability
- Implement Web Workers for the HTML generation phase to prevent UI freezing on massive documents.
- Add pagination or virtualization in the preview pane so only the visible pages are rendered in the DOM.

## 4. Accessibility
- Ensure the generated HTML Mode output maintains logical reading order for screen readers.
- Generate `alt` tags for extracted images using an on-device AI model.
