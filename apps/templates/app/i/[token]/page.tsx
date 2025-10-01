import CustomerHeader from "@/components/customer-header";
import { InvoiceAttachedJobs } from "@/components/invoice-attached-jobs";
import InvoiceToolbar from "@/components/invoice-toolbar";
import { invoicesAPI, type MockInvoice } from "@/lib/mock/invoices-mock";
import { HtmlTemplate } from "@midday/invoice-core";
import type { Invoice } from "@midday/invoice-core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;

  try {
    const invoice = await invoicesAPI.getInvoiceByToken(params.token);

    if (!invoice) {
      return {
        title: "Invoice Not Found",
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const title = `Invoice ${invoice.invoiceNumber} | Midday Templates`;
    const description = `Invoice for ${invoice.customerName || invoice.customer?.name || "Customer"}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  } catch (error) {
    return {
      title: "Invoice Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default async function Page(props: Props) {
  const params = await props.params;
  
  let invoice = null;

  // Handle temporary preview tokens
  if (params.token.startsWith('temp_')) {
    // For temporary tokens, we'll create a demo invoice
    // In a real app, this would come from session storage or be passed via state
    invoice = {
      id: 'preview',
      invoiceNumber: 'INV-PREVIEW',
      number: 'INV-PREVIEW',
      token: params.token,
      status: 'draft' as const,
      currency: 'USD',
      customer: {
        id: 'demo',
        name: 'Demo Customer',
        email: 'demo@example.com',
      },
      customerName: 'Demo Customer',
      template: { size: 'letter' },
      lineItems: [
        {
          name: 'Demo Service',
          description: 'A sample service for preview',
          quantity: 1,
          price: 100,
          total: 100,
        },
        {
          name: 'Another Service',
          description: 'Another sample service with job',
          quantity: 2,
          price: 50,
          total: 100,
          jobId: 'job_123',
          jobNumber: 'JOB-1001',
        },
      ],
    };
  } else {
    invoice = await invoicesAPI.getInvoiceByToken(params.token);
  }

  if (!invoice) {
    notFound();
  }

  // Convert the invoice to match the format expected by HtmlTemplate
  const defaultTemplate = {
    customerLabel: "Bill to",
    title: "Invoice",
    fromLabel: "From",
    invoiceNoLabel: "Invoice No",
    issueDateLabel: "Issue Date",
    dueDateLabel: "Due Date",
    descriptionLabel: "Description",
    priceLabel: "Price",
    quantityLabel: "Quantity",
    totalLabel: "Total",
    totalSummaryLabel: "Total",
    vatLabel: "VAT",
    subtotalLabel: "Subtotal",
    taxLabel: "Tax",
    discountLabel: "Discount",
    timezone: "UTC",
    paymentLabel: "Payment Details",
    noteLabel: "Note",
    logoUrl: null,
    currency: invoice.currency || "USD",
    paymentDetails: null,
    fromDetails: {
      type: "doc" as const,
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Midday Templates Inc.\n123 Business St.\nSan Francisco, CA 94105",
            },
          ],
        },
      ],
    },
    dateFormat: "MM/dd/yyyy",
    includeVat: false,
    includeTax: true,
    includeDiscount: true,
    includeDecimals: true,
    includeUnits: false,
    includeQr: false,
    taxRate: 10,
    vatRate: 0,
    size: (invoice.template?.size || "letter") as "a4" | "letter",
    locale: "en-US",
  };

  const invoiceData: Invoice = {
    id: invoice.id,
    dueDate: invoice.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    invoiceNumber: invoice.invoiceNumber || invoice.number || "INV-001",
    createdAt: new Date().toISOString(),
    amount: invoice.amount || 0,
    currency: invoice.currency || "USD",
    lineItems: (invoice.lineItems || []).map(item => ({
      id: item.id || Math.random().toString(36).substring(7),
      description: item.description || item.name,
      price: item.price || 0,
      quantity: item.quantity || 1,
      total: item.total || (item.price * (item.quantity || 1)),
      name: item.name,
      jobId: item.jobId,
      jobNumber: item.jobNumber,
    })),
    paymentDetails: null,
    customerDetails: invoice.customer ? {
      type: "doc" as const,
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `${invoice.customer.name}\n${invoice.customer.email || ""}${invoice.customer.address ? `\n${invoice.customer.address.street}\n${invoice.customer.address.city}, ${invoice.customer.address.state} ${invoice.customer.address.zip}` : ""}`,
            },
          ],
        },
      ],
    } : null,
    reminderSentAt: null,
    updatedAt: new Date().toISOString(),
    note: invoice.notes || null,
    internalNote: null,
    paidAt: null,
    vat: 0,
    tax: defaultTemplate.taxRate * ((invoice.subtotal || 0) / 100),
    filePath: null,
    status: (invoice.status || "draft") as any,
    viewedAt: null,
    fromDetails: defaultTemplate.fromDetails,
    issueDate: invoice.date || new Date().toISOString(),
    sentAt: null,
    template: {
      ...defaultTemplate,
      ...invoice.template,
    },
    noteDetails: invoice.notes ? {
      type: "doc" as const,
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: invoice.notes,
            },
          ],
        },
      ],
    } : null,
    customerName: invoice.customerName || invoice.customer?.name || "Customer",
    token: invoice.token || params.token,
    sentTo: null,
    discount: invoice.discount || 0,
    subtotal: invoice.subtotal || invoice.lineItems?.reduce((sum, item) => sum + (item.total || 0), 0) || 0,
    topBlock: null,
    bottomBlock: null,
    customer: invoice.customer ? {
      name: invoice.customer.name || null,
      website: invoice.customer.website || null,
      email: invoice.customer.email || null,
    } : null,
    customerId: invoice.customerId || null,
    team: {
      name: "Midday Templates",
    },
  };

  const width = invoiceData.template.size === "letter" ? 750 : 595;
  const height = invoiceData.template.size === "letter" ? 1056 : 842;

  return (
    <div className="flex flex-col justify-center items-center min-h-screen dotted-bg p-4 sm:p-6 md:p-0">
      <div
        className="flex flex-col w-full max-w-full py-6"
        style={{ maxWidth: width }}
      >
        <CustomerHeader
          name={invoice.customerName || (invoice.customer?.name as string)}
          website={invoice.customer?.website}
          status={invoice.status as any}
        />
        {invoice.lineItems && invoice.lineItems.length > 0 && (
          <div className="flex justify-end mb-4">
            <InvoiceAttachedJobs 
              lineItems={invoice.lineItems as any} 
              currency={invoice.currency}
            />
          </div>
        )}
        <div className="pb-24 md:pb-0">
          <div className="shadow-[0_24px_48px_-12px_rgba(0,0,0,0.3)] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]">
            <HtmlTemplate data={invoiceData} width={width} height={height} />
          </div>
        </div>
      </div>

      <InvoiceToolbar
        token={invoice.token || params.token}
        invoiceNumber={invoice.invoiceNumber || invoice.number}
      />

      <div className="fixed bottom-4 right-4 hidden md:block">
        <a
          href="https://midday.ai?utm_source=invoice"
          target="_blank"
          rel="noreferrer"
          className="text-[9px] text-[#878787]"
        >
          Powered by <span className="text-primary">midday</span>
        </a>
      </div>
    </div>
  );
}