import { SiteHeader } from "@/components/site-header";
import { SystemState } from "@/components/system-state";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--surface-0)] text-white">
      <SiteHeader />
      <div className="grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-16 sm:px-6">
        <SystemState
          eyebrow="404 · Route not found"
          title="That page is not part of the current product."
          description="The route may have moved, remained planned, or never existed outside a preview. Use the store or account dashboard to continue from a supported surface."
          tone="warning"
          actionHref="/"
          actionLabel="Return to store"
          secondaryHref="/account"
          secondaryLabel="Open account"
        />
      </div>
    </main>
  );
}
