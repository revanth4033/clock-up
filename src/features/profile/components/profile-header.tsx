import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initialsOf, formatMonthYear } from "@/utils/format";
import type { UserProfile } from "@/types/domain";

/** Identity banner: avatar, name, and key employment facts. Read-only. */
export function ProfileHeader({ profile }: { profile: UserProfile }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
        <Avatar size="lg" className="size-16 shrink-0 sm:size-20" aria-hidden>
          <AvatarFallback className="text-lg font-semibold sm:text-xl">
            {initialsOf(profile.fullName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="font-heading truncate text-xl font-bold tracking-tight sm:text-2xl">
            {profile.fullName}
          </h1>
          <p className="text-muted-foreground text-sm">
            {profile.designation}
            {profile.officeName ? ` · ${profile.officeName}` : ""}
          </p>
          <dl className="text-muted-foreground flex flex-col gap-x-4 gap-y-0.5 pt-1 text-xs sm:flex-row sm:flex-wrap sm:justify-start">
            <div className="flex items-center justify-center gap-1 sm:justify-start">
              <dt className="font-medium">Employee ID:</dt>
              <dd className="tabular-nums">{profile.employeeId}</dd>
            </div>
            <div className="flex items-center justify-center gap-1 sm:justify-start">
              <dt className="font-medium">Email:</dt>
              <dd className="truncate">{profile.officeEmail}</dd>
            </div>
            <div className="flex items-center justify-center gap-1 sm:justify-start">
              <dt className="font-medium">Member since:</dt>
              <dd>{formatMonthYear(profile.createdAt)}</dd>
            </div>
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
