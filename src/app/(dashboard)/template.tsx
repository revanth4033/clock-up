import type { ReactNode } from "react";

/**
 * Subtle page-enter animation. A template (not a layout) re-mounts on every
 * navigation, so each page fades/slides in (~250ms, per DSD motion guidance).
 * Implemented with CSS (tw-animate-css) so it ships no client JS.
 */
export default function DashboardTemplate({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-out">
      {children}
    </div>
  );
}
