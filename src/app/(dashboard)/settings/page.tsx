import type { Metadata } from "next";
import { EmptyPage } from "@/components/layout/empty-page";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <EmptyPage
      title="Settings"
      description="Manage your theme, notifications, and account preferences."
    />
  );
}
