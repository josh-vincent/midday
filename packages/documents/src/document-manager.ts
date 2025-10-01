import { PDFGenerator } from "./generators/pdf-generator";
import { DocumentProcessor } from "./processors/document-processor";
import type {
  Document,
  InvoiceData,
  ReportData,
  ProcessingOptions,
  GenerationOptions,
  DocumentFormat,
  OcrResult,
  TableData,
  DocumentMetadata,
  BarcodeOptions,
} from "./types/document";

export interface DocumentStorage {
  save(document: Document): Promise<string>;
  get(id: string): Promise<Document | null>;
  delete(id: string): Promise<void>;
  list(filters?: DocumentFilters): Promise<Document[]>;
  getUrl(id: string): Promise<string | null>;
}

export interface DocumentFilters {
  type?: string;
  format?: string;
  startDate?: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
  limit?: number;
  offset?: number;
}

export class DocumentManager {
  private generator: PDFGenerator;
  private processor: DocumentProcessor;
  private storage?: DocumentStorage;

  constructor(storage?: DocumentStorage) {
    this.generator = new PDFGenerator();
    this.processor = new DocumentProcessor();
    this.storage = storage;
  }

  // Generation methods
  async generateInvoice(data: InvoiceData, options?: GenerationOptions): Promise<Document> {
    const buffer = await this.generator.generateInvoice(data);
    
    const document: Document = {
      id: this.generateId(),
      name: `invoice-${data.invoiceNumber}.pdf`,
      type: "pdf",
      format: "pdf",
      size: buffer.length,
      content: buffer,
      metadata: {
        title: `Invoice ${data.invoiceNumber}`,
        subject: `Invoice for ${data.buyer.name}`,
        author: data.seller.name,
        creationDate: new Date(),
        custom: {
          invoiceNumber: data.invoiceNumber,
          buyerName: data.buyer.name,
          sellerName: data.seller.name,
          total: data.total,
          status: data.status,
        },
      },
      createdAt: new Date(),
    };

    if (this.storage) {
      const id = await this.storage.save(document);
      document.id = id;
    }

    return document;
  }

  async generateReport(data: ReportData, options?: GenerationOptions): Promise<Document> {
    const buffer = await this.generator.generateReport(data);
    
    const document: Document = {
      id: this.generateId(),
      name: `report-${data.title.toLowerCase().replace(/\s/g, "-")}.pdf`,
      type: "pdf",
      format: "pdf",
      size: buffer.length,
      content: buffer,
      metadata: {
        title: data.title,
        subject: data.subtitle,
        author: data.author,
        creationDate: new Date(),
      },
      createdAt: new Date(),
    };

    if (this.storage) {
      const id = await this.storage.save(document);
      document.id = id;
    }

    return document;
  }

  async generateQRCode(data: string, options?: BarcodeOptions): Promise<Document> {
    const buffer = await this.generator.generateQRCode(data, options);
    
    const document: Document = {
      id: this.generateId(),
      name: `qrcode-${Date.now()}.png`,
      type: "image",
      format: "png",
      size: buffer.length,
      content: buffer,
      metadata: {
        title: "QR Code",
        custom: {
          data,
          type: "qrcode",
        },
      },
      createdAt: new Date(),
    };

    if (this.storage) {
      const id = await this.storage.save(document);
      document.id = id;
    }

    return document;
  }

  async generateBarcode(data: string, options?: BarcodeOptions): Promise<Document> {
    const buffer = await this.generator.generateBarcode(data, options);
    
    const document: Document = {
      id: this.generateId(),
      name: `barcode-${Date.now()}.png`,
      type: "image",
      format: "png",
      size: buffer.length,
      content: buffer,
      metadata: {
        title: "Barcode",
        custom: {
          data,
          type: "barcode",
          format: options?.format || "CODE128",
        },
      },
      createdAt: new Date(),
    };

    if (this.storage) {
      const id = await this.storage.save(document);
      document.id = id;
    }

    return document;
  }

  // Processing methods
  async extractText(document: Document, options?: ProcessingOptions): Promise<string> {
    return this.processor.extractText(document, options);
  }

  async extractTables(document: Document): Promise<TableData[]> {
    return this.processor.extractTables(document);
  }

  async extractMetadata(document: Document): Promise<DocumentMetadata> {
    return this.processor.extractMetadata(document);
  }

  async performOCR(document: Document, options?: ProcessingOptions): Promise<OcrResult> {
    if (document.type !== "image") {
      throw new Error("OCR can only be performed on image documents");
    }

    return this.processor.performOCR(document.content as Buffer, options);
  }

  async convertDocument(
    document: Document,
    targetFormat: DocumentFormat
  ): Promise<Document> {
    const convertedBuffer = await this.processor.convertDocument(document, targetFormat);
    
    const convertedDocument: Document = {
      id: this.generateId(),
      name: document.name.replace(/\.[^.]+$/, `.${targetFormat}`),
      type: this.getDocumentType(targetFormat),
      format: targetFormat,
      size: convertedBuffer.length,
      content: convertedBuffer,
      metadata: {
        ...document.metadata,
        custom: {
          ...document.metadata?.custom,
          convertedFrom: document.format,
        },
      },
      createdAt: new Date(),
    };

    if (this.storage) {
      const id = await this.storage.save(convertedDocument);
      convertedDocument.id = id;
    }

    return convertedDocument;
  }

  // PDF operations
  async mergePDFs(documents: Document[]): Promise<Document> {
    const pdfBuffers = documents
      .filter(d => d.format === "pdf")
      .map(d => d.content as Buffer);

    if (pdfBuffers.length === 0) {
      throw new Error("No PDF documents to merge");
    }

    const mergedBuffer = await this.generator.mergePDFs(pdfBuffers);
    
    const mergedDocument: Document = {
      id: this.generateId(),
      name: `merged-${Date.now()}.pdf`,
      type: "pdf",
      format: "pdf",
      size: mergedBuffer.length,
      content: mergedBuffer,
      metadata: {
        title: "Merged PDF",
        custom: {
          sourceDocuments: documents.map(d => d.id),
        },
      },
      createdAt: new Date(),
    };

    if (this.storage) {
      const id = await this.storage.save(mergedDocument);
      mergedDocument.id = id;
    }

    return mergedDocument;
  }

  async splitPDF(document: Document): Promise<Document[]> {
    if (document.format !== "pdf") {
      throw new Error("Document must be a PDF");
    }

    const pages = await this.processor.splitPDF(document.content as Buffer);
    
    const splitDocuments = await Promise.all(
      pages.map(async (pageBuffer, index) => {
        const pageDocument: Document = {
          id: this.generateId(),
          name: `${document.name.replace(".pdf", "")}-page-${index + 1}.pdf`,
          type: "pdf",
          format: "pdf",
          size: pageBuffer.length,
          content: pageBuffer,
          metadata: {
            title: `Page ${index + 1}`,
            custom: {
              sourceDocument: document.id,
              pageNumber: index + 1,
            },
          },
          createdAt: new Date(),
        };

        if (this.storage) {
          const id = await this.storage.save(pageDocument);
          pageDocument.id = id;
        }

        return pageDocument;
      })
    );

    return splitDocuments;
  }

  async rotatePDF(document: Document, degrees: 90 | 180 | 270): Promise<Document> {
    if (document.format !== "pdf") {
      throw new Error("Document must be a PDF");
    }

    const rotatedBuffer = await this.processor.rotatePDF(document.content as Buffer, degrees);
    
    const rotatedDocument: Document = {
      id: this.generateId(),
      name: `${document.name.replace(".pdf", "")}-rotated.pdf`,
      type: "pdf",
      format: "pdf",
      size: rotatedBuffer.length,
      content: rotatedBuffer,
      metadata: {
        ...document.metadata,
        custom: {
          ...document.metadata?.custom,
          rotation: degrees,
        },
      },
      createdAt: new Date(),
    };

    if (this.storage) {
      const id = await this.storage.save(rotatedDocument);
      rotatedDocument.id = id;
    }

    return rotatedDocument;
  }

  async addPageNumbers(document: Document): Promise<Document> {
    if (document.format !== "pdf") {
      throw new Error("Document must be a PDF");
    }

    const numberedBuffer = await this.generator.addPageNumbers(document.content as Buffer);
    
    const numberedDocument: Document = {
      id: this.generateId(),
      name: `${document.name.replace(".pdf", "")}-numbered.pdf`,
      type: "pdf",
      format: "pdf",
      size: numberedBuffer.length,
      content: numberedBuffer,
      metadata: {
        ...document.metadata,
        custom: {
          ...document.metadata?.custom,
          pageNumbersAdded: true,
        },
      },
      createdAt: new Date(),
    };

    if (this.storage) {
      const id = await this.storage.save(numberedDocument);
      numberedDocument.id = id;
    }

    return numberedDocument;
  }

  // Image operations
  async compressImage(
    document: Document,
    options?: { quality?: number; width?: number; height?: number }
  ): Promise<Document> {
    if (document.type !== "image") {
      throw new Error("Document must be an image");
    }

    const compressedBuffer = await this.processor.compressImage(
      document.content as Buffer,
      options
    );
    
    const compressedDocument: Document = {
      id: this.generateId(),
      name: `${document.name.replace(/\.[^.]+$/, "")}-compressed.${document.format}`,
      type: "image",
      format: document.format,
      size: compressedBuffer.length,
      content: compressedBuffer,
      metadata: {
        ...document.metadata,
        custom: {
          ...document.metadata?.custom,
          compressed: true,
          compressionRatio: (document.size / compressedBuffer.length).toFixed(2),
        },
      },
      createdAt: new Date(),
    };

    if (this.storage) {
      const id = await this.storage.save(compressedDocument);
      compressedDocument.id = id;
    }

    return compressedDocument;
  }

  // Storage operations
  async saveDocument(document: Document): Promise<string> {
    if (!this.storage) {
      throw new Error("Storage not configured");
    }
    return this.storage.save(document);
  }

  async getDocument(id: string): Promise<Document | null> {
    if (!this.storage) {
      throw new Error("Storage not configured");
    }
    return this.storage.get(id);
  }

  async deleteDocument(id: string): Promise<void> {
    if (!this.storage) {
      throw new Error("Storage not configured");
    }
    return this.storage.delete(id);
  }

  async listDocuments(filters?: DocumentFilters): Promise<Document[]> {
    if (!this.storage) {
      throw new Error("Storage not configured");
    }
    return this.storage.list(filters);
  }

  async getDocumentUrl(id: string): Promise<string | null> {
    if (!this.storage) {
      throw new Error("Storage not configured");
    }
    return this.storage.getUrl(id);
  }

  // OCR lifecycle
  async initializeOCR(language = "eng"): Promise<void> {
    await this.processor.initializeOCR(language);
  }

  async terminateOCR(): Promise<void> {
    await this.processor.terminateOCR();
  }

  // Helper methods
  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDocumentType(format: DocumentFormat): Document["type"] {
    const typeMap: Record<DocumentFormat, Document["type"]> = {
      pdf: "pdf",
      docx: "word",
      xlsx: "excel",
      csv: "csv",
      png: "image",
      jpg: "image",
      txt: "text",
      html: "html",
      json: "json",
      xml: "xml",
    };
    return typeMap[format] || "text";
  }
}