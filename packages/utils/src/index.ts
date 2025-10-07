export function stripSpecialCharacters(inputString: string) {
  // Remove special characters and spaces, keep alphanumeric, hyphens/underscores, and dots
  return inputString
    .replace(/[^a-zA-Z0-9-_\s.]/g, "") // Remove special chars except hyphen/underscore/dot
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .toLowerCase(); // Convert to lowercase for consistency
}

export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export {
  getExtensionFromMimeType,
  ensureFileExtension,
} from "./mime-to-extension";

export {
  parseDate,
  applyColumnMappings,
  transformValue,
  parseCSV,
  applyCustomTransform,
  parseNumber,
  parseBoolean,
  buildDuplicateKey,
  getGroupKey,
  type CSVParseResult,
} from "./csv-parser";
