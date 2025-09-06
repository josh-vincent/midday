import { Header } from "@/components/header";
import { SecondaryMenu } from "@/components/secondary-menu";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[800px]">
      <SecondaryMenu
        items={[
          { path: "/settings", label: "General" },
          { path: "/settings/members", label: "Members" },
          { path: "/settings/invoice", label: "Invoice" },
          { path: "/settings/developer", label: "Developer" },
        ]}
      />

      <main className="mt-8">{children}</main>
    </div>
  );
}
