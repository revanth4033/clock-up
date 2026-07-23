"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItemProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  variant?: "sidebar" | "mobile";
};

/**
 * A single navigation link, shared by the desktop sidebar and the mobile
 * bottom bar. Highlights itself when the current route matches.
 */
export function NavItem({
  href,
  label,
  icon: Icon,
  variant = "sidebar",
}: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  if (variant === "mobile") {
    return (
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "focus-visible:ring-ring flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[0.7rem] font-medium transition-colors outline-none focus-visible:ring-2",
          isActive
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Icon className={cn("size-5", isActive && "stroke-[2.5px]")} />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "focus-visible:ring-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
