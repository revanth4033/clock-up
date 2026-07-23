import type { ReactNode } from "react";
import { UserRound } from "lucide-react";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { Badge } from "@/components/ui/badge";
import { EditNameDialog } from "./edit-name-dialog";
import type { UserProfile } from "@/types/domain";

function InfoRow({
  label,
  value,
  action,
}: {
  label: string;
  value: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-muted-foreground shrink-0 text-sm">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2 text-right text-sm font-medium">
        <span className="truncate">{value}</span>
        {action}
      </dd>
    </div>
  );
}

/**
 * Personal information. Per the ASD only the display name is editable; every
 * other field is read-only (Employee ID, office email, designation, office).
 */
export function PersonalInfoCard({ profile }: { profile: UserProfile }) {
  return (
    <DashboardCard
      title="Personal Information"
      icon={UserRound}
      contentClassName="pt-0"
    >
      <dl className="divide-border divide-y">
        <InfoRow
          label="Full name"
          value={profile.fullName}
          action={<EditNameDialog currentName={profile.fullName} />}
        />
        <InfoRow label="Employee ID" value={profile.employeeId} />
        <InfoRow label="Office email" value={profile.officeEmail} />
        <InfoRow label="Designation" value={profile.designation} />
        <InfoRow label="Office" value={profile.officeName || "—"} />
        <InfoRow
          label="Account status"
          value={
            <Badge
              variant="secondary"
              className="border-success/40 text-success"
            >
              Active
            </Badge>
          }
        />
      </dl>
    </DashboardCard>
  );
}
