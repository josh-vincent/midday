import { create } from "zustand";

interface CustomersState {
  columnVisibility: Record<string, boolean>;
  setColumnVisibility: (visibility: Record<string, boolean>) => void;
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
}));
