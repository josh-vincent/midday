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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentManager = exports.DocumentProcessor = exports.PDFGenerator = void 0;
exports.getAllowedAttachments = getAllowedAttachments;
// Export types
__exportStar(require("./types/document"), exports);
// Export generators
var pdf_generator_1 = require("./generators/pdf-generator");
Object.defineProperty(exports, "PDFGenerator", { enumerable: true, get: function () { return pdf_generator_1.PDFGenerator; } });
// Export processors
var document_processor_1 = require("./processors/document-processor");
Object.defineProperty(exports, "DocumentProcessor", { enumerable: true, get: function () { return document_processor_1.DocumentProcessor; } });
// Export document manager
var document_manager_1 = require("./document-manager");
Object.defineProperty(exports, "DocumentManager", { enumerable: true, get: function () { return document_manager_1.DocumentManager; } });
// Export utils
__exportStar(require("./utils"), exports);
// Legacy export for compatibility
function getAllowedAttachments() {
    return ["pdf", "jpg", "jpeg", "png", "gif"];
}
