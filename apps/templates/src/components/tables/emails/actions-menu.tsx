"use client";

import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { useToast } from "@midday/ui/use-toast";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { 
  Archive, 
  Trash2, 
  Star,
  Check,
  Reply,
  Forward,
  FolderOpen,
  Tag,
  Download
} from "lucide-react";
import { useCopyToClipboard } from "usehooks-ts";
import type { Email } from "./columns";

type Props = {
  row: Email;
  onEmailSelect?: (email: Email) => void;
  onComposeReply?: (email: Email) => void;
  onComposeForward?: (email: Email) => void;
};

export function ActionsMenu({ row, onEmailSelect, onComposeReply, onComposeForward }: Props) {
  const { toast } = useToast();
  const [, copy] = useCopyToClipboard();

  const handleMarkAsRead = () => {
    toast({
      title: "Email marked as read",
      description: `"${row.subject}" has been marked as read.`,
    });
  };

  const handleMarkAsUnread = () => {
    toast({
      title: "Email marked as unread",
      description: `"${row.subject}" has been marked as unread.`,
    });
  };

  const handleToggleStar = () => {
    const action = row.starred ? "removed from" : "added to";
    toast({
      title: `Email ${action} starred`,
      description: `"${row.subject}" has been ${action} starred emails.`,
    });
  };

  const handleArchive = () => {
    toast({
      title: "Email archived",
      description: `"${row.subject}" has been archived.`,
    });
  };

  const handleDelete = () => {
    toast({
      title: "Email deleted",
      description: `"${row.subject}" has been moved to trash.`,
      variant: "destructive",
    });
  };

  const handleDownloadAttachments = () => {
    if (!row.attachments || row.attachments.length === 0) {
      toast({
        title: "No attachments",
        description: "This email has no attachments to download.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Downloading attachments",
      description: `Downloading ${row.attachments.length} attachment(s).`,
    });
  };

  const handleCopyEmailAddress = () => {
    copy(row.from.email);
    toast({
      title: "Email address copied",
      description: `${row.from.email} has been copied to clipboard.`,
    });
  };

  const handleReply = () => {
    if (onComposeReply) {
      onComposeReply(row);
    } else {
      toast({
        title: "Reply",
        description: "Reply functionality would be implemented here.",
      });
    }
  };

  const handleForward = () => {
    if (onComposeForward) {
      onComposeForward(row);
    } else {
      toast({
        title: "Forward",
        description: "Forward functionality would be implemented here.",
      });
    }
  };

  const handleViewEmail = () => {
    if (onEmailSelect) {
      onEmailSelect(row);
    } else {
      toast({
        title: "View email",
        description: "View email functionality would be implemented here.",
      });
    }
  };

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="relative">
          <Button variant="ghost" className="h-8 w-8 p-0">
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleViewEmail}>
            View email
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleReply}>
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleForward}>
            <Forward className="h-4 w-4 mr-2" />
            Forward
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {row.read ? (
            <DropdownMenuItem onClick={handleMarkAsUnread}>
              <Check className="h-4 w-4 mr-2" />
              Mark as unread
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleMarkAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Mark as read
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={handleToggleStar}>
            <Star className={`h-4 w-4 mr-2 ${row.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
            {row.starred ? "Remove star" : "Add star"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleArchive}>
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </DropdownMenuItem>

          <DropdownMenuItem>
            <FolderOpen className="h-4 w-4 mr-2" />
            Move to folder
          </DropdownMenuItem>

          <DropdownMenuItem>
            <Tag className="h-4 w-4 mr-2" />
            Add label
          </DropdownMenuItem>

          {row.attachments && row.attachments.length > 0 && (
            <DropdownMenuItem onClick={handleDownloadAttachments}>
              <Download className="h-4 w-4 mr-2" />
              Download attachments
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={handleCopyEmailAddress}>
            Copy email address
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}