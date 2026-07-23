import type { ReactNode } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/types/domain";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-muted-foreground shrink-0 text-sm">{label}</dt>
      <dd className="min-w-0 truncate text-right text-sm font-medium">
        {value}
      </dd>
    </div>
  );
}

/**
 * Read-only account summary. Editing (name / password) lives in the Profile
 * module — Settings only links there, it does not duplicate those flows.
 */
export function AccountCard({ profile }: { profile: UserProfile }) {
  return (
    <DashboardCard
      title="Account"
      icon={UserRound}
      action={
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/profile" />}
          className="text-primary"
        >
          Edit in Profile
        </Button>
      }
    >
      <dl className="divide-border divide-y">
        <Row label="Full name" value={profile.fullName} />
        <Row label="Employee ID" value={profile.employeeId} />
        <Row label="Office email" value={profile.officeEmail} />
      </dl>
    </DashboardCard>
  );
}
