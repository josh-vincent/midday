import { create } from "zustand";

interface Job {
  id: string;
  jobNumber: string;
  contactPerson?: string;
  contactNumber?: string;
  rego?: string;
  loadNumber?: number;
  companyName?: string;
  addressSite?: string;
  equipmentType?: string;
  materialType?: string;
  pricePerUnit?: number;
  cubicMetreCapacity?: number;
  jobDate?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  totalAmount?: number;
  customerId: string;
  customerName?: string;
  createdAt: string;
  updatedAt?: string;
}

interface JobsState {
  rowSelection: Record<string, boolean>;
  setRowSelection: (selection: Record<string, boolean>) => void;
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
  setRowSelection: (selection) => set({ rowSelection: selection }),
  columnVisibility: {
    jobDate: true,
    jobNumber: true,
    contact: true,
    vehicle: true,
    material: true,
    amount: true,
    status: true,
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
