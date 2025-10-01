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
import { useCopyToClipboard } from "usehooks-ts";
import type { Migration } from "./columns";

type Props = {
  row: Migration;
  onViewDetails?: (migration: Migration) => void;
  onRunMigration?: (migration: Migration) => void;
  onRollbackMigration?: (migration: Migration) => void;
};

export function ActionsMenu({ 
  row, 
  onViewDetails,
  onRunMigration,
  onRollbackMigration 
}: Props) {
  const { toast } = useToast();
  const [, copy] = useCopyToClipboard();

  const handleCopyId = async () => {
    copy(row.id);
    toast({
      duration: 2000,
      title: "Migration ID copied to clipboard",
      variant: "success",
    });
  };

  const handleCopyChecksum = async () => {
    copy(row.checksum);
    toast({
      duration: 2000,
      title: "Checksum copied to clipboard",
      variant: "success",
    });
  };

  const handleViewDetails = () => {
    onViewDetails?.(row);
  };

  const handleRunMigration = () => {
    onRunMigration?.(row);
    toast({
      duration: 2000,
      title: `Running migration ${row.name}...`,
    });
  };

  const handleRollbackMigration = () => {
    onRollbackMigration?.(row);
    toast({
      duration: 2000,
      title: `Rolling back migration ${row.name}...`,
    });
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
          <DropdownMenuItem onClick={handleViewDetails}>
            View details
          </DropdownMenuItem>

          {row.status === "pending" && (
            <DropdownMenuItem onClick={handleRunMigration}>
              Run migration
            </DropdownMenuItem>
          )}

          {row.status === "applied" && (
            <DropdownMenuItem 
              onClick={handleRollbackMigration}
              className="text-[#FF3638]"
            >
              Rollback
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleCopyId}>
            Copy migration ID
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleCopyChecksum}>
            Copy checksum
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}