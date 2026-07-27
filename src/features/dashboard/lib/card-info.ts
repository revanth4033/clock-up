/**
 * Onboarding hints shown in each dashboard card's info tooltip, keyed by the
 * card title. One friendly sentence per card — what it is / why it exists /
 * what to use it for. Not a field-by-field explanation. Rendered by
 * `DashboardCard` when a title has an entry here.
 */
export const CARD_INFO: Record<string, string> = {
  "Today's Work":
    "Track today's attendance progress, remaining work time, and your expected finish time.",
  "Working Hours":
    "See how much of today's work goal you've completed and how much time remains.",
  "Today's Attendance":
    "View your clock-in status and today's attendance record.",
  "Today's Time Credits":
    "See how today's worked time contributes toward your daily goal and earned credit minutes.",
  "This Week":
    "Monitor your attendance and working-hour summary for the current week.",
  "Redeem Credits":
    "Use saved credit minutes to cover today's shortfall when you're eligible.",
  "Credit Balance":
    "View your available, reserved, and remaining time credits.",
  Points:
    "Track the reward points you've earned for consistent attendance and completed workdays.",
  Leaderboard: "See how your performance compares with other employees.",
  "Recent Attendance":
    "Review your recent attendance history and daily working hours.",
};
