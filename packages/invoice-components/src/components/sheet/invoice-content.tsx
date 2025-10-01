"use client";

import { useInvoiceParams } from "../../hooks/use-invoice-params";
import { SheetContent, SheetHeader } from "@midday/ui/sheet";
import { useFormContext } from "react-hook-form";

type InvoiceContentProps = {
  InvoiceSuccess: React.ComponentType;
  Form: React.ComponentType;
  SettingsMenu: React.ComponentType;
};

export function InvoiceContent({
  InvoiceSuccess,
  Form,
  SettingsMenu,
}: InvoiceContentProps) {
  const { type } = useInvoiceParams();
  const { watch } = useFormContext();
  const templateSize = watch("template.size");

  const size = templateSize === "a4" ? 650 : 740;

  if (type === "success") {
    return (
      <SheetContent className="bg-white dark:bg-[#0C0C0C] transition-[max-width] duration-300 ease-in-out">
        <InvoiceSuccess />
      </SheetContent>
    );
  }

  return (
    <SheetContent
      style={{ maxWidth: size }}
      className="bg-white dark:bg-[#0C0C0C] transition-[max-width] duration-300 ease-in-out"
    >
      <SheetHeader className="mb-6 flex justify-between items-center flex-row">
        <div className="ml-auto">
          <SettingsMenu />
        </div>
      </SheetHeader>

      <Form />
    </SheetContent>
  );
}