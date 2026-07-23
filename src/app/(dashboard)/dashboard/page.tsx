import type { Metadata } from "next";
import { EmptyPage } from "@/components/layout/empty-page";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <EmptyPage
      title="Dashboard"
      description="Your daily progress, live timer, and today's goal will live here."
    />
  );
}
