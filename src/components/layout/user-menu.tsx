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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type UserMenuUser = {
  name: string;
  email: string;
};

/** Account menu: shows the signed-in user and signs out. */
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
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="text-foreground block truncate text-sm font-medium">
            {user.name}
          </span>
          {user.email && (
            <span className="text-muted-foreground block truncate text-xs">
              {user.email}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/profile" />}>
          <UserRound className="size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
