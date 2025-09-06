import type { Metadata } from "next";
import Link from "next/link";
import type { SearchParams } from "nuqs";

export const metadata: Metadata = {
  title: "Overview | ToCLD",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Overview(props: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">
          Welcome to Dirt Invoicing
        </h1>
        <p className="text-muted-foreground">
          Manage your invoices, customers, and payments
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

        <Link
          href="/settings"
          className="group p-6 border rounded-lg hover:border-primary transition-colors"
        >
          <h3 className="font-semibold mb-2 group-hover:text-primary">
            Settings
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure your business details
          </p>
        </Link>
      </div>
    </div>
  );
}
