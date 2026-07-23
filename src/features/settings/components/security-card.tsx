"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authApi } from "@/features/auth/api";

/**
 * Security actions. Reuses the existing auth logout (with a confirm step, per
 * the UFD logout flow) and links to the Profile change-password flow rather
 * than duplicating it.
 */
export function SecurityCard() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await authApi.logout();
    router.replace("/login");
    router.refresh();
  }

  return (
    <DashboardCard title="Security" icon={ShieldCheck}>
      <div className="divide-border divide-y">
        <div className="flex items-center justify-between gap-4 pb-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Password</p>
            <p className="text-muted-foreground text-sm">
              Change the password you use to sign in.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            nativeButton={false}
            render={<Link href="/profile" />}
          >
            <KeyRound className="size-4" />
            Change password
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4 pt-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Sign out</p>
            <p className="text-muted-foreground text-sm">
              End your session on this device.
            </p>
          </div>
          <Dialog>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm" className="shrink-0" />
              }
            >
              <LogOut className="size-4" />
              Sign out
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sign out of ClockUp?</DialogTitle>
                <DialogDescription>
                  You&apos;ll need to sign in again to track your hours.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose
                  render={<Button variant="outline" type="button" />}
                >
                  Cancel
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={signOut}
                  disabled={signingOut}
                >
                  {signingOut && <Loader2 className="size-4 animate-spin" />}
                  Sign out
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardCard>
  );
}
