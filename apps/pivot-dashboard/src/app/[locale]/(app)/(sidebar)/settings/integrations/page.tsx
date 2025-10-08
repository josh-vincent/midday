import { OAuthIntegrations } from "@/components/oauth-integrations";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integrations | Midday",
};

export default function Page() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Integrations</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Connect your favorite apps and services to automate your workflow
        </p>
      </div>
      <OAuthIntegrations />
    </div>
  );
}
