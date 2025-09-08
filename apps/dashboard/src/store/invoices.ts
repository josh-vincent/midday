import type { RowSelectionState, Updater } from "@tanstack/react-table";
import { create } from "zustand";

export type Invoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName?: string;
  issueDate: string;
  dueDate?: string;
  subtotal: number;
  tax?: number;
  totalAmount: number;
  status: "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled";
  currency?: string;
  note?: string;
  createdAt: string;
  updatedAt?: string;
};

interface InvoicesState {
  rowSelection: Record<string, boolean>;
  setRowSelection: (updater: Updater<RowSelectionState>) => void;
  resetRowSelection: () => void;
  columnVisibility: Record<string, boolean>;
  setColumnVisibility: (visibility: Record<string, boolean>) => void;
  filters: {
    search: string;
    status: string[];
    dateRange?: { from: Date | null; to: Date | null };
  };
  setFilters: (filters: InvoicesState["filters"]) => void;
  invoices: Invoice[];
  setInvoices: (invoices: Invoice[]) => void;
  openInvoiceSheet: boolean;
  setOpenInvoiceSheet: (open: boolean) => void;
}

export const useInvoicesStore = create<InvoicesState>((set) => ({
  rowSelection: {},
  setRowSelection: (updater: Updater<RowSelectionState>) =>
    set((state) => {
      return {
        rowSelection:
          typeof updater === "function" ? updater(state.rowSelection) : updater,
      };
    }),
  resetRowSelection: () => set({ rowSelection: {} }),
  columnVisibility: {
    invoiceNumber: true,
    customer: true,
    issueDate: true,
    dueDate: true,
    amount: true,
    status: true,
    actions: true,
  },
  setColumnVisibility: (visibility) => set({ columnVisibility: visibility }),
  filters: {
    search: "",
    status: [],
  },
  setFilters: (filters) => set({ filters }),
  invoices: [],
  setInvoices: (invoices) => set({ invoices }),
  openInvoiceSheet: false,
  setOpenInvoiceSheet: (open) => set({ openInvoiceSheet: open }),
}));