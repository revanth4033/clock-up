import {
  CalendarClock,
  LayoutDashboard,
  Settings,
  Trophy,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/** Primary application navigation (shared by the sidebar and mobile nav). */
export const MAIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Attendance", href: "/attendance", icon: CalendarClock },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Profile", href: "/profile", icon: UserRound },
  { label: "Settings", href: "/settings", icon: Settings },
];
