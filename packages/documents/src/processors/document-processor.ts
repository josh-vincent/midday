import { createWorker, Worker } from "tesseract.js";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { parse } from "csv-parse";
import { stringify } from "csv-stringify";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import type { 
  Document,
  ProcessingOptions,
  OcrResult,
  OcrBlock,
  OcrPage,
  DocumentMetadata,
  TableData
} from "../types/document";

export class DocumentProcessor {
  private ocrWorker?: Worker;

  async initializeOCR(language = "eng"): Promise<void> {
    this.ocrWorker = await createWorker(language);
  }

  async terminateOCR(): Promise<void> {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      this.ocrWorker = undefined;
    }
  }

  async extractText(document: Document, options?: ProcessingOptions): Promise<string> {
    switch (document.format) {
      case "pdf":
        return this.extractTextFromPDF(document.content as Buffer);
      case "docx":
        return this.extractTextFromWord(document.content as Buffer);
      case "txt":
        return document.content?.toString() || "";
      case "html":
        return this.extractTextFromHTML(document.content as string);
      case "png":
      case "jpg":
        if (options?.ocr) {
          const result = await this.performOCR(document.content as Buffer, options);
          return result.text;
        }
        throw new Error("OCR must be enabled for image text extraction");
      default:
        throw new Error(`Text extraction not supported for format: ${document.format}`);
    }
  }

  async extractTextFromPDF(buffer: Buffer): Promise<string> {
    const pdfDoc = await PDFDocument.load(buffer);
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

  async extractTextFromWord(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  extractTextFromHTML(html: string): string {
    // Simple HTML tag removal
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  async extractTables(document: Document): Promise<TableData[]> {
    switch (document.format) {
      case "xlsx":
        return this.extractTablesFromExcel(document.content as Buffer);
      case "csv":
        return this.extractTablesFromCSV(document.content as string | Buffer);
      default:
        throw new Error(`Table extraction not supported for format: ${document.format}`);
    }
  }

  async extractTablesFromExcel(buffer: Buffer): Promise<TableData[]> {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const tables: TableData[] = [];

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
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

  async extractTablesFromCSV(content: string | Buffer): Promise<TableData[]> {
    return new Promise((resolve, reject) => {
      const input = typeof content === "string" ? content : content.toString();
      
      parse(input, {
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
        } else {
          resolve([]);
        }
      });
    });
  }

  async extractMetadata(document: Document): Promise<DocumentMetadata> {
    switch (document.format) {
      case "pdf":
        return this.extractPDFMetadata(document.content as Buffer);
      case "jpg":
      case "png":
        return this.extractImageMetadata(document.content as Buffer);
      default:
        return {
          title: document.name,
          creationDate: document.createdAt,
          modificationDate: document.updatedAt,
        };
    }
  }

  async extractPDFMetadata(buffer: Buffer): Promise<DocumentMetadata> {
    const pdfDoc = await PDFDocument.load(buffer);
    
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

  async extractImageMetadata(buffer: Buffer): Promise<DocumentMetadata> {
    const metadata = await sharp(buffer).metadata();
    
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

  async performOCR(image: Buffer, options?: ProcessingOptions): Promise<OcrResult> {
    if (!this.ocrWorker) {
      await this.initializeOCR(options?.language || "eng");
    }

    const result = await this.ocrWorker!.recognize(image);
    
    const blocks: OcrBlock[] = result.data.blocks.map(block => ({
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

  async convertDocument(
    document: Document,
    targetFormat: "pdf" | "docx" | "txt" | "html" | "png" | "jpg"
  ): Promise<Buffer> {
    // Handle same format
    if (document.format === targetFormat) {
      return document.content as Buffer;
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
          return Buffer.from(this.extractTextFromHTML(document.content as string));
        case "pdf":
          // Would use Puppeteer or similar here
          throw new Error("HTML to PDF conversion requires Puppeteer");
        default:
          throw new Error(`Conversion from ${document.format} to ${targetFormat} not supported`);
      }
    }

    // Image format conversions
    if (["png", "jpg"].includes(document.format) && ["png", "jpg"].includes(targetFormat)) {
      return this.convertImage(document.content as Buffer, targetFormat as "png" | "jpg");
    }

    throw new Error(`Conversion from ${document.format} to ${targetFormat} not supported`);
  }

  async convertImage(buffer: Buffer, format: "png" | "jpg"): Promise<Buffer> {
    const converter = sharp(buffer);
    
    if (format === "png") {
      return converter.png().toBuffer();
    } else {
      return converter.jpeg({ quality: 90 }).toBuffer();
    }
  }

  async compressImage(buffer: Buffer, options?: { quality?: number; width?: number; height?: number }): Promise<Buffer> {
    let converter = sharp(buffer);
    
    if (options?.width || options?.height) {
      converter = converter.resize(options.width, options.height);
    }
    
    const metadata = await converter.metadata();
    
    if (metadata.format === "jpeg") {
      return converter.jpeg({ quality: options?.quality || 80 }).toBuffer();
    } else if (metadata.format === "png") {
      return converter.png({ compressionLevel: 9 }).toBuffer();
    }
    
    return converter.toBuffer();
  }

  async splitPDF(buffer: Buffer): Promise<Buffer[]> {
    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();
    const pages: Buffer[] = [];

    for (let i = 0; i < pageCount; i++) {
      const newPdf = await PDFDocument.create();
      const [page] = await newPdf.copyPages(pdfDoc, [i]);
      newPdf.addPage(page);
      pages.push(Buffer.from(await newPdf.save()));
    }

    return pages;
  }

  async rotatePDF(buffer: Buffer, degrees: 90 | 180 | 270): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(buffer);
    const pages = pdfDoc.getPages();

    pages.forEach(page => {
      page.setRotation({ angle: degrees, type: "degrees" } as any);
    });

    return Buffer.from(await pdfDoc.save());
  }

  async addPasswordToPDF(buffer: Buffer, userPassword: string, ownerPassword?: string): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(buffer);
    
    // Note: pdf-lib doesn't support encryption directly
    // You would need a library like HummusJS or qpdf for this
    // This is a placeholder
    
    return Buffer.from(await pdfDoc.save());
  }

  async removePasswordFromPDF(buffer: Buffer, password: string): Promise<Buffer> {
    // Would need to use a library that supports encrypted PDFs
    // This is a placeholder
    const pdfDoc = await PDFDocument.load(buffer, { password } as any);
    return Buffer.from(await pdfDoc.save());
  }
}