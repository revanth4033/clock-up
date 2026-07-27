"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, UserRound } from "lucide-react";
import { authApi } from "@/features/auth/api";
import { initialsOf } from "@/utils/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type UserMenuUser = {
  name: string;
  role: string;
  email: string;
};

/**
 * Account dropdown: signed-in user info, Profile / Settings links, and sign-out.
 * The trigger is the native Base UI menu button (styled as a ghost icon button)
 * with the avatar inside — Base UI wires open/close, outside-click, Escape and
 * keyboard navigation. Profile and Settings route to existing pages; Logout
 * reuses the existing auth flow.
 */
export function UserMenu({ user }: { user: UserMenuUser }) {
  const router = useRouter();

  async function handleLogout() {
    await authApi.logout();
    router.replace("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Open account menu"
          />
        }
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {initialsOf(user.name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-60">
        {/* User information — a plain header block (not a Menu.GroupLabel,
            which Base UI requires to live inside a Menu.Group). */}
        <div className="px-1.5 py-1.5">
          <p className="text-foreground truncate text-sm font-medium">
            {user.name}
          </p>
          {user.role && (
            <p className="text-muted-foreground truncate text-xs">
              {user.role}
            </p>
          )}
          {user.email && (
            <p className="text-muted-foreground truncate text-xs">
              {user.email}
            </p>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Navigation */}
        <DropdownMenuItem render={<Link href="/profile" />}>
          <UserRound className="size-4" />
          My Profile
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings className="size-4" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Session */}
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut className="size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
