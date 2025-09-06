import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  // NOTE: Right now we want to fetch the user and hydrate the client
  // Next steps would be to prefetch and suspense
  const user = await queryClient.fetchQuery(trpc.user.me.queryOptions());

  if (!user) {
    redirect("/login");
  }

  if (!user.fullName) {
    redirect("/setup");
  }

  if (!user.teamId) {
    redirect("/teams");
  }

  return (
    <HydrateClient>
      <div className="relative">
        <Sidebar />

        <div className="md:ml-[70px] pb-8">
          <Header />
          <div className="px-6">{children}</div>
        </div>
      </div>
    </HydrateClient>
  );
}
