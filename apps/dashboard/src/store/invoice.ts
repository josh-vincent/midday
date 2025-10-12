import type { Column, RowSelectionState, Updater } from "@tanstack/react-table";
import { create } from "zustand";

interface InvoiceState {
  columns: Column<any, unknown>[];
  setColumns: (columns?: Column<any, unknown>[]) => void;
  rowSelection: Record<string, boolean>;
  setRowSelection: (updater: Updater<RowSelectionState>) => void;
  resetRowSelection: () => void;
  columnVisibility: Record<string, boolean>;
  setColumnVisibility: (visibility: Record<string, boolean>) => void;
}

export const useInvoiceStore = create<InvoiceState>()((set) => ({
  columns: [],
  setColumns: (columns) => set({ columns: columns || [] }),
  rowSelection: {},
  setRowSelection: (updater: Updater<RowSelectionState>) =>
    set((state) => {
      return {
        rowSelection:
          typeof updater === "function" ? updater(state.rowSelection) : updater,
      };
    }),
  resetRowSelection: () => set({ rowSelection: {} }),
  columnVisibility: {},
  setColumnVisibility: (visibility) => set({ columnVisibility: visibility }),
}));
