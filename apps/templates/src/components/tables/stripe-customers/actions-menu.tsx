"use client";

import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { useToast } from "@midday/ui/use-toast";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Eye, Edit, CreditCard, Mail, ExternalLink } from "lucide-react";
import type { StripeCustomer } from "./columns";

type Props = {
  row: StripeCustomer;
  onEdit?: (customer: StripeCustomer) => void;
  onView?: (customer: StripeCustomer) => void;
};

export function ActionsMenu({ row, onEdit, onView }: Props) {
  const { toast } = useToast();

  const handleAction = (action: string) => {
    toast({
      title: `${action} Customer`,
      description: `${action} action triggered for ${row.name}`,
    });

    // In a real app, these would trigger actual API calls
    console.log(`${action} customer:`, row.id);
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
          <DropdownMenuItem onClick={() => onView?.(row)}>
            <Eye className="h-4 w-4 mr-2" />
            View customer
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => onEdit?.(row)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit customer
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleAction("Create subscription for")}>
            <CreditCard className="h-4 w-4 mr-2" />
            Create subscription
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleAction("Send email to")}>
            <Mail className="h-4 w-4 mr-2" />
            Send email
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleAction("Open billing portal for")}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open billing portal
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleAction("Export data for")}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Export data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}