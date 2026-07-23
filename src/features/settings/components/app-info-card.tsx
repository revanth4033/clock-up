import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import pkg from "@/../package.json";

const APP_VERSION = pkg.version;
const ENVIRONMENT =
  process.env.NODE_ENV === "production" ? "Production" : "Development";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-muted-foreground shrink-0 text-sm">{label}</dt>
      <dd className="text-right text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}

/**
 * Application information. Only facts that are actually available are shown —
 * version (package.json) and environment (NODE_ENV). Build/DB version are not
 * defined in the docs, so they are intentionally omitted rather than faked.
 */
export function AppInfoCard() {
  return (
    <DashboardCard title="Application" icon={Info}>
      <dl className="divide-border divide-y">
        <Row label="App version" value={`v${APP_VERSION}`} />
        <Row label="Environment" value={ENVIRONMENT} />
      </dl>
    </DashboardCard>
  );
}
