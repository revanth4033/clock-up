"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../schemas";
import { authApi } from "../api";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { FormAlert } from "@/components/form/form-alert";

export function ForgotPasswordForm() {
  const [notice, setNotice] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { officeEmail: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    const res = await authApi.forgotPassword(values);
    setNotice(res.message);
  }

  if (notice) {
    return <FormAlert message={notice} variant="success" />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField
        id="officeEmail"
        label="Office email"
        error={errors.officeEmail?.message}
      >
        <Input
          id="officeEmail"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          className="h-10"
          aria-invalid={!!errors.officeEmail}
          {...register("officeEmail")}
        />
      </FormField>
      <SubmitButton loading={isSubmitting} className="h-10 w-full">
        Send reset link
      </SubmitButton>
    </form>
  );
}
