import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Using standard import for pdfjs-dist in Node.js
import * as pdfjsLib from 'pdfjs-dist';

// Resolve directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Setup worker path for pdfjs in Node.js
pdfjsLib.GlobalWorkerOptions.workerSrc = import.meta.resolve('pdfjs-dist/build/pdf.worker.mjs');

const app = express();
// 1. التوافق التام مع منصة Render وقراءة المنفذ ديناميكياً
const PORT = process.env.PORT || 3000;

// Setup multer for handling file uploads (storing temporarily)
const upload = multer({ dest: 'uploads/' });

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

app.post('/upload', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('لم يتم رفع أي ملف.');
        }

        console.log(`Processing file: ${req.file.originalname}`);

        // Read file into a buffer and parse with pdfjs
        const buffer = fs.readFileSync(req.file.path);
        const data = new Uint8Array(buffer);
        
        const loadingTask = pdfjsLib.getDocument({ 
            data: data, 
            // Disable font face evaluation on backend since we don't need rendering
            disableFontFace: true,
            standardFontDataUrl: path.join(__dirname, 'node_modules/pdfjs-dist/standard_fonts/')
        });
        
        const pdfDocument = await loadingTask.promise;
        
        // 2. شرط المخرج النهائي (ملف واحد فقط)
        // Generating single HTML file with embedded CSS and JS
        let htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF2HTML - نتيجة التحويل</title>
    <style>
        /* التنسيقات مدمجة بالكامل داخل الملف */
        body {
            background-color: #f3f4f6;
            margin: 0;
            padding: 40px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .header-bar {
            background-color: #1e293b;
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: space-between;
            width: 100%;
            max-width: 800px;
            align-items: center;
        }
        .header-bar button {
            background-color: #3b82f6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
        }
        .header-bar button:hover {
            background-color: #2563eb;
        }
        .pdf-page {
            position: relative;
            background-color: white;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
            overflow: hidden;
        }
        .pdf-text {
            /* 3. الحفاظ الصارم على الهيكل (تموضع مطلق) */
            position: absolute;
            transform-origin: left bottom;
            white-space: pre;
            color: #000;
        }
        @media print {
            body { padding: 0; background-color: white; }
            .header-bar { display: none; }
            .pdf-page { box-shadow: none; margin-bottom: 0; page-break-after: always; }
        }
    </style>
</head>
<body>
    <div class="header-bar">
        <h2>تم التحويل بنجاح بواسطة السيرفر</h2>
        <button onclick="window.print()">طباعة / حفظ كـ PDF مجدداً</button>
    </div>
        `;

        const scale = 1.5; // Scale factor for better resolution

        // Loop through all pages to extract structure
        for (let i = 1; i <= pdfDocument.numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const viewport = page.getViewport({ scale: scale });
            
            htmlContent += `\n    <div class="pdf-page" style="width: ${viewport.width}px; height: ${viewport.height}px;">`;
            
            const textContent = await page.getTextContent();
            const styles = textContent.styles || {};
            
            for (const item of textContent.items) {
                if (!item.str || item.str.trim() === '') continue;
                
                const transform = item.transform;
                // PDF coordinates are bottom-left based. We convert to top-left.
                const x = transform[4] * scale;
                const y = viewport.height - (transform[5] * scale) - (transform[3] * scale);
                const fontSize = transform[0] * scale;
                
                // Get font details if available
                const style = styles[item.fontName];
                let fontFamily = style ? style.fontFamily : item.fontName || 'sans-serif';
                let fontWeight = "normal";
                let fontStyle = "normal";
                
                if (fontFamily.toLowerCase().includes("bold")) fontWeight = "bold";
                if (fontFamily.toLowerCase().includes("italic")) fontStyle = "italic";
                
                // Escape HTML characters
                const safeStr = item.str
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");
                
                htmlContent += `\n        <div class="pdf-text" style="left: ${x}px; top: ${y}px; font-size: ${fontSize}px; font-family: ${fontFamily}; font-weight: ${fontWeight}; font-style: ${fontStyle};">${safeStr}</div>`;
            }
            
            htmlContent += `\n    </div>`;
        }

        htmlContent += `
    <script>
        // سكريبت تفاعلي مدمج
        console.log('PDF rendered perfectly with absolute positions.');
        document.querySelectorAll('.pdf-text').forEach(el => {
            // إضافة تأثير بسيط عند التمرير بالماوس للمساعدة في التعرف على العناصر (اختياري)
            el.addEventListener('mouseenter', () => {
                el.style.outline = '1px solid rgba(59, 130, 246, 0.5)';
            });
            el.addEventListener('mouseleave', () => {
                el.style.outline = 'none';
            });
        });
    </script>
</body>
</html>
        `;

        // Clean up the uploaded temp file after processing
        fs.unlinkSync(req.file.path);
        
        // Send the single HTML file as attachment
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="converted_${Date.now()}.html"`);
        res.send(htmlContent);
        
    } catch (error) {
        console.error('Error processing PDF:', error);
        res.status(500).send('حدث خطأ أثناء معالجة الملف. الرجاء التأكد من أنه ملف PDF صالح.');
        
        // Attempt to clean up file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ السيرفر يعمل بنجاح على المنفذ ${PORT}`);
    console.log(`🚀 جاهز للعمل على Render!`);
});
