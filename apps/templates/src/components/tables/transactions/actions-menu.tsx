"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Button } from "@midday/ui/button";
import { MoreHorizontal, Edit, Trash, Tag, Copy, FileText, Share } from "lucide-react";
import type { MockTransaction } from "@/lib/mock/transactions-mock";

type Props = {
  row: MockTransaction;
  onEdit?: (transaction: MockTransaction) => void;
  onDelete?: (transaction: MockTransaction) => void;
  onCategorize?: (transaction: MockTransaction, category: string) => void;
};

const categories = [
  "Software & Tools",
  "Salaries & Wages",
  "Marketing",
  "Office Supplies",
  "Travel",
  "Entertainment",
  "Utilities",
  "Rent",
  "Insurance",
  "Taxes",
  "Other",
];

export function ActionsMenu({ row, onEdit, onDelete, onCategorize }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => onEdit?.(row)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit transaction
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Tag className="mr-2 h-4 w-4" />
            Categorize
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {categories.map((category) => (
              <DropdownMenuItem
                key={category}
                onClick={() => onCategorize?.(row, category)}
              >
                {category}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </DropdownMenuItem>

        <DropdownMenuItem>
          <FileText className="mr-2 h-4 w-4" />
          Add receipt
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Share className="mr-2 h-4 w-4" />
          Share
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => onDelete?.(row)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}