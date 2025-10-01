"use client";

import { useState, useEffect, useMemo } from "react";
import { Table, TableBody } from "@midday/ui/table";
import { useToast } from "@midday/ui/use-toast";
import {
  type VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { columns } from "./columns";
import { NoResults, EmptyState, ErrorState, SyncingState } from "./empty-states";
import { EmailRow } from "./row";
import { TableHeader } from "./table-header";
import { EmailTableWrapperSkeleton } from "./skeleton";
import { emailAPI, type MockEmail } from "@/lib/mock/email-mock";

interface EmailDataTableProps {
  provider?: "gmail" | "outlook";
  onEmailSelect?: (email: MockEmail) => void;
  onComposeEmail?: () => void;
  onComposeReply?: (email: MockEmail) => void;
  onComposeForward?: (email: MockEmail) => void;
}

export function EmailDataTable({
  provider,
  onEmailSelect,
  onComposeEmail,
  onComposeReply,
  onComposeForward,
}: EmailDataTableProps) {
  const [emails, setEmails] = useState<MockEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const { toast } = useToast();

  // Load emails
  useEffect(() => {
    loadEmails();
  }, [provider]);

  const loadEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await emailAPI.getEmails(provider);
      setEmails(data);
    } catch (err) {
      setError("Failed to load emails. Please try again.");
      console.error("Error loading emails:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter emails based on search query
  const filteredEmails = useMemo(() => {
    if (!searchQuery) return emails;
    
    const query = searchQuery.toLowerCase();
    return emails.filter(email => 
      email.subject.toLowerCase().includes(query) ||
      email.from.name.toLowerCase().includes(query) ||
      email.from.email.toLowerCase().includes(query) ||
      email.snippet.toLowerCase().includes(query) ||
      email.labels.some(label => label.toLowerCase().includes(query))
    );
  }, [emails, searchQuery]);

  // Sort emails
  const sortedEmails = useMemo(() => {
    if (!sortField) {
      // Default sort by date descending (newest first)
      return [...filteredEmails].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return [...filteredEmails].sort((a, b) => {
      let aValue: any = a[sortField as keyof MockEmail];
      let bValue: any = b[sortField as keyof MockEmail];

      // Handle nested from object
      if (sortField === "from") {
        aValue = a.from.name;
        bValue = b.from.name;
      }

      // Handle date sorting
      if (sortField === "date") {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      }

      // Handle read status (convert boolean to string for consistent sorting)
      if (sortField === "read") {
        aValue = a.read ? "read" : "unread";
        bValue = b.read ? "read" : "unread";
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === "asc" ? comparison : -comparison;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [filteredEmails, sortField, sortDirection]);

  const table = useReactTable({
    data: sortedEmails,
    getRowId: ({ id }) => id,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
    meta: {
      onEmailSelect,
      onComposeReply,
      onComposeForward,
    },
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField("");
        setSortDirection("desc");
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleBulkAction = async (action: string, selectedRows: any[]) => {
    const emailIds = selectedRows.map(row => row.original.id);
    
    try {
      switch (action) {
        case "mark-read":
          await emailAPI.markAsRead(emailIds);
          setEmails(prev => prev.map(email => 
            emailIds.includes(email.id) ? { ...email, read: true } : email
          ));
          toast({
            title: "Emails marked as read",
            description: `${emailIds.length} email(s) marked as read.`,
          });
          break;
        
        case "star":
          setEmails(prev => prev.map(email => 
            emailIds.includes(email.id) ? { ...email, starred: !email.starred } : email
          ));
          toast({
            title: "Emails starred",
            description: `${emailIds.length} email(s) starred.`,
          });
          break;
        
        case "archive":
          await emailAPI.archiveEmails(emailIds);
          setEmails(prev => prev.filter(email => !emailIds.includes(email.id)));
          toast({
            title: "Emails archived",
            description: `${emailIds.length} email(s) archived.`,
          });
          break;
        
        case "delete":
          await emailAPI.deleteEmails(emailIds);
          setEmails(prev => prev.filter(email => !emailIds.includes(email.id)));
          toast({
            title: "Emails deleted",
            description: `${emailIds.length} email(s) deleted.`,
            variant: "destructive",
          });
          break;
      }
    } catch (err) {
      toast({
        title: "Action failed",
        description: "Failed to perform the action. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
  };

  const hasFilters = searchQuery.length > 0;

  if (loading) {
    return <EmailTableWrapperSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadEmails} />;
  }

  if (hasFilters && !sortedEmails.length) {
    return <NoResults searchQuery={searchQuery} onClearFilters={handleClearFilters} />;
  }

  if (!sortedEmails.length) {
    return <EmptyState onComposeEmail={onComposeEmail} />;
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto overscroll-x-none md:border-l md:border-r border-border scrollbar-hide">
        <Table>
          <TableHeader
            table={table}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onBulkAction={handleBulkAction}
          />

          <TableBody className="border-l-0 border-r-0">
            {table.getRowModel().rows.map((row) => (
              <EmailRow 
                key={row.id} 
                row={row} 
                onEmailSelect={onEmailSelect}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}