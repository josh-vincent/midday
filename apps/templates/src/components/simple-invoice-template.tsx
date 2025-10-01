import { formatAmount } from "@midday/utils/format";

interface Props {
  data: any;
  width: number;
  height: number;
}

export function SimpleInvoiceTemplate({ data, width, height }: Props) {
  const {
    invoiceNumber,
    issueDate,
    dueDate,
    lineItems = [],
    customerName,
    currency = "USD",
    discount = 0,
    template,
    customerDetails,
    fromDetails,
    noteDetails,
  } = data;

  const subtotal = lineItems.reduce((sum: number, item: any) => {
    return sum + (item.total || item.price * item.quantity || 0);
  }, 0);
  
  const tax = template?.includeTax ? subtotal * (template.taxRate / 100) : 0;
  const discountAmount = discount;
  const total = subtotal + tax - discountAmount;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div 
      className="bg-background border border-border w-full h-full overflow-auto"
      style={{ width: "100%", maxWidth: width, height }}
    >
      <div className="p-8 h-full flex flex-col" style={{ minHeight: height - 5 }}>
        {/* Header */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">{template?.title || "Invoice"}</h1>
            <div className="text-sm space-y-1">
              <div className="flex gap-2">
                <span className="text-muted-foreground">Invoice #:</span>
                <span className="font-medium">{invoiceNumber}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">Issue Date:</span>
                <span>{formatDate(issueDate)}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">Due Date:</span>
                <span>{formatDate(dueDate)}</span>
              </div>
            </div>
          </div>
          
          {template?.logoUrl && (
            <img 
              src={template.logoUrl} 
              alt="Logo" 
              className="h-12 object-contain"
            />
          )}
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs text-muted-foreground font-medium mb-2">
              {template?.fromLabel || "From"}
            </h3>
            <div className="text-sm whitespace-pre-line">
              Midday Templates Inc.
              {"\n"}123 Business St.
              {"\n"}San Francisco, CA 94105
            </div>
          </div>
          
          <div>
            <h3 className="text-xs text-muted-foreground font-medium mb-2">
              {template?.customerLabel || "Bill To"}
            </h3>
            <div className="text-sm whitespace-pre-line">
              {customerName || "Customer"}
              {data.customer?.email && `\n${data.customer.email}`}
              {data.customer?.address && `\n${data.customer.address.street}\n${data.customer.address.city}, ${data.customer.address.state} ${data.customer.address.zip}`}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted-foreground py-2">
                  {template?.descriptionLabel || "Description"}
                </th>
                <th className="text-right text-xs text-muted-foreground py-2">
                  {template?.quantityLabel || "Qty"}
                </th>
                <th className="text-right text-xs text-muted-foreground py-2">
                  {template?.priceLabel || "Price"}
                </th>
                <th className="text-right text-xs text-muted-foreground py-2">
                  {template?.totalLabel || "Total"}
                </th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item: any, index: number) => (
                <tr key={index} className="border-b border-border/50">
                  <td className="py-3 text-sm">
                    {item.name || item.description}
                  </td>
                  <td className="text-right py-3 text-sm">
                    {item.quantity || 1}
                  </td>
                  <td className="text-right py-3 text-sm">
                    {formatAmount({
                      amount: item.price || 0,
                      currency,
                      locale: template?.locale || "en-US",
                    })}
                  </td>
                  <td className="text-right py-3 text-sm font-medium">
                    {formatAmount({
                      amount: item.total || (item.price * (item.quantity || 1)) || 0,
                      currency,
                      locale: template?.locale || "en-US",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="ml-auto w-64">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {template?.subtotalLabel || "Subtotal"}
              </span>
              <span>
                {formatAmount({
                  amount: subtotal,
                  currency,
                  locale: template?.locale || "en-US",
                })}
              </span>
            </div>
            
            {template?.includeTax && tax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {template?.taxLabel || "Tax"} ({template?.taxRate || 0}%)
                </span>
                <span>
                  {formatAmount({
                    amount: tax,
                    currency,
                    locale: template?.locale || "en-US",
                  })}
                </span>
              </div>
            )}
            
            {discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {template?.discountLabel || "Discount"}
                </span>
                <span>
                  -{formatAmount({
                    amount: discountAmount,
                    currency,
                    locale: template?.locale || "en-US",
                  })}
                </span>
              </div>
            )}
            
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
              <span>{template?.totalSummaryLabel || "Total"}</span>
              <span>
                {formatAmount({
                  amount: total,
                  currency,
                  locale: template?.locale || "en-US",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {data.notes && (
          <div className="mt-auto pt-8">
            <h3 className="text-xs text-muted-foreground font-medium mb-2">
              {template?.noteLabel || "Notes"}
            </h3>
            <p className="text-sm">{data.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}