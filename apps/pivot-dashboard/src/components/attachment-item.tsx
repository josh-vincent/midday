"use client";

import { useDocumentParams } from "@/hooks/use-document-params";
import {
  AttachmentItem as SharedAttachmentItem,
  type Attachment,
} from "@midday/dashboard-components";
import { FilePreview } from "./file-preview";

// Re-export type for compatibility
export type { Attachment };

type Props = {
  file: Attachment;
  onDelete: () => void;
};

export function AttachmentItem({ file, onDelete }: Props) {
  const { setParams } = useDocumentParams();

  return (
    <SharedAttachmentItem
      file={file}
      onDelete={onDelete}
      onPreviewClick={() => setParams({ filePath: file?.path?.join("/") })}
      filePreview={
        <FilePreview
          mimeType={file.type}
          filePath={`${file?.path?.join("/")}`}
        />
      }
    />
  );
}