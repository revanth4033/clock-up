"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
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
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form/form-field";
import { PasswordInput } from "@/components/form/password-input";
import { SubmitButton } from "@/components/form/submit-button";
import { changePasswordSchema, type ChangePasswordInput } from "../schemas";
import { profileApi } from "../api";

/**
 * Password management. Reuses the existing auth architecture: the server
 * re-verifies the current password before updating, and no sensitive data is
 * ever rendered here.
 */
export function PasswordCard() {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ChangePasswordInput) {
    const res = await profileApi.changePassword(values);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success("Password changed");
    setOpen(false);
    reset();
  }

  function onOpenChange(next: boolean) {
    if (!next) reset();
    setOpen(next);
  }

  return (
    <DashboardCard title="Password" icon={KeyRound}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Change the password you use to sign in to ClockUp.
        </p>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogTrigger
            render={<Button variant="outline" className="shrink-0" />}
          >
            Change password
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change password</DialogTitle>
              <DialogDescription>
                Enter your current password, then choose a new one.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <FormField
                id="currentPassword"
                label="Current password"
                error={errors.currentPassword?.message}
              >
                <PasswordInput
                  id="currentPassword"
                  autoComplete="current-password"
                  className="h-10"
                  aria-invalid={!!errors.currentPassword}
                  {...register("currentPassword")}
                />
              </FormField>
              <FormField
                id="newPassword"
                label="New password"
                error={errors.newPassword?.message}
                hint="At least 8 characters, with a letter and a number."
              >
                <PasswordInput
                  id="newPassword"
                  autoComplete="new-password"
                  className="h-10"
                  aria-invalid={!!errors.newPassword}
                  {...register("newPassword")}
                />
              </FormField>
              <FormField
                id="confirmPassword"
                label="Confirm new password"
                error={errors.confirmPassword?.message}
              >
                <PasswordInput
                  id="confirmPassword"
                  autoComplete="new-password"
                  className="h-10"
                  aria-invalid={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                />
              </FormField>
              <DialogFooter>
                <DialogClose
                  render={<Button variant="outline" type="button" />}
                >
                  Cancel
                </DialogClose>
                <SubmitButton loading={isSubmitting}>
                  Update password
                </SubmitButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardCard>
  );
}
