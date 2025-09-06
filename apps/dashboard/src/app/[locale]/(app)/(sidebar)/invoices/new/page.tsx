"use client";

import { InvoiceForm } from "@/components/forms/invoice-form";
import { Button } from "@midday/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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
  status: string;
  customerId: string;
  customerName?: string;
}

interface GroupedJobData {
  customerId: string;
  customerName: string;
  jobIds: string[];
  totalAmount: number;
  monthYear: string;
}

interface SelectedJobGroup {
  customerId: string;
  customerName: string;
  jobs: Job[];
}

export default function NewInvoicePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if coming from bulk job selection
    const fromJobs = searchParams.get("fromJobs");
    const bulk = searchParams.get("bulk");

    if (fromJobs) {
      // Individual job selection from table view
      const selectedJobsData = sessionStorage.getItem("selectedJobsForInvoice");
      if (selectedJobsData) {
        const jobGroups: SelectedJobGroup[] = JSON.parse(selectedJobsData);

        // For now, handle the first customer group
        // In a real app, you might want to let user select which customer to invoice
        if (jobGroups.length > 0) {
          const group = jobGroups[0];
          const lineItems = group.jobs.map((job) => ({
            description: {
              type: "doc",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: `Job #${job.jobNumber}${job.addressSite ? ` - ${job.addressSite}` : ""}${job.materialType ? ` - ${job.materialType}` : ""}${job.equipmentType ? ` (${job.equipmentType})` : ""}`,
                    },
                  ],
                },
              ],
            },
            quantity: job.cubicMetreCapacity || 1,
            price: job.pricePerUnit || 0,
            unit: job.cubicMetreCapacity ? "m³" : undefined,
            jobId: job.id,
          }));

          setInvoiceData({
            customerId: group.customerId,
            customerName: group.customerName,
            lineItems,
            fromJobs: true,
          });
        }

        // Clear the session storage
        sessionStorage.removeItem("selectedJobsForInvoice");
      }
    } else if (bulk) {
      // Bulk selection from grouped view
      const bulkData = sessionStorage.getItem("bulkInvoiceData");
      if (bulkData) {
        const groupedData: GroupedJobData[] = JSON.parse(bulkData);

        // For demonstration, we'll create separate invoices for each group
        // In production, you might want to show a list for user to select
        if (groupedData.length > 0) {
          const firstGroup = groupedData[0];

          // Note: In a real implementation, you'd fetch the actual job details
          // For now, we'll create placeholder line items
          setInvoiceData({
            customerId: firstGroup.customerId,
            customerName: firstGroup.customerName,
            // These would be populated with actual job data
            lineItems: firstGroup.jobIds.map((jobId, index) => ({
              description: {
                type: "doc",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: `Job from ${firstGroup.monthYear}`,
                      },
                    ],
                  },
                ],
              },
              quantity: 1,
              price: 0,
              jobId,
            })),
            fromBulk: true,
            totalGroups: groupedData.length,
          });
        }

        // Clear the session storage
        sessionStorage.removeItem("bulkInvoiceData");
      }
    }

    setLoading(false);
  }, [searchParams]);

  const handleBack = () => {
    router.push("/jobs");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Create Invoice</h1>
      </div>

      {invoiceData?.fromJobs && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Creating invoice from selected jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Line items have been automatically populated from your selected
              jobs. You can edit them as needed before creating the invoice.
            </p>
          </CardContent>
        </Card>
      )}

      {invoiceData?.fromBulk && invoiceData?.totalGroups > 1 && (
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
              Multiple customer groups selected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              You selected {invoiceData.totalGroups} customer groups. Creating
              invoice for: {invoiceData.customerName}
            </p>
          </CardContent>
        </Card>
      )}

      <InvoiceForm initialData={invoiceData} mode="create" />
    </div>
  );
}
