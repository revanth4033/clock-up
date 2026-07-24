"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { formatMinutes } from "@/utils/format";
import { redeemSchema, type RedeemInput } from "../schemas";
import { redemptionApi } from "../api";
import type {
  CreditSummary,
  TodayRedemption,
  TodaySummary,
} from "@/types/domain";

/** A single read-only figure inside the dialog summary grid. */
function Figure({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-heading text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function RedeemDialog({
  today,
  credit,
  redemption,
  mode,
  open,
  onOpenChange,
}: {
  today: TodaySummary;
  credit: CreditSummary;
  redemption: TodayRedemption;
  mode: "create" | "update";
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const router = useRouter();
  const recommended = redemption.recommendedRedemption;
  const initial =
    mode === "update" ? redemption.requestedCredits : recommended || 1;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RedeemInput>({
    resolver: zodResolver(redeemSchema),
    defaultValues: { requestedCredits: initial },
  });

  // Re-seed the field each time the dialog opens with fresh backend numbers.
  useEffect(() => {
    if (open) reset({ requestedCredits: initial });
  }, [open, initial, reset]);

  const current = Number(useWatch({ control, name: "requestedCredits" })) || 0;
  const exceedsAvailable = current > credit.available;
  const exceedsShortfall = current > redemption.remainingShortfall;

  async function onSubmit(values: RedeemInput) {
    const res = await redemptionApi.redeem(values.requestedCredits);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success(
      mode === "update" ? "Redemption updated" : "Credits reserved",
    );
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "update" ? "Update redemption" : "Redeem credits"}
          </DialogTitle>
          <DialogDescription>
            Apply credits to today so your Counted Time reaches the daily goal.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Figure label="Available credits" value={credit.available} />
          <Figure
            label="Worked today"
            value={formatMinutes(today.workedMinutes)}
          />
          <Figure label="Counted" value={formatMinutes(today.countedMinutes)} />
          <Figure
            label="Remaining shortfall"
            value={formatMinutes(redemption.remainingShortfall)}
          />
          <Figure label="Recommended" value={recommended} />
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormField
            id="requestedCredits"
            label="Requested credits"
            error={errors.requestedCredits?.message}
            hint={
              recommended > 0
                ? `We recommend ${recommended} credits to reach today's goal.`
                : "Enter the number of credits to apply to today."
            }
          >
            <div className="flex items-center gap-2">
              <Input
                id="requestedCredits"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                className="h-10"
                aria-invalid={!!errors.requestedCredits}
                {...register("requestedCredits", { valueAsNumber: true })}
              />
              {recommended > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0"
                  onClick={() =>
                    setValue("requestedCredits", recommended, {
                      shouldValidate: true,
                    })
                  }
                >
                  Use {recommended}
                </Button>
              )}
            </div>
          </FormField>

          {(exceedsAvailable || exceedsShortfall) && (
            <p role="status" className="text-warning text-xs">
              {exceedsAvailable
                ? "That's more than your available credits — the server may reduce it."
                : "That's more than today's remaining shortfall — the server may reduce it."}
            </p>
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <SubmitButton loading={isSubmitting}>
              {mode === "update" ? "Update redemption" : "Redeem credits"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
