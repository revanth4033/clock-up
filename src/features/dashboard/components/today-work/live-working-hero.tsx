"use client";

import { useNow } from "../../hooks/use-now";
import { formatMinutes, formatTimeOfDay } from "@/utils/format";
import {
  HeroBody,
  HeroMetrics,
  HeroStatus,
  HeroSupporting,
  LocationHint,
  type Tone,
} from "./hero-frame";
import { ClockButton } from "./clock-button";

/** Remaining minutes at or below which the day reads as "Almost there". */
const ALMOST_THRESHOLD_MIN = 30;

/**
 * The live hero content for an in-progress day. Worked and Remaining tick every
 * second (shared clock), while the target Finish time is stable (clock-in +
 * goal). The status itself evolves as time passes — on track → almost there →
 * goal completed — so the card always reflects what's happening right now.
 */
export function LiveWorkingHero({
  clockInIso,
  goalMinutes,
  redeemedCredits,
}: {
  clockInIso: string;
  goalMinutes: number;
  redeemedCredits: number;
}) {
  const now = useNow();
  const clockInMs = new Date(clockInIso).getTime();
  // Target finish is stable: worked counts elapsed time since clock-in, so
  // finishing the goal always lands at clock-in + goal, regardless of "now".
  const finish = formatTimeOfDay(
    new Date(clockInMs + goalMinutes * 60000).toISOString(),
  );
  const action = <ClockButton action="out" />;

  // Pre-hydration placeholder — keep the frame identical, numbers pending.
  if (now === 0) {
    return (
      <HeroBody
        status={<HeroStatus tone="info" label="You're on track" />}
        metrics={
          <HeroMetrics
            items={[
              { value: "—", label: "Worked" },
              { value: "—", label: "Remaining" },
              { value: finish, label: "Finish" },
            ]}
          />
        }
        action={action}
        supporting={<LocationHint />}
      />
    );
  }

  const worked = Math.max(0, Math.floor((now - clockInMs) / 60000));
  const remaining = Math.max(0, goalMinutes - worked);
  const reachedGoal = worked >= goalMinutes;
  const almost = !reachedGoal && remaining <= ALMOST_THRESHOLD_MIN;

  let tone: Tone;
  let label: string;
  let message: string;
  let items: { value: string; label: string }[];

  if (reachedGoal) {
    tone = "success";
    label = "Goal completed 🎉";
    message = "You've hit today's goal — clock out when you're ready.";
    // Remaining is 0 here; keep Worked + the finish time for context.
    items = [
      { value: formatMinutes(worked), label: "Worked" },
      { value: finish, label: "Goal met by" },
    ];
  } else if (almost) {
    tone = "accent";
    label = "Almost there";
    message = `Just ${formatMinutes(remaining)} to reach today's goal.`;
    items = [
      { value: formatMinutes(worked), label: "Worked" },
      { value: formatMinutes(remaining), label: "Remaining" },
      { value: finish, label: "Finish" },
    ];
  } else {
    tone = "info";
    label = "You're on track";
    message =
      `On track for your ${formatMinutes(goalMinutes)} goal` +
      (redeemedCredits > 0
        ? ` · ${redeemedCredits} credits redeemed today`
        : "");
    items = [
      { value: formatMinutes(worked), label: "Worked" },
      { value: formatMinutes(remaining), label: "Remaining" },
      { value: finish, label: "Finish" },
    ];
  }

  return (
    <HeroBody
      status={<HeroStatus tone={tone} label={label} />}
      metrics={<HeroMetrics items={items} />}
      action={action}
      supporting={
        <div className="flex flex-col items-center gap-1">
          <HeroSupporting>{message}</HeroSupporting>
          <LocationHint />
        </div>
      }
    />
  );
}
