// Export types
export * from "./types/document";

// Export generators
export { PDFGenerator } from "./generators/pdf-generator";

// Export processors
export { DocumentProcessor } from "./processors/document-processor";

// Export document manager
export { DocumentManager } from "./document-manager";

// Legacy export for compatibility
export function getAllowedAttachments() {
  return ["pdf", "jpg", "jpeg", "png", "gif"];
}
