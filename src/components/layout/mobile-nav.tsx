"use client";

import { MAIN_NAV } from "@/constants/navigation";
import { NavItem } from "./nav-item";

/** Fixed bottom navigation for mobile. Hidden on desktop (sidebar takes over). */
export function MobileNav() {
  return (
    <nav
      aria-label="Main"
      className="border-border bg-card/95 fixed inset-x-0 bottom-0 z-40 flex items-stretch gap-1 border-t px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
    >
      {MAIN_NAV.map((item) => (
        <NavItem key={item.href} {...item} variant="mobile" />
      ))}
    </nav>
  );
}
