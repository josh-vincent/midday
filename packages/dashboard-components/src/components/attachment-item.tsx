"use client";

import { formatSize } from "@midday/utils/format";
import { Button } from "@midday/ui/button";
import { Skeleton } from "@midday/ui/skeleton";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export type Attachment = {
  id?: string;
  type: string;
  name: string;
  size: number;
  isUploading?: boolean;
  path?: string[];
};

type Props = {
  file: Attachment;
  onDelete: () => void;
  onPreviewClick?: () => void;
  filePreview?: ReactNode;
};

/**
 * AttachmentItem - Display file attachment with preview and actions
 *
 * @example
 * ```tsx
 * <AttachmentItem
 *   file={attachment}
 *   onDelete={() => removeAttachment(id)}
 *   onPreviewClick={() => openPreview(attachment)}
 *   filePreview={<FilePreview mimeType={file.type} filePath={file.path} />}
 * />
 * ```
 *
 * @param file - Attachment data
 * @param onDelete - Callback when delete button is clicked
 * @param onPreviewClick - Optional callback when preview is clicked
 * @param filePreview - Optional custom file preview component
 */
export function AttachmentItem({
  file,
  onDelete,
  onPreviewClick,
  filePreview
}: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex space-x-4 items-center">
        <div className="w-[40px] h-[40px] overflow-hidden cursor-pointer">
          {file.isUploading ? (
            <Skeleton className="w-full h-full" />
          ) : filePreview ? (
            <button
              onClick={onPreviewClick}
              className="w-full h-full"
              type="button"
            >
              {filePreview}
            </button>
          ) : (
            <div className="w-full h-full bg-gray-100 rounded" />
          )}
        </div>

        <div className="flex flex-col space-y-0.5 w-80">
          <span className="truncate">{file.name}</span>
          <span className="text-xs text-[#606060]">
            {file.size && formatSize(file.size)}
          </span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="w-auto hover:bg-transparent flex"
        onClick={onDelete}
      >
        <X size={14} />
      </Button>
    </div>
  );
}