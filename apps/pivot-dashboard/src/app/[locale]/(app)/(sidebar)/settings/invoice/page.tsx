import { InvoiceTemplateSettings } from "@/components/invoice-template-settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice Template Settings | Midday",
};

export default function InvoiceSettingsPage() {
  return <InvoiceTemplateSettings />;
}
