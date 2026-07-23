import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Brand } from "./brand";
import { Breadcrumbs } from "./breadcrumbs";
import { UserMenu, type UserMenuUser } from "./user-menu";

/**
 * Sticky top header. Shows the brand on mobile (sidebar is hidden) and the
 * breadcrumb trail on desktop, with the theme toggle + account menu on the right.
 */
export function Header({ user }: { user: UserMenuUser }) {
  return (
    <header className="border-border bg-background/80 sticky top-0 z-30 flex h-16 items-center gap-4 border-b px-5 backdrop-blur md:px-8">
      <div className="md:hidden">
        <Brand />
      </div>
      <div className="hidden md:block">
        <Breadcrumbs />
      </div>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
