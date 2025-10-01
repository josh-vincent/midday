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
import type { DatabaseTable } from "./columns";

type Props = {
  row: DatabaseTable;
  onViewDetails?: (table: DatabaseTable) => void;
  onExportData?: (table: DatabaseTable) => void;
  onAnalyzeTable?: (table: DatabaseTable) => void;
};

export function ActionsMenu({ 
  row, 
  onViewDetails,
  onExportData,
  onAnalyzeTable 
}: Props) {
  const { toast } = useToast();
  const [, copy] = useCopyToClipboard();

  const handleCopyTableName = async () => {
    copy(row.name);
    toast({
      duration: 2000,
      title: "Table name copied to clipboard",
      variant: "success",
    });
  };

  const handleCopySelectQuery = async () => {
    const query = `SELECT * FROM ${row.schema}.${row.name} LIMIT 100;`;
    copy(query);
    toast({
      duration: 2000,
      title: "SELECT query copied to clipboard",
      variant: "success",
    });
  };

  const handleViewDetails = () => {
    onViewDetails?.(row);
  };

  const handleExportData = () => {
    onExportData?.(row);
    toast({
      duration: 2000,
      title: `Exporting data from ${row.name}...`,
    });
  };

  const handleAnalyzeTable = () => {
    onAnalyzeTable?.(row);
    toast({
      duration: 2000,
      title: `Analyzing table ${row.name}...`,
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
          
          <DropdownMenuItem onClick={handleAnalyzeTable}>
            Analyze table
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleExportData}>
            Export data
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleCopySelectQuery}>
            Copy SELECT query
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleCopyTableName}>
            Copy table name
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}