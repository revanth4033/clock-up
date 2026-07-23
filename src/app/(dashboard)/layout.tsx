import type { ReactNode } from "react";
import { getCurrentUser } from "@/services/auth.service";
import { getSettings } from "@/services/settings.service";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeSync } from "@/features/settings/components/theme-sync";

/**
 * Authenticated application shell: desktop sidebar + sticky header + content,
 * with a mobile bottom navigation. Route protection is enforced by src/proxy.ts;
 * this layout also resolves the signed-in user for the header/account menu.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  const headerUser = {
    name: user?.profile?.fullName ?? user?.email ?? "Account",
    email: user?.email ?? "",
  };

  return (
    <div className="bg-background min-h-screen">
      {settings && <ThemeSync theme={settings.theme} />}
      <a
        href="#main-content"
        className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      <Sidebar />

      <div className="flex min-h-screen flex-col md:pl-64">
        <Header user={headerUser} />
        <main id="main-content" className="flex-1 pb-24 md:pb-0">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
