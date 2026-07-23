"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { updateNameSchema, type UpdateNameInput } from "../schemas";
import { profileApi } from "../api";

/** Inline editor for the display name — the only editable profile field. */
export function EditNameDialog({ currentName }: { currentName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateNameInput>({
    resolver: zodResolver(updateNameSchema),
    defaultValues: { fullName: currentName },
  });

  async function onSubmit(values: UpdateNameInput) {
    const res = await profileApi.updateName(values);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success("Profile updated");
    setOpen(false);
    router.refresh();
  }

  function onOpenChange(next: boolean) {
    if (next) reset({ fullName: currentName });
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Edit full name" />
        }
      >
        <Pencil className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit name</DialogTitle>
          <DialogDescription>
            Update the name shown across ClockUp and the leaderboard.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormField
            id="fullName"
            label="Full name"
            error={errors.fullName?.message}
          >
            <Input
              id="fullName"
              autoComplete="name"
              className="h-10"
              aria-invalid={!!errors.fullName}
              {...register("fullName")}
            />
          </FormField>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <SubmitButton loading={isSubmitting}>Save changes</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
