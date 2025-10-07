"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentProcessor = void 0;
const tesseract_js_1 = require("tesseract.js");
const mammoth = __importStar(require("mammoth"));
const XLSX = __importStar(require("xlsx"));
const csv_parse_1 = require("csv-parse");
const sharp_1 = __importDefault(require("sharp"));
const pdf_lib_1 = require("pdf-lib");
class DocumentProcessor {
    ocrWorker;
    async initializeOCR(language = "eng") {
        this.ocrWorker = await (0, tesseract_js_1.createWorker)(language);
    }
    async terminateOCR() {
        if (this.ocrWorker) {
            await this.ocrWorker.terminate();
            this.ocrWorker = undefined;
        }
    }
    async extractText(document, options) {
        switch (document.format) {
            case "pdf":
                return this.extractTextFromPDF(document.content);
            case "docx":
                return this.extractTextFromWord(document.content);
            case "txt":
                return document.content?.toString() || "";
            case "html":
                return this.extractTextFromHTML(document.content);
            case "png":
            case "jpg":
                if (options?.ocr) {
                    const result = await this.performOCR(document.content, options);
                    return result.text;
                }
                throw new Error("OCR must be enabled for image text extraction");
            default:
                throw new Error(`Text extraction not supported for format: ${document.format}`);
        }
    }
    async extractTextFromPDF(buffer) {
        const pdfDoc = await pdf_lib_1.PDFDocument.load(buffer);
        const pages = pdfDoc.getPages();
        let text = "";
        // Note: pdf-lib doesn't have native text extraction
        // This is a placeholder - you'd need a library like pdf-parse for actual text extraction
        pages.forEach((page) => {
            // Text extraction would go here
            // For now, returning page count info
            text += `[Page ${pages.indexOf(page) + 1}]\n`;
        });
        return text;
    }
    async extractTextFromWord(buffer) {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    }
    extractTextFromHTML(html) {
        // Simple HTML tag removal
        return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }
    async extractTables(document) {
        switch (document.format) {
            case "xlsx":
                return this.extractTablesFromExcel(document.content);
            case "csv":
                return this.extractTablesFromCSV(document.content);
            default:
                throw new Error(`Table extraction not supported for format: ${document.format}`);
        }
    }
    async extractTablesFromExcel(buffer) {
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const tables = [];
        workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (jsonData.length > 0) {
                const headers = jsonData[0].map(String);
                const rows = jsonData.slice(1);
                tables.push({
                    headers,
                    rows,
                });
            }
        });
        return tables;
    }
    async extractTablesFromCSV(content) {
        return new Promise((resolve, reject) => {
            const input = typeof content === "string" ? content : content.toString();
            (0, csv_parse_1.parse)(input, {
                columns: false,
                skip_empty_lines: true,
            }, (err, records) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (records.length > 0) {
                    const headers = records[0].map(String);
                    const rows = records.slice(1);
                    resolve([{
                            headers,
                            rows,
                        }]);
                }
                else {
                    resolve([]);
                }
            });
        });
    }
    async extractMetadata(document) {
        switch (document.format) {
            case "pdf":
                return this.extractPDFMetadata(document.content);
            case "jpg":
            case "png":
                return this.extractImageMetadata(document.content);
            default:
                return {
                    title: document.name,
                    creationDate: document.createdAt,
                    modificationDate: document.updatedAt,
                };
        }
    }
    async extractPDFMetadata(buffer) {
        const pdfDoc = await pdf_lib_1.PDFDocument.load(buffer);
        return {
            title: pdfDoc.getTitle(),
            author: pdfDoc.getAuthor(),
            subject: pdfDoc.getSubject(),
            keywords: pdfDoc.getKeywords()?.split(",").map(k => k.trim()),
            creator: pdfDoc.getCreator(),
            producer: pdfDoc.getProducer(),
            creationDate: pdfDoc.getCreationDate(),
            modificationDate: pdfDoc.getModificationDate(),
            pageCount: pdfDoc.getPageCount(),
        };
    }
    async extractImageMetadata(buffer) {
        const metadata = await (0, sharp_1.default)(buffer).metadata();
        return {
            custom: {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                space: metadata.space,
                channels: metadata.channels,
                depth: metadata.depth,
                density: metadata.density,
                hasAlpha: metadata.hasAlpha,
            },
        };
    }
    async performOCR(image, options) {
        if (!this.ocrWorker) {
            await this.initializeOCR(options?.language || "eng");
        }
        const result = await this.ocrWorker.recognize(image);
        const blocks = result.data.blocks.map(block => ({
            text: block.text,
            confidence: block.confidence,
            bbox: {
                x: block.bbox.x0,
                y: block.bbox.y0,
                width: block.bbox.x1 - block.bbox.x0,
                height: block.bbox.y1 - block.bbox.y0,
            },
            words: block.words?.map(word => ({
                text: word.text,
                confidence: word.confidence,
                bbox: {
                    x: word.bbox.x0,
                    y: word.bbox.y0,
                    width: word.bbox.x1 - word.bbox.x0,
                    height: word.bbox.y1 - word.bbox.y0,
                },
            })),
        }));
        return {
            text: result.data.text,
            confidence: result.data.confidence,
            language: options?.language || "eng",
            blocks,
        };
    }
    async convertDocument(document, targetFormat) {
        // Handle same format
        if (document.format === targetFormat) {
            return document.content;
        }
        // Text to other formats
        if (document.format === "txt") {
            const text = document.content?.toString() || "";
            switch (targetFormat) {
                case "html":
                    return Buffer.from(`<!DOCTYPE html>
<html>
<head><title>${document.name}</title></head>
<body><pre>${text}</pre></body>
</html>`);
                case "pdf":
                    // Would use PDF generator here
                    throw new Error("Text to PDF conversion requires PDF generator");
                default:
                    throw new Error(`Conversion from ${document.format} to ${targetFormat} not supported`);
            }
        }
        // HTML to other formats
        if (document.format === "html") {
            switch (targetFormat) {
                case "txt":
                    return Buffer.from(this.extractTextFromHTML(document.content));
                case "pdf":
                    // Would use Puppeteer or similar here
                    throw new Error("HTML to PDF conversion requires Puppeteer");
                default:
                    throw new Error(`Conversion from ${document.format} to ${targetFormat} not supported`);
            }
        }
        // Image format conversions
        if (["png", "jpg"].includes(document.format) && ["png", "jpg"].includes(targetFormat)) {
            return this.convertImage(document.content, targetFormat);
        }
        throw new Error(`Conversion from ${document.format} to ${targetFormat} not supported`);
    }
    async convertImage(buffer, format) {
        const converter = (0, sharp_1.default)(buffer);
        if (format === "png") {
            return converter.png().toBuffer();
        }
        else {
            return converter.jpeg({ quality: 90 }).toBuffer();
        }
    }
    async compressImage(buffer, options) {
        let converter = (0, sharp_1.default)(buffer);
        if (options?.width || options?.height) {
            converter = converter.resize(options.width, options.height);
        }
        const metadata = await converter.metadata();
        if (metadata.format === "jpeg") {
            return converter.jpeg({ quality: options?.quality || 80 }).toBuffer();
        }
        else if (metadata.format === "png") {
            return converter.png({ compressionLevel: 9 }).toBuffer();
        }
        return converter.toBuffer();
    }
    async splitPDF(buffer) {
        const pdfDoc = await pdf_lib_1.PDFDocument.load(buffer);
        const pageCount = pdfDoc.getPageCount();
        const pages = [];
        for (let i = 0; i < pageCount; i++) {
            const newPdf = await pdf_lib_1.PDFDocument.create();
            const [page] = await newPdf.copyPages(pdfDoc, [i]);
            newPdf.addPage(page);
            pages.push(Buffer.from(await newPdf.save()));
        }
        return pages;
    }
    async rotatePDF(buffer, degrees) {
        const pdfDoc = await pdf_lib_1.PDFDocument.load(buffer);
        const pages = pdfDoc.getPages();
        pages.forEach(page => {
            page.setRotation({ angle: degrees, type: "degrees" });
        });
        return Buffer.from(await pdfDoc.save());
    }
    async addPasswordToPDF(buffer, userPassword, ownerPassword) {
        const pdfDoc = await pdf_lib_1.PDFDocument.load(buffer);
        // Note: pdf-lib doesn't support encryption directly
        // You would need a library like HummusJS or qpdf for this
        // This is a placeholder
        return Buffer.from(await pdfDoc.save());
    }
    async removePasswordFromPDF(buffer, password) {
        // Would need to use a library that supports encrypted PDFs
        // This is a placeholder
        const pdfDoc = await pdf_lib_1.PDFDocument.load(buffer, { password });
        return Buffer.from(await pdfDoc.save());
    }
}
exports.DocumentProcessor = DocumentProcessor;
