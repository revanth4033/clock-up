import type { Metadata } from "next";
import { EmptyPage } from "@/components/layout/empty-page";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <EmptyPage
      title="Profile"
      description="Your employee details, working statistics, and achievements."
    />
  );
}
