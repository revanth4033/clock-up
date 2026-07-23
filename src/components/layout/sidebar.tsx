"use client";

import { MAIN_NAV } from "@/constants/navigation";
import { Brand } from "./brand";
import { NavItem } from "./nav-item";

/** Fixed desktop sidebar. Hidden on mobile (bottom nav takes over). */
export function Sidebar() {
  return (
    <aside className="border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r md:flex">
      <div className="flex h-16 items-center px-5">
        <Brand />
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-1 px-3 py-4">
        {MAIN_NAV.map((item) => (
          <NavItem key={item.href} {...item} variant="sidebar" />
        ))}
      </nav>
      <div className="text-muted-foreground px-5 py-4 text-xs">
        ClockUp · MVP v1.0
      </div>
    </aside>
  );
}
