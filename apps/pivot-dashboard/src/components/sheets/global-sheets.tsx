"use client";

import { SearchModal } from "@/components/search/search-modal";
import { CustomerCreateSheet } from "@/components/sheets/customer-create-sheet";
import { CustomerEditSheet } from "@/components/sheets/customer-edit-sheet";
import { DocumentSheet } from "@/components/sheets/document-sheet";
import { InvoiceDetailsSheet } from "@/components/sheets/invoice-details-sheet";
import { InvoiceSheet } from "@/components/sheets/invoice-sheet";

type Props = {
  currencyPromise: string;
  countryCodePromise: string;
};

export function GlobalSheets({ currencyPromise, countryCodePromise }: Props) {
  const currency = currencyPromise;
  const countryCode = countryCodePromise;

  return (
    <>
      <CustomerCreateSheet />
      <CustomerEditSheet />
      <SearchModal />
      <DocumentSheet />
      <InvoiceDetailsSheet />
      <InvoiceSheet />
    </>
  );
}
