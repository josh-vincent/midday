export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">Pivot Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome to the Pivot application. This dashboard shares common packages with Midday.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Shared Packages</h2>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
              <li>@midday/db - Database layer</li>
              <li>@midday/api - API client</li>
              <li>@midday/ui - UI components</li>
              <li>@midday/supabase - Supabase client</li>
            </ul>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">API Status</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              API Server: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">http://localhost:3335</code>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
