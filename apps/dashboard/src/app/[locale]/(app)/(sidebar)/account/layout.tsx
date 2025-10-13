import { Header } from "@/components/header";
import { SecondaryMenu } from "@/components/secondary-menu";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[800px]">
      <SecondaryMenu
        items={[
          { path: "/account", label: "General" },
          { path: "/account/security", label: "Security" },
          { path: "/account/teams", label: "Teams" },
          { path: "/account/support", label: "Support" },
          // API Keys if we enable it 
          // { path: "/accounts/developer", label: "Developer" },
        ]}
      />

      <main className="mt-8">{children}</main>
    </div>
  );
}
