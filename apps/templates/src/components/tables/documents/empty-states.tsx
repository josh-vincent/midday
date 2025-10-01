"use client";

import { Card, CardContent } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { FileText, Upload, Search, FolderPlus } from "lucide-react";

export function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="mt-6 text-center">
          <h3 className="text-lg font-semibold">No documents yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Get started by uploading your first document or creating a folder to organize your files.
          </p>
        </div>
        <div className="mt-6 flex gap-3">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
          <Button variant="outline">
            <FolderPlus className="mr-2 h-4 w-4" />
            Create Folder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function NoResults() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Search className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="mt-6 text-center">
          <h3 className="text-lg font-semibold">No documents found</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Try adjusting your search or filter criteria to find what you're looking for.
          </p>
        </div>
        <div className="mt-6">
          <Button variant="outline">
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}