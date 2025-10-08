import type { JSONContent } from "@tiptap/react";

/**
 * Extracts plain text from TipTap JSON content
 */
export function extractTextFromContent(content: JSONContent | string | null | undefined): string {
  if (!content) return "";
  
  // If it's already a string, try to parse it
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      return extractTextFromContent(parsed);
    } catch {
      // If it can't be parsed, return the string as is
      return content;
    }
  }
  
  // If it's a TipTap JSON object, extract the text
  if (typeof content === "object" && content.type) {
    let text = "";
    
    if (content.type === "text" && content.text) {
      return content.text;
    }
    
    if (content.content && Array.isArray(content.content)) {
      for (const node of content.content) {
        const nodeText = extractTextFromContent(node);
        if (nodeText) {
          text += (text ? "\n" : "") + nodeText;
        }
      }
    }
    
    return text;
  }
  
  return "";
}

/**
 * Converts plain text to TipTap JSON content
 */
export function textToTipTapContent(text: string): JSONContent {
  if (!text) {
    return {
      type: "doc",
      content: [],
    };
  }
  
  const lines = text.split("\n");
  return {
    type: "doc",
    content: lines.map((line) => ({
      type: "paragraph",
      content: line ? [
        {
          type: "text",
          text: line,
        },
      ] : [],
    })),
  };
}