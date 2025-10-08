import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import { createClient } from "@midday/supabase/server";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // First check if user has a valid session
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const queryClient = getQueryClient();

  // NOTE: Right now we want to fetch the user and hydrate the client
  // Next steps would be to prefetch and suspense
  let user;
  try {
    user = await queryClient.fetchQuery(trpc.user.me.queryOptions());
  } catch (error) {
    // If there's an error fetching user data, redirect to login
    redirect("/login");
  }

  if (!user) {
    redirect("/login");
  }

  if (!user.fullName) {
    redirect("/setup");
  }

  if (!user.teamId) {
    redirect("/teams");
  }

  // Check if user is a member (not owner) - members get minimal UI
  const isMember = user.currentTeamRole === "member";

  return (
    <HydrateClient>
      <div className="relative">
        {/* Only show sidebar for owners */}
        {!isMember && <Sidebar />}

        <div className={isMember ? "pb-8" : "md:ml-[70px] pb-8"}>
          <Header />
          <div className="px-6">{children}</div>
        </div>
      </div>
    </HydrateClient>
  );
}
