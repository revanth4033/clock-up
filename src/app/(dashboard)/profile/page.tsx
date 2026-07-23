import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { getProfileData } from "@/services/profile.service";
import { ProfileHeader } from "@/features/profile/components/profile-header";
import { PersonalInfoCard } from "@/features/profile/components/personal-info-card";
import { AttendanceStatsCard } from "@/features/profile/components/attendance-stats-card";
import { PasswordCard } from "@/features/profile/components/password-card";
import { RecentAttendanceCard } from "@/features/dashboard/components/recent-attendance-card";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const data = await getProfileData();

  if (!data) {
    return (
      <PageContainer>
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 text-center">
          <p className="text-lg font-semibold">
            We couldn&apos;t load your profile
          </p>
          <p className="text-muted-foreground text-sm">
            Please sign out and sign in again.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-3">
        <div className="xl:col-span-3">
          <ProfileHeader profile={data.profile} />
        </div>

        <div className="flex flex-col gap-4 md:gap-5 xl:col-span-2">
          <PersonalInfoCard profile={data.profile} />
          <PasswordCard />
        </div>

        <div className="flex flex-col gap-4 md:gap-5">
          <AttendanceStatsCard stats={data.stats} />
          <RecentAttendanceCard recent={data.recent} />
        </div>
      </div>
    </PageContainer>
  );
}
