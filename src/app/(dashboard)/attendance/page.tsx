import type { Metadata } from "next";
import { EmptyPage } from "@/components/layout/empty-page";

export const metadata: Metadata = { title: "Attendance" };

export default function AttendancePage() {
  return (
    <EmptyPage
      title="Attendance"
      description="Clock in, clock out, and review your attendance history here."
    />
  );
}
