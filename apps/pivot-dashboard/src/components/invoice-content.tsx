"use client";

import { InvoiceSuccess } from "@/components/invoice-success";
import { Form } from "@midday/invoice-components/form";
import { SettingsMenu } from "@midday/invoice-components/form";
import { InvoiceContent as BaseInvoiceContent } from "@midday/invoice-components/sheet";

export function InvoiceContent() {
  return (
    <BaseInvoiceContent
      InvoiceSuccess={InvoiceSuccess}
      Form={Form}
      SettingsMenu={SettingsMenu}
    />
  );
}