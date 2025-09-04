"use client";

import { Alert, AlertDescription } from "@midday/ui/alert";
import { cn } from "@midday/ui/cn";

interface PdfViewerProps {
  url: string;
  maxWidth?: number;
}

export function PdfViewer({ url, maxWidth }: PdfViewerProps) {
  return (
    <div className={cn("flex flex-col w-full h-full overflow-hidden bg-white")}>
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <Alert className="max-w-md">
          <AlertDescription>
            PDF viewer is temporarily disabled. 
            <br />
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 underline mt-2 inline-block"
            >
              Open PDF in new tab
            </a>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}