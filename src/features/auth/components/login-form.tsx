"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema, type LoginInput } from "../schemas";
import { authApi } from "../api";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form/form-field";
import { PasswordInput } from "@/components/form/password-input";
import { SubmitButton } from "@/components/form/submit-button";
import { FormAlert } from "@/components/form/form-alert";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { officeEmail: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const res = await authApi.login(values);
    if (!res.success) {
      setServerError(res.message);
      return;
    }
    // Only allow same-origin relative paths. Reject protocol-relative
    // ("//evil.com") and backslash ("/\evil.com") targets, which the router
    // would resolve to an external origin (open-redirect phishing).
    const redirect = searchParams.get("redirect");
    const safeRedirect =
      redirect &&
      redirect.startsWith("/") &&
      !redirect.startsWith("//") &&
      !redirect.startsWith("/\\")
        ? redirect
        : "/dashboard";
    router.replace(safeRedirect);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && <FormAlert message={serverError} />}
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
      <FormField
        id="password"
        label="Password"
        error={errors.password?.message}
      >
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="h-10"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
      </FormField>
      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-primary text-sm font-medium hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      <SubmitButton loading={isSubmitting} className="h-10 w-full">
        Sign in
      </SubmitButton>
    </form>
  );
}
