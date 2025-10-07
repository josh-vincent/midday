"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Overview() {
  const trpc = useTRPC();
  const router = useRouter();

  const { data: customersData, isLoading: customersLoading } = useQuery(
    trpc.customers.get.queryOptions({
      pageSize: 1,
    })
  );

  const { data: templateConfig, isLoading: templateLoading } = useQuery(
    trpc.invoice.templateIsConfigured.queryOptions()
  );

  const hasCustomers = customersData?.data && customersData.data.length > 0;
  const hasInvoiceTemplate = templateConfig?.isConfigured ?? false;

  return (
    <div className="flex flex-col mt-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/jobs"
          className="group p-6 border rounded-lg hover:border-primary transition-colors"
        >
          <h3 className="font-semibold mb-2 group-hover:text-primary">
            Jobs
          </h3>
          <p className="text-sm text-muted-foreground">
            Create and manage jobs
          </p>
        </Link>
        <Link
          href="/invoices"
          className="group p-6 border rounded-lg hover:border-primary transition-colors"
        >
          <h3 className="font-semibold mb-2 group-hover:text-primary">
            Invoices
          </h3>
          <p className="text-sm text-muted-foreground">
            Create and manage invoices
          </p>
        </Link>

        <Link
          href="/customers"
          className="group p-6 border rounded-lg hover:border-primary transition-colors"
        >
          <h3 className="font-semibold mb-2 group-hover:text-primary">
            Customers
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage customer information
          </p>
        </Link>

        <div
          className="group p-6 border rounded-lg hover:border-primary transition-colors cursor-pointer"
          onClick={() => {
            // Open a dropdown or modal for quick add options
            const quickAddMenu = document.getElementById('quick-add-menu');
            if (quickAddMenu) {
              quickAddMenu.classList.toggle('hidden');
            }
          }}
        >
          <h3 className="font-semibold mb-2 group-hover:text-primary">
            Quick Add
          </h3>
          <p className="text-sm text-muted-foreground">
            Quickly create new items
          </p>
          <div id="quick-add-menu" className="hidden mt-4 space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={(e) => {
                e.stopPropagation();
                router.push("/jobs?createJob=true");
              }}
            >
              + New Job
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={(e) => {
                e.stopPropagation();
                router.push("/invoices?createInvoice=true");
              }}
            >
              + New Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={(e) => {
                e.stopPropagation();
                router.push("/customers?createCustomer=true");
              }}
            >
              + New Customer
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/gatekeeper" className="group p-6 border rounded-lg hover:border-primary transition-colors">
          <h3 className="font-semibold mb-2 group-hover:text-primary">
            Gatekeeper
          </h3>
          <p className="text-sm text-muted-foreground">
            Create and manage daily entries 
          </p>
        </Link>
      </div>
      </div>

      {!customersLoading && !templateLoading && (!hasCustomers || !hasInvoiceTemplate) && (
        <div className="flex items-center justify-center min-h-[calc(100vh-300px)]">
          <div className="flex flex-col items-center space-y-8">
            {!hasCustomers && (
              <div className="flex flex-col items-center">
                <div className="text-center mb-6 space-y-2">
                  <h2 className="font-medium text-lg">Add your first customer to get started</h2>
                  <p className="text-[#606060] text-sm">
                    You haven't created any customers yet. <br />
                    Create your first customer to begin managing jobs and invoices.
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={() => router.push("/customers?createCustomer=true")}
                >
                  Add customer
                </Button>
              </div>
            )}

            {hasCustomers && !hasInvoiceTemplate && (
              <div className="flex flex-col items-center">
                <div className="text-center mb-6 space-y-2">
                  <h2 className="font-medium text-lg">Setup your invoice templates</h2>
                  <p className="text-[#606060] text-sm">
                    Configure your company details and payment information <br />
                    to start creating professional invoices.
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={() => router.push("/settings/invoice")}
                >
                  Setup invoicing
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
