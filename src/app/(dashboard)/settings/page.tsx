import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { getCurrentUser } from "@/services/auth.service";
import { getSettings } from "@/services/settings.service";
import { AppearanceCard } from "@/features/settings/components/appearance-card";
import { NotificationsCard } from "@/features/settings/components/notifications-card";
import { AccountCard } from "@/features/settings/components/account-card";
import { AppInfoCard } from "@/features/settings/components/app-info-card";
import { SecurityCard } from "@/features/settings/components/security-card";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);

  if (!user?.profile || !settings) {
    return (
      <PageContainer>
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 text-center">
          <p className="text-lg font-semibold">
            We couldn&apos;t load your settings
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
      <div className="grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-2">
        <div className="flex flex-col gap-4 md:gap-5">
          <AppearanceCard initialTheme={settings.theme} />
          <NotificationsCard initialEnabled={settings.notificationsEnabled} />
          <AppInfoCard />
        </div>
        <div className="flex flex-col gap-4 md:gap-5">
          <AccountCard profile={user.profile} />
          <SecurityCard />
        </div>
      </div>
    </PageContainer>
  );
}
