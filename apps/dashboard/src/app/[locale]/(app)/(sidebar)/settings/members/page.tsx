import { TeamMembers } from "@/components/team-members";
import { prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Members | Midday",
};

export default function Members() {
  console.log("[Members Page] Starting to render members page");

  // Fire and forget - don't await to avoid blocking rendering
  console.log("[Members Page] Attempting to prefetch team.members");
  prefetch(trpc.team.members.queryOptions()).catch((error) => {
    console.error("[Members Page] Error prefetching team.members:", error);
  });

  console.log("[Members Page] Attempting to prefetch team.teamInvites");
  prefetch(trpc.team.teamInvites.queryOptions()).catch((error) => {
    console.error("[Members Page] Error prefetching team.teamInvites:", error);
  });

  console.log("[Members Page] Rendering TeamMembers component");
  return <TeamMembers />;
}
