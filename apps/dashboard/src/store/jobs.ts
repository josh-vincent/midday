import type { RowSelectionState, Updater } from "@tanstack/react-table";
import { create } from "zustand";

// Use the same Job type from columns
export type Job = {
  id: string;
  jobNumber: string;
  jobDate: string | null;
  companyName: string | null;
  customerName?: string | null;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "invoiced";
  totalAmount: number | null;
  currency: string;
  teamId: string;
  customerId: string | null;
  volume: number | null;
  weight: number | null;
  createdAt: string;
  updatedAt: string;
};

interface JobsState {
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
  setFilters: (filters: JobsState["filters"]) => void;
  jobs: Job[];
  setJobs: (jobs: Job[]) => void;
  openJobSheet: boolean;
  setOpenJobSheet: (open: boolean) => void;
}

export const useJobsStore = create<JobsState>((set) => ({
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
    jobNumber: true,
    jobDate: true,
    companyName: true,
    description: true,
    status: true,
    volume: true,
    weight: true,
    totalAmount: true,
  },
  setColumnVisibility: (visibility) => set({ columnVisibility: visibility }),
  filters: {
    search: "",
    status: [],
  },
  setFilters: (filters) => set({ filters }),
  jobs: [],
  setJobs: (jobs) => set({ jobs }),
  openJobSheet: false,
  setOpenJobSheet: (open) => set({ openJobSheet: open }),
}));
