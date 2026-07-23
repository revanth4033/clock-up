import type { Metadata } from "next";
import { EmptyPage } from "@/components/layout/empty-page";

export const metadata: Metadata = { title: "Leaderboard" };

export default function LeaderboardPage() {
  return (
    <EmptyPage
      title="Leaderboard"
      description="See how you rank against your teammates by points and consistency."
    />
  );
}
