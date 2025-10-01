import type { EditorDoc } from "../../../types";
import { formatEditorContent } from "../format";

type Props = {
  content?: EditorDoc | string | null;
};

export function EditorContent({ content }: Props) {
  if (!content) {
    return null;
  }

  // Parse string content if necessary
  let parsedContent: EditorDoc | null = null;
  
  if (typeof content === 'string') {
    try {
      parsedContent = JSON.parse(content);
    } catch {
      // If parsing fails, create a simple text node
      parsedContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: content ? [
              {
                type: 'text',
                text: content,
              },
            ] : [],
          },
        ],
      };
    }
  } else {
    parsedContent = content;
  }

  return (
    <div className="font-mono leading-4">{formatEditorContent(parsedContent)}</div>
  );
}
