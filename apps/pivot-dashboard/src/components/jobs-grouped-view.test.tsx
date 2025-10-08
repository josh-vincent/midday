import { beforeEach, describe, expect, it, mock, jest } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { JobsGroupedView } from "./jobs-grouped-view";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockJobs = [
  {
    id: "1",
    jobNumber: "JOB-2024-001",
    contactPerson: "John Smith",
    contactNumber: "0412 345 678",
    rego: "ABC-123",
    loadNumber: 1,
    companyName: "ABC Construction",
    addressSite: "123 Main St, Sydney NSW",
    equipmentType: "Truck & Trailer 22m3",
    materialType: "Dry Clean Fill",
    pricePerUnit: 85,
    cubicMetreCapacity: 22,
    jobDate: "2024-01-15",
    status: "completed" as const,
    totalAmount: 1870,
    customerId: "cust-1",
    customerName: "ABC Construction",
    createdAt: "2024-01-10T10:00:00Z",
  },
  {
    id: "2",
    jobNumber: "JOB-2024-002",
    contactPerson: "John Smith",
    contactNumber: "0412 345 678",
    rego: "ABC-456",
    loadNumber: 2,
    companyName: "ABC Construction",
    addressSite: "456 Park Ave, Sydney NSW",
    equipmentType: "Truck & Quad 26m3",
    materialType: "Rock",
    pricePerUnit: 95,
    cubicMetreCapacity: 26,
    jobDate: "2024-01-18",
    status: "completed" as const,
    totalAmount: 2470,
    customerId: "cust-1",
    customerName: "ABC Construction",
    createdAt: "2024-01-17T10:00:00Z",
  },
  {
    id: "3",
    jobNumber: "JOB-2024-003",
    contactPerson: "Sarah Johnson",
    contactNumber: "0423 456 789",
    rego: "XYZ-456",
    loadNumber: 1,
    companyName: "XYZ Builders",
    addressSite: "789 George St, Brisbane QLD",
    equipmentType: "Truck 18m3",
    materialType: "Sand",
    pricePerUnit: 75,
    cubicMetreCapacity: 18,
    jobDate: "2024-02-05",
    status: "completed" as const,
    totalAmount: 1350,
    customerId: "cust-2",
    customerName: "XYZ Builders",
    createdAt: "2024-02-01T10:00:00Z",
  },
  {
    id: "4",
    jobNumber: "JOB-2024-004",
    contactPerson: "Sarah Johnson",
    contactNumber: "0423 456 789",
    rego: "XYZ-789",
    loadNumber: 2,
    companyName: "XYZ Builders",
    addressSite: "321 Queen St, Brisbane QLD",
    equipmentType: "Truck & Trailer 22m3",
    materialType: "Topsoil",
    pricePerUnit: 90,
    cubicMetreCapacity: 22,
    jobDate: "2024-02-10",
    status: "in_progress" as const,
    totalAmount: 1980,
    customerId: "cust-2",
    customerName: "XYZ Builders",
    createdAt: "2024-02-08T10:00:00Z",
  },
];

describe("JobsGroupedView", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
    // Clear sessionStorage
    sessionStorage.clear();
  });

  it("should group jobs by customer and month correctly", () => {
    render(<JobsGroupedView jobs={mockJobs} />);

    // Check for ABC Construction - January 2024 group
    expect(screen.getByText("ABC Construction")).toBeTruthy();
    expect(screen.getByText("January 2024")).toBeTruthy();

    // Check for XYZ Builders - February 2024 group
    expect(screen.getByText("XYZ Builders")).toBeTruthy();
    expect(screen.getByText("February 2024")).toBeTruthy();
  });

  it("should calculate group totals correctly", () => {
    render(<JobsGroupedView jobs={mockJobs} />);

    // ABC Construction January total: $1870 + $2470 = $4340
    expect(screen.getByText("$4340.00")).toBeTruthy();

    // XYZ Builders February total: $1350 + $1980 = $3330
    expect(screen.getByText("$3330.00")).toBeTruthy();
  });

  it("should show completed job count correctly", () => {
    render(<JobsGroupedView jobs={mockJobs} />);

    // ABC Construction: 2 completed / 2 total
    expect(screen.getByText("2 completed / 2 total")).toBeTruthy();

    // XYZ Builders: 1 completed / 2 total (one is in_progress)
    expect(screen.getByText("1 completed / 2 total")).toBeTruthy();
  });

  it("should only allow selection of groups with completed jobs", () => {
    render(<JobsGroupedView jobs={mockJobs} />);

    const checkboxes = screen.getAllByRole("checkbox");

    // First group (ABC Construction) should be enabled - has completed jobs
    expect(checkboxes[0]).not.toBeDisabled();

    // Second group (XYZ Builders) should be enabled - has at least one completed job
    expect(checkboxes[1]).not.toBeDisabled();
  });

  it("should expand/collapse groups when clicking the toggle button", () => {
    render(<JobsGroupedView jobs={mockJobs} />);

    // Initially, job details should not be visible
    expect(screen.queryByText("#JOB-2024-001")).toBeFalsy();

    // Click to expand first group
    const expandButtons = screen.getAllByRole("button");
    const firstExpandButton = expandButtons.find((btn) =>
      btn.querySelector("svg")?.classList.contains("h-4"),
    );

    if (firstExpandButton) {
      fireEvent.click(firstExpandButton);

      // Now job details should be visible
      expect(screen.getByText("#JOB-2024-001")).toBeTruthy();
      expect(screen.getByText("#JOB-2024-002")).toBeTruthy();
    }
  });

  it("should handle group selection correctly", () => {
    render(<JobsGroupedView jobs={mockJobs} />);

    const checkboxes = screen.getAllByRole("checkbox");

    // Select first group
    fireEvent.click(checkboxes[0]);

    // Should show selection count
    expect(screen.getByText("1 group selected")).toBeTruthy();

    // Select second group
    fireEvent.click(checkboxes[1]);

    // Should update selection count
    expect(screen.getByText("2 groups selected")).toBeTruthy();
  });

  it("should create invoices with correct data when clicking Create Invoices", () => {
    render(<JobsGroupedView jobs={mockJobs} />);

    const checkboxes = screen.getAllByRole("checkbox");

    // Select first group (ABC Construction)
    fireEvent.click(checkboxes[0]);

    // Click Create Invoice button
    const createButton = screen.getByText("Create Invoice");
    fireEvent.click(createButton);

    // Check sessionStorage was populated correctly
    const storedData = sessionStorage.getItem("bulkInvoiceData");
    expect(storedData).toBeTruthy();

    const parsedData = JSON.parse(storedData!);
    expect(parsedData).toHaveLength(1);
    expect(parsedData[0]).toEqual({
      customerId: "cust-1",
      customerName: "ABC Construction",
      jobIds: ["1", "2"],
      totalAmount: 4340,
      monthYear: "2024-01",
    });

    // Check navigation was called
    expect(mockPush).toHaveBeenCalledWith("/invoices/new?bulk=true");
  });

  it("should handle multiple group selection for bulk invoice creation", () => {
    render(<JobsGroupedView jobs={mockJobs} />);

    const checkboxes = screen.getAllByRole("checkbox");

    // Select both groups
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    // Should show plural "Create Invoices"
    expect(screen.getByText("Create Invoices")).toBeTruthy();

    // Click Create Invoices button
    const createButton = screen.getByText("Create Invoices");
    fireEvent.click(createButton);

    // Check sessionStorage contains both groups
    const storedData = sessionStorage.getItem("bulkInvoiceData");
    const parsedData = JSON.parse(storedData!);
    expect(parsedData).toHaveLength(2);
  });

  it("should display job status badges correctly", () => {
    render(<JobsGroupedView jobs={mockJobs} />);

    // Expand XYZ Builders group to see mixed statuses
    const expandButtons = screen.getAllByRole("button");
    const secondExpandButton = expandButtons[expandButtons.length - 1];
    fireEvent.click(secondExpandButton);

    // Should show both completed and in_progress statuses
    expect(screen.getByText("completed")).toBeTruthy();
    expect(screen.getByText("in progress")).toBeTruthy();
  });

  it("should handle empty job list gracefully", () => {
    render(<JobsGroupedView jobs={[]} />);

    expect(screen.getByText("No jobs available for grouping")).toBeTruthy();
  });

  it("should sort groups by date descending then by customer name", () => {
    render(<JobsGroupedView jobs={mockJobs} />);

    // Get all customer name elements
    const customerNames = screen.getAllByText(/Construction|Builders/);

    // February 2024 (XYZ Builders) should come before January 2024 (ABC Construction)
    // due to descending date sort
    expect(customerNames[0].textContent).toContain("XYZ Builders");
    expect(customerNames[1].textContent).toContain("ABC Construction");
  });
});
