import { GatekeeperForm } from "@/components/gatekeeper/gatekeeper-form";
import { JobCreateSheet } from "@/components/sheets/job-create-sheet";
import { loadGatekeeperFilterParams } from "@/hooks/use-gatekeeper-filter-params";
import { HydrateClient } from "@/trpc/server";
import type { Metadata } from "next";
import type { SearchParams } from "nuqs";

export const metadata: Metadata = {
  title: "Gatekeeper | ToCLD",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function GatekeeperPage(props: Props) {
  const searchParams = await props.searchParams;
  const filter = loadGatekeeperFilterParams(searchParams);

  return (
    <HydrateClient>
      <div className="h-[calc(100vh-70px)] md:h-[calc(100vh-4rem)] flex flex-col overflow-hidden mx-auto">
        <GatekeeperForm />
        <JobCreateSheet />
      </div>
    </HydrateClient>
  );
}