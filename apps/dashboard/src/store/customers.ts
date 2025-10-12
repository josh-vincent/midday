import type { RowSelectionState, Updater } from "@tanstack/react-table";
import { create } from "zustand";

interface CustomersState {
  columnVisibility: Record<string, boolean>;
  setColumnVisibility: (visibility: Record<string, boolean>) => void;
  rowSelection: Record<string, boolean>;
  setRowSelection: (updater: Updater<RowSelectionState>) => void;
  resetRowSelection: () => void;
}

export const useCustomersStore = create<CustomersState>((set) => ({
  columnVisibility: {
    contact: true,
    email: true,
    invoices: true,
    projects: true,
    tags: true,
    address: true,
  },
  setColumnVisibility: (visibility) => set({ columnVisibility: visibility }),
  rowSelection: {},
  setRowSelection: (updater: Updater<RowSelectionState>) =>
    set((state) => {
      return {
        rowSelection:
          typeof updater === "function" ? updater(state.rowSelection) : updater,
      };
    }),
  resetRowSelection: () => set({ rowSelection: {} }),
}));
