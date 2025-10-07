"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFGenerator = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const pdf_lib_1 = require("pdf-lib");
const qrcode_1 = __importDefault(require("qrcode"));
const jsbarcode_1 = __importDefault(require("jsbarcode"));
const canvas_1 = require("canvas");
class PDFGenerator {
    options;
    constructor(options = {}) {
        this.options = {
            format: "pdf",
            compression: true,
            embedFonts: true,
            ...options,
        };
    }
    async generateInvoice(data) {
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({
                size: "A4",
                margin: 50,
                info: {
                    Title: `Invoice ${data.invoiceNumber}`,
                    Author: data.seller.name,
                    Subject: `Invoice for ${data.buyer.name}`,
                },
            });
            const chunks = [];
            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);
            // Header with logo
            if (data.seller.logo) {
                try {
                    doc.image(data.seller.logo, 50, 45, { width: 150 });
                }
                catch (error) {
                    console.error("Failed to add logo:", error);
                }
            }
            // Invoice title
            doc.fontSize(20)
                .fillColor("#333333")
                .text("INVOICE", 400, 50, { align: "right" });
            // Invoice details
            doc.fontSize(10)
                .fillColor("#666666")
                .text(`Invoice #: ${data.invoiceNumber}`, 400, 80, { align: "right" })
                .text(`Date: ${data.issueDate.toLocaleDateString()}`, 400, 95, { align: "right" })
                .text(`Due Date: ${data.dueDate.toLocaleDateString()}`, 400, 110, { align: "right" });
            // Seller information
            doc.fontSize(12)
                .fillColor("#333333")
                .text("From:", 50, 150)
                .fontSize(10)
                .text(data.seller.name, 50, 170)
                .fillColor("#666666");
            if (data.seller.address) {
                doc.text(data.seller.address.line1, 50, 185)
                    .text(data.seller.address.line2 || "", 50, 200)
                    .text(`${data.seller.address.city}, ${data.seller.address.state || ""} ${data.seller.address.postalCode}`, 50, 215)
                    .text(data.seller.address.country, 50, 230);
            }
            if (data.seller.email) {
                doc.text(data.seller.email, 50, 245);
            }
            if (data.seller.phone) {
                doc.text(data.seller.phone, 50, 260);
            }
            if (data.seller.taxId) {
                doc.text(`Tax ID: ${data.seller.taxId}`, 50, 275);
            }
            // Buyer information
            doc.fontSize(12)
                .fillColor("#333333")
                .text("To:", 300, 150)
                .fontSize(10)
                .text(data.buyer.name, 300, 170)
                .fillColor("#666666");
            if (data.buyer.address) {
                doc.text(data.buyer.address.line1, 300, 185)
                    .text(data.buyer.address.line2 || "", 300, 200)
                    .text(`${data.buyer.address.city}, ${data.buyer.address.state || ""} ${data.buyer.address.postalCode}`, 300, 215)
                    .text(data.buyer.address.country, 300, 230);
            }
            if (data.buyer.email) {
                doc.text(data.buyer.email, 300, 245);
            }
            if (data.buyer.phone) {
                doc.text(data.buyer.phone, 300, 260);
            }
            if (data.buyer.taxId) {
                doc.text(`Tax ID: ${data.buyer.taxId}`, 300, 275);
            }
            // Items table
            const tableTop = 320;
            const itemHeight = 20;
            // Table header
            doc.rect(50, tableTop, 500, itemHeight)
                .fillAndStroke("#f0f0f0", "#cccccc");
            doc.fontSize(10)
                .fillColor("#333333")
                .text("Description", 55, tableTop + 5, { width: 200 })
                .text("Qty", 260, tableTop + 5, { width: 50, align: "right" })
                .text("Unit Price", 320, tableTop + 5, { width: 80, align: "right" })
                .text("Amount", 470, tableTop + 5, { width: 75, align: "right" });
            // Table rows
            let currentY = tableTop + itemHeight;
            data.items.forEach((item) => {
                doc.rect(50, currentY, 500, itemHeight)
                    .stroke("#cccccc");
                doc.fontSize(9)
                    .fillColor("#666666")
                    .text(item.description, 55, currentY + 5, { width: 200 })
                    .text(item.quantity.toString(), 260, currentY + 5, { width: 50, align: "right" })
                    .text(this.formatCurrency(item.unitPrice, data.currency), 320, currentY + 5, { width: 80, align: "right" })
                    .text(this.formatCurrency(item.amount, data.currency), 470, currentY + 5, { width: 75, align: "right" });
                currentY += itemHeight;
            });
            // Totals
            currentY += 20;
            // Subtotal
            doc.fontSize(10)
                .fillColor("#666666")
                .text("Subtotal:", 400, currentY, { align: "right" })
                .text(this.formatCurrency(data.subtotal, data.currency), 470, currentY, { width: 75, align: "right" });
            currentY += 20;
            // Tax
            if (data.tax && data.tax.length > 0) {
                data.tax.forEach((tax) => {
                    doc.text(`${tax.name} (${tax.rate}%):`, 400, currentY, { align: "right" })
                        .text(this.formatCurrency(tax.amount, data.currency), 470, currentY, { width: 75, align: "right" });
                    currentY += 20;
                });
            }
            // Discount
            if (data.discount) {
                const discountText = data.discount.type === "percentage"
                    ? `Discount (${data.discount.value}%):`
                    : "Discount:";
                doc.text(discountText, 400, currentY, { align: "right" })
                    .text(`-${this.formatCurrency(data.discount.amount, data.currency)}`, 470, currentY, { width: 75, align: "right" });
                currentY += 20;
            }
            // Shipping
            if (data.shipping) {
                doc.text("Shipping:", 400, currentY, { align: "right" })
                    .text(this.formatCurrency(data.shipping, data.currency), 470, currentY, { width: 75, align: "right" });
                currentY += 20;
            }
            // Total
            doc.rect(400, currentY, 145, 25)
                .fillAndStroke("#f0f0f0", "#cccccc");
            doc.fontSize(12)
                .fillColor("#333333")
                .text("Total:", 405, currentY + 6, { align: "right" })
                .text(this.formatCurrency(data.total, data.currency), 470, currentY + 6, { width: 70, align: "right" });
            // Payment information
            if (data.paymentTerms || data.paymentMethods || data.bankDetails) {
                currentY += 50;
                doc.fontSize(12)
                    .fillColor("#333333")
                    .text("Payment Information", 50, currentY);
                currentY += 20;
                doc.fontSize(10)
                    .fillColor("#666666");
                if (data.paymentTerms) {
                    doc.text(`Terms: ${data.paymentTerms}`, 50, currentY);
                    currentY += 15;
                }
                if (data.paymentMethods && data.paymentMethods.length > 0) {
                    doc.text(`Methods: ${data.paymentMethods.join(", ")}`, 50, currentY);
                    currentY += 15;
                }
                if (data.bankDetails) {
                    doc.text("Bank Details:", 50, currentY);
                    currentY += 15;
                    doc.text(`Account Name: ${data.bankDetails.accountName}`, 70, currentY);
                    currentY += 15;
                    doc.text(`Account Number: ${data.bankDetails.accountNumber}`, 70, currentY);
                    currentY += 15;
                    doc.text(`Bank: ${data.bankDetails.bankName}`, 70, currentY);
                    currentY += 15;
                    if (data.bankDetails.routingNumber) {
                        doc.text(`Routing Number: ${data.bankDetails.routingNumber}`, 70, currentY);
                        currentY += 15;
                    }
                    if (data.bankDetails.iban) {
                        doc.text(`IBAN: ${data.bankDetails.iban}`, 70, currentY);
                        currentY += 15;
                    }
                    if (data.bankDetails.swift) {
                        doc.text(`SWIFT: ${data.bankDetails.swift}`, 70, currentY);
                        currentY += 15;
                    }
                }
            }
            // Notes and terms
            if (data.notes || data.terms) {
                currentY = Math.max(currentY + 30, 600);
                if (data.notes) {
                    doc.fontSize(10)
                        .fillColor("#333333")
                        .text("Notes:", 50, currentY);
                    doc.fontSize(9)
                        .fillColor("#666666")
                        .text(data.notes, 50, currentY + 15, { width: 500 });
                    currentY += 15 + (data.notes.length / 100) * 15;
                }
                if (data.terms) {
                    doc.fontSize(10)
                        .fillColor("#333333")
                        .text("Terms & Conditions:", 50, currentY);
                    doc.fontSize(9)
                        .fillColor("#666666")
                        .text(data.terms, 50, currentY + 15, { width: 500 });
                }
            }
            // Apply watermark if configured
            if (this.options.watermark) {
                this.applyWatermark(doc);
            }
            doc.end();
        });
    }
    async generateReport(data) {
        return new Promise((resolve, reject) => {
            const pageSettings = data.pageSettings || {};
            const doc = new pdfkit_1.default({
                size: pageSettings.format || "A4",
                layout: pageSettings.orientation || "portrait",
                margins: {
                    top: pageSettings.margins?.top || 50,
                    right: pageSettings.margins?.right || 50,
                    bottom: pageSettings.margins?.bottom || 50,
                    left: pageSettings.margins?.left || 50,
                },
                info: {
                    Title: data.title,
                    Author: data.author,
                    Subject: data.subtitle,
                },
            });
            const chunks = [];
            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);
            // Add header if configured
            if (data.header) {
                this.addReportHeader(doc, data.header);
            }
            // Title and subtitle
            doc.fontSize(24)
                .fillColor("#333333")
                .text(data.title, { align: "center" });
            if (data.subtitle) {
                doc.fontSize(14)
                    .fillColor("#666666")
                    .text(data.subtitle, { align: "center" });
            }
            if (data.author || data.date) {
                doc.moveDown();
                doc.fontSize(10)
                    .fillColor("#999999");
                if (data.author) {
                    doc.text(`By ${data.author}`, { align: "center" });
                }
                if (data.date) {
                    doc.text(data.date.toLocaleDateString(), { align: "center" });
                }
            }
            doc.moveDown(2);
            // Process sections
            data.sections.forEach((section, index) => {
                if (section.pageBreak && index > 0) {
                    doc.addPage();
                }
                if (section.title) {
                    doc.fontSize(16)
                        .fillColor("#333333")
                        .text(section.title);
                    doc.moveDown();
                }
                section.content.forEach((content) => {
                    this.renderReportContent(doc, content);
                });
            });
            // Add footer if configured
            if (data.footer) {
                this.addReportFooter(doc, data.footer);
            }
            doc.end();
        });
    }
    renderReportContent(doc, content) {
        switch (content.type) {
            case "text":
                this.renderText(doc, content.value, content.style);
                break;
            case "table":
                this.renderTable(doc, content.value);
                break;
            case "image":
                this.renderImage(doc, content.value);
                break;
            case "list":
                this.renderList(doc, content.value);
                break;
            case "pageBreak":
                doc.addPage();
                break;
        }
    }
    renderText(doc, text, style) {
        const currentOptions = {};
        if (style) {
            if (style.fontSize)
                doc.fontSize(style.fontSize);
            if (style.fontFamily)
                doc.font(style.fontFamily);
            if (style.color)
                doc.fillColor(style.color);
            if (style.alignment)
                currentOptions.align = style.alignment;
            if (style.lineHeight)
                currentOptions.lineGap = style.lineHeight;
            if (style.marginTop)
                doc.moveDown(style.marginTop / 12);
        }
        doc.text(text, currentOptions);
        if (style?.marginBottom) {
            doc.moveDown(style.marginBottom / 12);
        }
        else {
            doc.moveDown();
        }
        // Reset to defaults
        doc.fontSize(10).fillColor("#000000");
    }
    renderTable(doc, table) {
        const startX = doc.x;
        const startY = doc.y;
        const columnWidth = 500 / table.headers.length;
        const rowHeight = 20;
        // Draw header
        doc.rect(startX, startY, 500, rowHeight)
            .fillAndStroke(table.style?.headerBackground || "#f0f0f0", "#cccccc");
        doc.fontSize(10)
            .fillColor(table.style?.headerColor || "#333333");
        table.headers.forEach((header, i) => {
            doc.text(header, startX + (i * columnWidth) + 5, startY + 5, {
                width: columnWidth - 10,
                height: rowHeight,
            });
        });
        // Draw rows
        let currentY = startY + rowHeight;
        table.rows.forEach((row, rowIndex) => {
            if (table.style?.striped && rowIndex % 2 === 1) {
                doc.rect(startX, currentY, 500, rowHeight)
                    .fill("#f9f9f9");
            }
            doc.rect(startX, currentY, 500, rowHeight)
                .stroke(table.style?.borderColor || "#cccccc");
            doc.fillColor("#666666");
            row.forEach((cell, i) => {
                doc.text(String(cell ?? ""), startX + (i * columnWidth) + 5, currentY + 5, {
                    width: columnWidth - 10,
                    height: rowHeight,
                });
            });
            currentY += rowHeight;
        });
        doc.y = currentY + 10;
    }
    renderImage(doc, image) {
        const options = {};
        if (image.width)
            options.width = image.width;
        if (image.height)
            options.height = image.height;
        if (image.alignment === "center") {
            options.align = "center";
        }
        try {
            doc.image(image.src, options);
            if (image.caption) {
                doc.fontSize(9)
                    .fillColor("#666666")
                    .text(image.caption, { align: image.alignment || "left" });
            }
        }
        catch (error) {
            console.error("Failed to render image:", error);
        }
        doc.moveDown();
    }
    renderList(doc, list) {
        const renderItems = (items, level = 0) => {
            items.forEach((item, index) => {
                const bullet = list.type === "numbered" ? `${index + 1}.` : "•";
                const indent = level * 20;
                doc.text(`${bullet} ${item.text}`, doc.x + indent, doc.y);
                if (item.subitems) {
                    renderItems(item.subitems, level + 1);
                }
            });
        };
        renderItems(list.items);
        doc.moveDown();
    }
    addReportHeader(doc, header) {
        // Implementation for report header
    }
    addReportFooter(doc, footer) {
        // Implementation for report footer
    }
    applyWatermark(doc) {
        if (!this.options.watermark)
            return;
        const { text, opacity = 0.3, position = "center", rotation = 45 } = this.options.watermark;
        if (text) {
            doc.save();
            doc.rotate(rotation, { origin: [300, 400] });
            doc.fontSize(60)
                .fillColor("#cccccc")
                .opacity(opacity)
                .text(text, 0, 400, { align: "center" });
            doc.restore();
        }
    }
    formatCurrency(amount, currency = "USD") {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
        }).format(amount);
    }
    async generateQRCode(data, options) {
        const qrOptions = {
            errorCorrectionLevel: options?.errorCorrectionLevel || "M",
            type: "png",
            width: options?.width || 200,
            margin: options?.margin || 4,
            color: {
                dark: options?.color || "#000000",
                light: options?.background || "#FFFFFF",
            },
        };
        return qrcode_1.default.toBuffer(data, qrOptions);
    }
    async generateBarcode(data, options) {
        const canvas = (0, canvas_1.createCanvas)(options?.width || 200, options?.height || 100);
        (0, jsbarcode_1.default)(canvas, data, {
            format: options?.format || "CODE128",
            width: 2,
            height: options?.height || 100,
            displayValue: options?.text !== false,
            fontSize: options?.fontSize || 12,
            margin: options?.margin || 10,
            background: options?.background || "#FFFFFF",
            lineColor: options?.color || "#000000",
        });
        return canvas.toBuffer("image/png");
    }
    async mergePDFs(pdfs) {
        const mergedPdf = await pdf_lib_1.PDFDocument.create();
        for (const pdfBuffer of pdfs) {
            const pdf = await pdf_lib_1.PDFDocument.load(pdfBuffer);
            const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach((page) => mergedPdf.addPage(page));
        }
        return Buffer.from(await mergedPdf.save());
    }
    async addPageNumbers(pdf) {
        const pdfDoc = await pdf_lib_1.PDFDocument.load(pdf);
        const pages = pdfDoc.getPages();
        const font = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        pages.forEach((page, index) => {
            const { width, height } = page.getSize();
            page.drawText(`${index + 1} / ${pages.length}`, {
                x: width - 60,
                y: 20,
                size: 10,
                font,
                color: (0, pdf_lib_1.rgb)(0.5, 0.5, 0.5),
            });
        });
        return Buffer.from(await pdfDoc.save());
    }
}
exports.PDFGenerator = PDFGenerator;
