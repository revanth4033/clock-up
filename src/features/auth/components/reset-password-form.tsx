"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { resetPasswordSchema, type ResetPasswordInput } from "../schemas";
import { authApi } from "../api";
import { FormField } from "@/components/form/form-field";
import { PasswordInput } from "@/components/form/password-input";
import { SubmitButton } from "@/components/form/submit-button";
import { FormAlert } from "@/components/form/form-alert";

export function ResetPasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setServerError(null);
    const res = await authApi.resetPassword(values);
    if (!res.success) {
      setServerError(res.message);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && <FormAlert message={serverError} />}
      <FormField
        id="password"
        label="New password"
        hint="At least 8 characters, including a letter and a number."
        error={errors.password?.message}
      >
        <PasswordInput
          id="password"
          autoComplete="new-password"
          className="h-10"
          aria-invalid={!!errors.password}
          {...register("password")}
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
      <SubmitButton loading={isSubmitting} className="h-10 w-full">
        Update password
      </SubmitButton>
    </form>
  );
}
