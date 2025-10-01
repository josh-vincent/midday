"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@midday/ui/checkbox";
import { Badge } from "@midday/ui/badge";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";
import { 
  User,
  Building,
  Crown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  Globe,
  MapPin
} from "lucide-react";
import type { MockCustomer } from "@/lib/mock/customers-mock";

const statusConfig = {
  active: { 
    label: "Active", 
    variant: "default" as const,
    icon: CheckCircle,
    color: "text-green-500"
  },
  inactive: { 
    label: "Inactive", 
    variant: "secondary" as const,
    icon: Clock,
    color: "text-gray-500"
  },
  suspended: { 
    label: "Suspended", 
    variant: "destructive" as const,
    icon: AlertTriangle,
    color: "text-red-500"
  },
  prospect: { 
    label: "Prospect", 
    variant: "outline" as const,
    icon: Eye,
    color: "text-blue-500"
  },
};

const typeConfig = {
  individual: { 
    label: "Individual", 
    icon: User,
    color: "text-blue-500"
  },
  business: { 
    label: "Business", 
    icon: Building,
    color: "text-purple-500"
  },
  enterprise: { 
    label: "Enterprise", 
    icon: Crown,
    color: "text-yellow-500"
  },
};

export const columns: ColumnDef<MockCustomer>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => {
      const customer = row.original;
      const TypeIcon = typeConfig[customer.type].icon;
      
      return (
        <div className="flex items-center space-x-3">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full",
            customer.type === "enterprise" ? "bg-yellow-100" :
            customer.type === "business" ? "bg-purple-100" : "bg-blue-100"
          )}>
            <TypeIcon className={cn("h-4 w-4", typeConfig[customer.type].color)} />
          </div>
          <div>
            <div className="font-medium">{customer.name}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span>{customer.email}</span>
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as keyof typeof typeConfig;
      const config = typeConfig[type];
      const Icon = config.icon;
      
      return (
        <div className="flex items-center space-x-2">
          <Icon className={cn("h-4 w-4", config.color)} />
          <span className="text-sm">{config.label}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as keyof typeof statusConfig;
      const config = statusConfig[status];
      const Icon = config.icon;
      
      return (
        <Badge variant={config.variant} className="gap-1">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "totalRevenue",
    header: "Total Revenue",
    cell: ({ row }) => {
      const amount = row.getValue("totalRevenue") as number;
      const currency = row.original.currency;
      
      return (
        <div className="font-medium">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
          }).format(amount)}
        </div>
      );
    },
  },
  {
    accessorKey: "outstandingBalance",
    header: "Outstanding",
    cell: ({ row }) => {
      const amount = row.getValue("outstandingBalance") as number;
      const currency = row.original.currency;
      
      if (amount === 0) {
        return <span className="text-muted-foreground">—</span>;
      }
      
      return (
        <div className={cn(
          "font-medium",
          amount > 0 ? "text-orange-500" : "text-green-500"
        )}>
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
          }).format(amount)}
        </div>
      );
    },
  },
  {
    accessorKey: "totalInvoices",
    header: "Invoices",
    cell: ({ row }) => {
      const customer = row.original;
      
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium">
            {customer.totalInvoices} total
          </div>
          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
            <span className="text-green-600">{customer.paidInvoices} paid</span>
            {customer.overdueInvoices > 0 && (
              <span className="text-red-600">{customer.overdueInvoices} overdue</span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "averagePaymentTime",
    header: "Avg Payment",
    cell: ({ row }) => {
      const days = row.getValue("averagePaymentTime") as number;
      
      return (
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{days} days</span>
        </div>
      );
    },
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.getValue("tags") as string[];
      
      if (!tags || tags.length === 0) {
        return <span className="text-muted-foreground text-sm">No tags</span>;
      }
      
      return (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 2}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "lastActivityAt",
    header: "Last Activity",
    cell: ({ row }) => {
      const lastActivity = row.getValue("lastActivityAt") as string;
      const updatedAt = row.original.updatedAt;
      const dateToUse = lastActivity || updatedAt;
      
      if (!dateToUse) {
        return <span className="text-muted-foreground">No activity</span>;
      }
      
      const isRecent = new Date(dateToUse) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className={cn(
            "text-sm",
            isRecent && "text-green-600 font-medium"
          )}>
            {format(new Date(dateToUse), "MMM dd, yyyy")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "address",
    header: "Location",
    cell: ({ row }) => {
      const address = row.original.address;
      
      if (!address) {
        return <span className="text-muted-foreground">—</span>;
      }
      
      return (
        <div className="flex items-center space-x-2">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">
            {address.city}, {address.state}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "contactInfo",
    header: "Contact",
    cell: ({ row }) => {
      const customer = row.original;
      
      return (
        <div className="space-y-1">
          {customer.phone && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.website && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{customer.website.replace('https://www.', '')}</span>
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
  },
];