import type { RowSelectionState, Updater } from "@tanstack/react-table";
import { z } from "zod";
import { create } from "zustand";

const jobSchema = z.object({
  customerId: z.string().optional().nullable(),
  jobNumber: z.string().optional(),
  contactPerson: z.string().optional(),
  contactNumber: z.string().optional(),
  rego: z.string().optional(),
  loadNumber: z.number().optional(),
  companyName: z.string().optional(),
  addressSite: z.string().optional(),
  equipmentType: z.string().optional(),
  materialType: z.string().optional(),
  pricePerUnit: z.number().optional(),
  cubicMetreCapacity: z.number().optional(),
  jobDate: z.date().optional(),
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled", "delivered"])
    .default("delivered"),
  notes: z.string().optional(),
});

type JobData = z.infer<typeof jobSchema>;

// Use the same Job type from columns
export type Job = {
  id: string;
  jobNumber: string;
  jobDate: string | null;
  companyName: string | null;
  customerName?: string | null;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "delivered";
  totalAmount: number | null;
  currency: string;
  teamId: string;
  rego: string | null;
  pricePerUnit: number | null;
  cubicMetreCapacity: number | null;
  loadNumber: number | null;
  contactPerson: string | null;
  contactNumber: string | null;
  notes: string | null;
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
  jobs: JobData[];
  setJobs: (jobs: JobData[]) => void;
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
    addressSite: true,
    status: true,
    rego: true,
    pricePerUnit: true,
    cubicMetreCapacity: true,
    loadNumber: true,
    contactPerson: true,
    contactNumber: true,
    notes: true,
    cubicMeterCapacity: false,
    weight: false,
    description: false,
    volume: false,
    totalAmount: true
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
