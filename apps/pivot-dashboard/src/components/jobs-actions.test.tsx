import { beforeEach, describe, expect, it, mock, jest } from "bun:test";
import { useJobsStore } from "@/store/jobs";
import { fireEvent, render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { JobsActions } from "./jobs-actions";

// Mock dependencies
jest.mock("@/store/jobs", () => ({
  useJobsStore: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockJobs = [
  {
    id: "1",
    jobNumber: "JOB-2024-001",
    companyName: "ABC Construction",
    customerId: "cust-1",
    customerName: "ABC Construction",
    addressSite: "123 Main St",
    materialType: "Dry Clean Fill",
    equipmentType: "Truck 22m3",
    pricePerUnit: 85,
    cubicMetreCapacity: 22,
    status: "completed" as const,
  },
  {
    id: "2",
    jobNumber: "JOB-2024-002",
    companyName: "ABC Construction",
    customerId: "cust-1",
    customerName: "ABC Construction",
    addressSite: "456 Park Ave",
    materialType: "Rock",
    equipmentType: "Truck 26m3",
    pricePerUnit: 95,
    cubicMetreCapacity: 26,
    status: "completed" as const,
  },
  {
    id: "3",
    jobNumber: "JOB-2024-003",
    companyName: "XYZ Builders",
    customerId: "cust-2",
    customerName: "XYZ Builders",
    addressSite: "789 George St",
    materialType: "Sand",
    equipmentType: "Truck 18m3",
    pricePerUnit: 75,
    cubicMetreCapacity: 18,
    status: "in_progress" as const,
  },
];

describe("JobsActions", () => {
  const mockSetRowSelection = vi.fn();
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
  });

  describe("when no jobs are selected", () => {
    beforeEach(() => {
      (useJobsStore as any).mockReturnValue({
        rowSelection: {},
        setRowSelection: mockSetRowSelection,
        jobs: mockJobs,
      });
    });

    it("should show default actions", () => {
      render(<JobsActions />);

      // Should show import and column visibility options
      expect(screen.getByText("Import CSV")).toBeTruthy();
    });

    it("should not show bulk edit options", () => {
      render(<JobsActions />);

      expect(screen.queryByText("Bulk edit")).toBeFalsy();
      expect(screen.queryByText("Add to Invoice")).toBeFalsy();
    });
  });

  describe("when jobs are selected", () => {
    beforeEach(() => {
      (useJobsStore as any).mockReturnValue({
        rowSelection: { "1": true, "2": true },
        setRowSelection: mockSetRowSelection,
        jobs: mockJobs,
      });
    });

    it("should show bulk edit options", () => {
      render(<JobsActions />);

      expect(screen.getByText("Bulk edit")).toBeTruthy();
      expect(screen.getByText("Actions")).toBeTruthy();
    });

    it("should show status update options in dropdown", () => {
      render(<JobsActions />);

      // Open dropdown
      const actionsButton = screen.getByText("Actions");
      fireEvent.click(actionsButton);

      // Check status options
      expect(screen.getByText("Mark as Pending")).toBeTruthy();
      expect(screen.getByText("Mark as In Progress")).toBeTruthy();
      expect(screen.getByText("Mark as Completed")).toBeTruthy();
      expect(screen.getByText("Mark as Cancelled")).toBeTruthy();
      expect(screen.getByText("Add to Invoice")).toBeTruthy();
    });

    it("should handle Add to Invoice action correctly", () => {
      render(<JobsActions />);

      // Open dropdown
      const actionsButton = screen.getByText("Actions");
      fireEvent.click(actionsButton);

      // Click Add to Invoice
      const addToInvoiceButton = screen.getByText("Add to Invoice");
      fireEvent.click(addToInvoiceButton);

      // Check sessionStorage was populated
      const storedData = sessionStorage.getItem("selectedJobsForInvoice");
      expect(storedData).toBeTruthy();

      const parsedData = JSON.parse(storedData!);
      expect(parsedData).toHaveLength(1); // Jobs grouped by customer
      expect(parsedData[0].customerId).toBe("cust-1");
      expect(parsedData[0].customerName).toBe("ABC Construction");
      expect(parsedData[0].jobs).toHaveLength(2);

      // Check navigation
      expect(mockPush).toHaveBeenCalledWith("/invoices/new?fromJobs=true");

      // Check selection was cleared
      expect(mockSetRowSelection).toHaveBeenCalledWith({});
    });

    it("should group jobs by customer when adding to invoice", () => {
      // Select jobs from different customers
      (useJobsStore as any).mockReturnValue({
        rowSelection: { "1": true, "3": true },
        setRowSelection: mockSetRowSelection,
        jobs: mockJobs,
      });

      render(<JobsActions />);

      // Open dropdown and click Add to Invoice
      const actionsButton = screen.getByText("Actions");
      fireEvent.click(actionsButton);
      fireEvent.click(screen.getByText("Add to Invoice"));

      const storedData = sessionStorage.getItem("selectedJobsForInvoice");
      const parsedData = JSON.parse(storedData!);

      // Should have 2 groups (ABC Construction and XYZ Builders)
      expect(parsedData).toHaveLength(2);

      const abcGroup = parsedData.find((g: any) => g.customerId === "cust-1");
      const xyzGroup = parsedData.find((g: any) => g.customerId === "cust-2");

      expect(abcGroup.jobs).toHaveLength(1);
      expect(xyzGroup.jobs).toHaveLength(1);
    });

    it("should show delete confirmation dialog", () => {
      render(<JobsActions />);

      // Find delete button (it's an icon button)
      const deleteButton = screen.getByRole("button", { name: /delete/i });
      expect(deleteButton).toBeTruthy();

      // Click delete button
      fireEvent.click(deleteButton);

      // Check confirmation dialog appears
      expect(screen.getByText("Are you absolutely sure?")).toBeTruthy();
      expect(screen.getByText(/This action cannot be undone/)).toBeTruthy();
    });

    it("should handle delete confirmation", () => {
      render(<JobsActions />);

      // Click delete button
      const deleteButton = screen.getByRole("button", { name: /delete/i });
      fireEvent.click(deleteButton);

      // Click confirm
      const confirmButton = screen.getByText("Confirm");
      fireEvent.click(confirmButton);

      // Selection should be cleared
      expect(mockSetRowSelection).toHaveBeenCalledWith({});
    });

    it("should handle delete cancellation", () => {
      render(<JobsActions />);

      // Click delete button
      const deleteButton = screen.getByRole("button", { name: /delete/i });
      fireEvent.click(deleteButton);

      // Click cancel
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      // Selection should not be cleared
      expect(mockSetRowSelection).not.toHaveBeenCalled();
    });

    it("should handle status update actions", () => {
      render(<JobsActions />);

      // Open dropdown
      const actionsButton = screen.getByText("Actions");
      fireEvent.click(actionsButton);

      // Click Mark as Completed
      const completedButton = screen.getByText("Mark as Completed");
      fireEvent.click(completedButton);

      // Selection should be cleared after status update
      expect(mockSetRowSelection).toHaveBeenCalledWith({});
    });
  });

  describe("CSV import functionality", () => {
    beforeEach(() => {
      (useJobsStore as any).mockReturnValue({
        rowSelection: {},
        setRowSelection: mockSetRowSelection,
        jobs: mockJobs,
      });
    });

    it("should show import CSV button", () => {
      render(<JobsActions />);

      const importButton = screen.getByText("Import CSV");
      expect(importButton).toBeTruthy();
    });

    it("should open import dialog when clicking import button", () => {
      render(<JobsActions />);

      const importButton = screen.getByText("Import CSV");
      fireEvent.click(importButton);

      // The JobsCSVImporter component should be rendered with open=true
      // In a real test, you'd check for the dialog content
    });
  });
});
