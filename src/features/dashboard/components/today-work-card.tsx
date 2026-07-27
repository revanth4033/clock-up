import Link from "next/link";
import { CalendarClock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { DashboardCard } from "./dashboard-card";
import {
  HeroBody,
  HeroMetrics,
  HeroStatus,
  HeroSupporting,
  LocationHint,
} from "./today-work/hero-frame";
import { ClockButton } from "./today-work/clock-button";
import { LiveWorkingHero } from "./today-work/live-working-hero";
import { formatMinutes, formatTimeOfDay } from "@/utils/format";
import type { DashboardData } from "@/services/dashboard.service";
import type { TodaySummary } from "@/types/domain";

/** Secondary action that keeps the action area occupied once the day is over
 * (nothing left to clock) — a quiet link into the full Attendance history. */
function ViewAttendanceButton() {
  return (
    <Link
      href="/attendance"
      className={cn(
        buttonVariants({ variant: "outline" }),
        "h-11 w-full justify-center gap-2 sm:w-56",
      )}
    >
      <CalendarClock className="size-4" />
      View Attendance
    </Link>
  );
}

/**
 * "Today's Work" — the dashboard hero. A fixed skeleton
 * (Title → Status → Metrics → Primary Action → Supporting) whose content adapts
 * to the current state, answering: what's happening now, what to do next, and
 * how close I am to today's goal. All values come from data the page already
 * fetches; the in-progress state ticks live via the shared clock.
 */
export function TodayWorkCard({
  today,
  workingHours,
  points,
  creditToday,
  className,
}: {
  today: DashboardData["today"];
  workingHours: DashboardData["workingHours"];
  points: DashboardData["points"];
  creditToday: TodaySummary | null;
  className?: string;
}) {
  const goal = workingHours.goalMinutes;
  const { state } = today;

  const body = (() => {
    // Day type is resolved BEFORE attendance state. On a non-working day with no
    // recorded activity, show a contextual state instead of prompting a clock-in
    // (no goal / remaining / finish). If the employee DID clock in on a day off,
    // their real activity takes over in the branches below — working on a
    // weekend or holiday still counts.
    if (
      state === "not_started" &&
      (today.dayType === "weekend" || today.dayType === "holiday")
    ) {
      const isHoliday = today.dayType === "holiday";
      return (
        <HeroBody
          status={
            <HeroStatus
              tone="neutral"
              label={isHoliday ? "Company holiday" : "Weekend"}
            />
          }
          metrics={<HeroMetrics items={[]} />}
          action={<ViewAttendanceButton />}
          supporting={
            <HeroSupporting>
              {isHoliday
                ? `${today.holidayName ?? "Holiday"} — no attendance required today.`
                : "Enjoy your weekend — no attendance required today."}
            </HeroSupporting>
          }
        />
      );
    }

    // Live, in-progress day.
    if (state === "working" && today.clockIn) {
      return (
        <LiveWorkingHero
          clockInIso={today.clockIn}
          goalMinutes={goal}
          redeemedCredits={creditToday?.redeemedCredits ?? 0}
        />
      );
    }

    // Finished day — clocked out.
    if (state === "completed") {
      const worked = today.workedMinutes ?? 0;
      const counted = creditToday?.countedMinutes ?? worked;
      const met = counted >= goal;
      const earned = creditToday?.earnedCredits ?? 0;
      return (
        <HeroBody
          status={
            <HeroStatus
              tone="success"
              label={met ? "Goal completed 🎉" : "Day complete"}
            />
          }
          metrics={
            <HeroMetrics
              items={[
                { value: formatMinutes(worked), label: "Worked" },
                { value: points.today, label: "Points" },
                { value: formatTimeOfDay(today.clockOut), label: "Finished" },
              ]}
            />
          }
          action={<ViewAttendanceButton />}
          supporting={
            <HeroSupporting>
              See you tomorrow.
              {earned > 0 ? ` · +${earned} credits earned today` : ""}
            </HeroSupporting>
          }
        />
      );
    }

    // Needs attention — a clock-out is missing or the day is incomplete.
    if (state === "missed_clock_out" || state === "incomplete") {
      const isMissed = state === "missed_clock_out";
      return (
        <HeroBody
          status={
            <HeroStatus
              tone="warning"
              label={isMissed ? "Clock-out missing" : "Day incomplete"}
            />
          }
          metrics={
            <HeroMetrics
              items={
                today.clockIn
                  ? [
                      {
                        value: formatTimeOfDay(today.clockIn),
                        label: "Clocked in",
                      },
                    ]
                  : []
              }
            />
          }
          action={<ViewAttendanceButton />}
          supporting={
            <HeroSupporting>
              {isMissed
                ? "We couldn't record your clock-out — confirm it to finish the day."
                : "This day is incomplete — review it in Attendance."}
            </HeroSupporting>
          }
        />
      );
    }

    // Not started yet (default).
    return (
      <HeroBody
        status={<HeroStatus tone="neutral" label="Ready to start" />}
        metrics={
          <HeroMetrics
            items={[{ value: formatMinutes(goal), label: "Today's goal" }]}
          />
        }
        action={<ClockButton action="in" />}
        supporting={
          <div className="flex flex-col items-center gap-1">
            <HeroSupporting>Clock in to begin your day.</HeroSupporting>
            <LocationHint />
          </div>
        }
      />
    );
  })();

  return (
    <DashboardCard title="Today's Work" icon={Zap} className={className}>
      {body}
    </DashboardCard>
  );
}
