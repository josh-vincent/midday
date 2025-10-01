"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@midday/ui/dropdown-menu";
import { Button } from "@midday/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@midday/ui/alert-dialog";
import {
  MoreHorizontal,
  Edit3,
  Download,
  Share2,
  Star,
  StarOff,
  FolderOpen,
  Trash2,
  Copy,
  Eye,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import type { MockDocument } from "@/lib/mock/documents-mock";

type Props = {
  row: MockDocument;
  onEdit?: (document: MockDocument) => void;
  onDelete?: (document: MockDocument) => void;
  onStar?: (document: MockDocument) => void;
  onShare?: (document: MockDocument, userIds: string[]) => void;
  onMove?: (document: MockDocument, folderId: string) => void;
  onDownload?: (document: MockDocument) => void;
};

export function ActionsMenu({
  row,
  onEdit,
  onDelete,
  onStar,
  onShare,
  onMove,
  onDownload,
}: Props) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const handleDelete = () => {
    onDelete?.(row);
    setShowDeleteDialog(false);
  };

  const handleArchive = () => {
    onEdit?.({ ...row, status: row.status === "archived" ? "active" : "archived" });
    setShowArchiveDialog(false);
  };

  const handleStar = () => {
    onStar?.(row);
  };

  const handleDownload = () => {
    onDownload?.(row);
  };

  const handleShare = () => {
    // For demo purposes, share with first user
    onShare?.(row, ["user_1"]);
  };

  const handleMove = () => {
    // For demo purposes, move to first folder
    onMove?.(row, "folder_1");
  };

  const handleDuplicate = () => {
    // For demo purposes, just show a toast
    console.log("Duplicate document:", row.name);
  };

  const handlePreview = () => {
    console.log("Preview document:", row.name);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted actions-menu"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={handlePreview}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => onEdit?.(row)}>
            <Edit3 className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleStar}>
            {row.starred ? (
              <>
                <StarOff className="mr-2 h-4 w-4" />
                Unstar
              </>
            ) : (
              <>
                <Star className="mr-2 h-4 w-4" />
                Star
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FolderOpen className="mr-2 h-4 w-4" />
              Move to
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={handleMove}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Contracts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMove}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Financial Reports
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMove}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Marketing Materials
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowArchiveDialog(true)}>
            {row.status === "archived" ? (
              <>
                <ArchiveRestore className="mr-2 h-4 w-4" />
                Restore
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document
              "{row.name}" and remove it from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {row.status === "archived" ? "Restore document?" : "Archive document?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {row.status === "archived" 
                ? `This will restore "${row.name}" and make it visible in the active documents list.`
                : `This will archive "${row.name}" and hide it from the main documents list.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              {row.status === "archived" ? "Restore" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}