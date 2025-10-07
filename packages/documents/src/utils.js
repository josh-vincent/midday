"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowedMimeTypes = void 0;
exports.getAllowedAttachments = getAllowedAttachments;
exports.getDomainFromEmail = getDomainFromEmail;
exports.removeProtocolFromDomain = removeProtocolFromDomain;
exports.getDocumentTypeFromMimeType = getDocumentTypeFromMimeType;
exports.getContentSample = getContentSample;
exports.isMimeTypeSupportedForProcessing = isMimeTypeSupportedForProcessing;
exports.extractTextFromRtf = extractTextFromRtf;
exports.cleanText = cleanText;
exports.limitWords = limitWords;
exports.allowedMimeTypes = [
    "image/heic",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "application/pdf",
    "application/octet-stream",
];
function getAllowedAttachments(attachments) {
    return attachments?.filter((attachment) => exports.allowedMimeTypes.includes(attachment.ContentType));
}
function getDomainFromEmail(email) {
    const emailPattern = /^[^\s@]+@([^\s@]+)$/;
    const match = email?.match(emailPattern);
    const domain = match?.at(1);
    if (!domain)
        return null;
    const domainParts = domain.split(".");
    if (domainParts.length > 2) {
        return domainParts.slice(-2).join(".");
    }
    return domain;
}
function removeProtocolFromDomain(domain) {
    if (!domain)
        return null;
    return domain.replace(/^(https?:\/\/)/, "");
}
function getDocumentTypeFromMimeType(mimetype) {
    switch (mimetype) {
        case "application/pdf":
        case "application/octet-stream":
            return "invoice";
        default:
            return "receipt";
    }
}
function getContentSample(text, maxTokens = 1200) {
    const words = text.split(/\s+/);
    const approxWordsPerToken = 0.75; // Rough estimate
    const maxWords = Math.floor(maxTokens / approxWordsPerToken);
    return words.slice(0, maxWords).join(" ");
}
const supportedMimeTypesForProcessing = new Set([
    "application/pdf",
    "application/x-pdf",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/docx",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/pptx",
    "application/rtf",
    "text/markdown",
    "application/vnd.oasis.opendocument.text",
    "image/heic", // Handled via conversion
    // "application/vnd.apple.pages",
    // "application/x-iwork-pages-sffpages",
    // "applicatiosn/epub+zip",
]);
/**
 * Checks if a given MIME type is supported for document or image processing.
 * This includes types loadable by `loadDocument` and image types handled by `classifyImage`.
 * @param mimetype The MIME type string to check.
 * @returns True if the MIME type is supported, false otherwise.
 */
function isMimeTypeSupportedForProcessing(mimetype) {
    // Check exact matches first
    if (supportedMimeTypesForProcessing.has(mimetype)) {
        return true;
    }
    // Check if it's any other image type (handled by classifyImage)
    if (mimetype.startsWith("image/")) {
        return true;
    }
    return false;
}
function extractTextFromRtf(buffer) {
    let rtfContent = buffer.toString("utf-8");
    // Remove font tables, color tables, and other metadata groups
    rtfContent = rtfContent.replace(/{\\(?:fonttbl|colortbl|stylesheet)[^}]*}/gi, "");
    // Remove RTF header
    rtfContent = rtfContent.replace(/^{\\rtf1[^}]*}/i, "");
    // Remove embedded pictures, objects
    rtfContent = rtfContent.replace(/{\\\*\\shppict[^}]*}/gi, "");
    rtfContent = rtfContent.replace(/{\\object[^}]*}/gi, "");
    rtfContent = rtfContent.replace(/{\\pict[^}]*}/gi, "");
    // Remove Unicode characters like \u1234? (keep the fallback '?')
    rtfContent = rtfContent.replace(/\\u-?\d+\??/g, "");
    // Remove all other RTF control words
    rtfContent = rtfContent.replace(/\\[a-z]+\d* ?/gi, "");
    // Remove escaped hex like \'ab
    rtfContent = rtfContent.replace(/\\'[0-9a-f]{2}/gi, "");
    // Remove any leftover braces
    rtfContent = rtfContent.replace(/[{}]/g, "");
    // Replace known RTF newline/tab symbols
    rtfContent = rtfContent
        .replace(/\\par[d]?/gi, "\n")
        .replace(/\\tab/gi, "\t")
        .replace(/\\line/gi, "\n");
    // Collapse multiple spaces and newlines
    rtfContent = rtfContent.replace(/\r?\n\s*\r?\n/g, "\n"); // multiple newlines -> single
    rtfContent = rtfContent.replace(/[ \t]{2,}/g, " "); // multiple spaces/tabs -> single
    // Final clean trim§
    return rtfContent.trim();
}
function cleanText(text) {
    // Remove control characters (C0 and C1 controls)
    // Using Unicode escapes to avoid eslint `no-control-regex` error
    // \u0000-\u001F corresponds to \x00-\x1F
    // \u007F-\u009F corresponds to \x7F-\x9F
    // Remove control characters (C0 and C1 controls) using Unicode escapes to avoid eslint `no-control-regex` error
    let cleanedText = text.replace(new RegExp([
        "[",
        "\\u0000-\\u001F", // C0 controls
        "\\u007F-\\u009F", // C1 controls
        "]",
    ].join(""), "g"), "");
    // Normalize spaces: replace multiple spaces, tabs, or line breaks with a single space
    cleanedText = cleanedText.replace(/\s+/g, " ").trim();
    // The previous version removed too many characters with /[^\x20-\x7E]/g
    // It also had potentially overly aggressive punctuation cleaning.
    // This simpler version focuses on removing control chars and normalizing space.
    // Optional: Further specific cleaning can be added here if needed,
    // for example, removing zero-width spaces:
    // cleanedText = cleanedText.replace(/[\u200B-\u200D\uFEFF]/g, '');
    return cleanedText;
}
function limitWords(text, maxWords) {
    if (!text)
        return "";
    const words = text.split(/\s+/); // Split by any whitespace
    if (words.length <= maxWords) {
        return text;
    }
    return words.slice(0, maxWords).join(" ");
}
