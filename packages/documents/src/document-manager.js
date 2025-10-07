"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentManager = void 0;
const pdf_generator_1 = require("./generators/pdf-generator");
const document_processor_1 = require("./processors/document-processor");
class DocumentManager {
    generator;
    processor;
    storage;
    constructor(storage) {
        this.generator = new pdf_generator_1.PDFGenerator();
        this.processor = new document_processor_1.DocumentProcessor();
        this.storage = storage;
    }
    // Generation methods
    async generateInvoice(data, options) {
        const buffer = await this.generator.generateInvoice(data);
        const document = {
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
    async generateReport(data, options) {
        const buffer = await this.generator.generateReport(data);
        const document = {
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
    async generateQRCode(data, options) {
        const buffer = await this.generator.generateQRCode(data, options);
        const document = {
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
    async generateBarcode(data, options) {
        const buffer = await this.generator.generateBarcode(data, options);
        const document = {
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
    async extractText(document, options) {
        return this.processor.extractText(document, options);
    }
    async extractTables(document) {
        return this.processor.extractTables(document);
    }
    async extractMetadata(document) {
        return this.processor.extractMetadata(document);
    }
    async performOCR(document, options) {
        if (document.type !== "image") {
            throw new Error("OCR can only be performed on image documents");
        }
        return this.processor.performOCR(document.content, options);
    }
    async convertDocument(document, targetFormat) {
        const convertedBuffer = await this.processor.convertDocument(document, targetFormat);
        const convertedDocument = {
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
    async mergePDFs(documents) {
        const pdfBuffers = documents
            .filter(d => d.format === "pdf")
            .map(d => d.content);
        if (pdfBuffers.length === 0) {
            throw new Error("No PDF documents to merge");
        }
        const mergedBuffer = await this.generator.mergePDFs(pdfBuffers);
        const mergedDocument = {
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
    async splitPDF(document) {
        if (document.format !== "pdf") {
            throw new Error("Document must be a PDF");
        }
        const pages = await this.processor.splitPDF(document.content);
        const splitDocuments = await Promise.all(pages.map(async (pageBuffer, index) => {
            const pageDocument = {
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
        }));
        return splitDocuments;
    }
    async rotatePDF(document, degrees) {
        if (document.format !== "pdf") {
            throw new Error("Document must be a PDF");
        }
        const rotatedBuffer = await this.processor.rotatePDF(document.content, degrees);
        const rotatedDocument = {
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
    async addPageNumbers(document) {
        if (document.format !== "pdf") {
            throw new Error("Document must be a PDF");
        }
        const numberedBuffer = await this.generator.addPageNumbers(document.content);
        const numberedDocument = {
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
    async compressImage(document, options) {
        if (document.type !== "image") {
            throw new Error("Document must be an image");
        }
        const compressedBuffer = await this.processor.compressImage(document.content, options);
        const compressedDocument = {
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
    async saveDocument(document) {
        if (!this.storage) {
            throw new Error("Storage not configured");
        }
        return this.storage.save(document);
    }
    async getDocument(id) {
        if (!this.storage) {
            throw new Error("Storage not configured");
        }
        return this.storage.get(id);
    }
    async deleteDocument(id) {
        if (!this.storage) {
            throw new Error("Storage not configured");
        }
        return this.storage.delete(id);
    }
    async listDocuments(filters) {
        if (!this.storage) {
            throw new Error("Storage not configured");
        }
        return this.storage.list(filters);
    }
    async getDocumentUrl(id) {
        if (!this.storage) {
            throw new Error("Storage not configured");
        }
        return this.storage.getUrl(id);
    }
    // OCR lifecycle
    async initializeOCR(language = "eng") {
        await this.processor.initializeOCR(language);
    }
    async terminateOCR() {
        await this.processor.terminateOCR();
    }
    // Helper methods
    generateId() {
        return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getDocumentType(format) {
        const typeMap = {
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
exports.DocumentManager = DocumentManager;
