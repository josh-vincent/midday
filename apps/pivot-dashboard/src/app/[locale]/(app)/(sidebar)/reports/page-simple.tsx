import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Reports Simple Test | ToCLD",
};

export default async function ReportsPageSimple() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Reports Page (Simple Test)</h1>
      <p>This is a simplified version to test if the page loads.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 border rounded">Card 1</div>
        <div className="p-4 border rounded">Card 2</div>
        <div className="p-4 border rounded">Card 3</div>
        <div className="p-4 border rounded">Card 4</div>
      </div>
    </div>
  );
}
