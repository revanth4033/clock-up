"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { registerSchema, type RegisterInput } from "../schemas";
import { authApi } from "../api";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form/form-field";
import { PasswordInput } from "@/components/form/password-input";
import { SubmitButton } from "@/components/form/submit-button";
import { FormAlert } from "@/components/form/form-alert";

const SELECT_CLASS =
  "flex h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30";

type RegisterFormProps = {
  offices: { id: string; officeName: string }[];
};

export function RegisterForm({ offices }: RegisterFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      employeeId: "",
      officeEmail: "",
      designation: "",
      officeLocationId: "",
      password: "",
    },
  });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    setNotice(null);
    const res = await authApi.register(values);
    if (!res.success) {
      setServerError(res.message);
      return;
    }
    if (res.data?.needsEmailConfirmation) {
      setNotice(res.message);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && <FormAlert message={serverError} />}
      {notice && <FormAlert message={notice} variant="success" />}

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

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="employeeId"
          label="Employee ID"
          error={errors.employeeId?.message}
        >
          <Input
            id="employeeId"
            className="h-10"
            aria-invalid={!!errors.employeeId}
            {...register("employeeId")}
          />
        </FormField>
        <FormField
          id="designation"
          label="Designation"
          error={errors.designation?.message}
        >
          <Input
            id="designation"
            className="h-10"
            aria-invalid={!!errors.designation}
            {...register("designation")}
          />
        </FormField>
      </div>

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
        id="officeLocationId"
        label="Office location"
        error={errors.officeLocationId?.message}
      >
        <select
          id="officeLocationId"
          defaultValue=""
          className={SELECT_CLASS}
          aria-invalid={!!errors.officeLocationId}
          {...register("officeLocationId")}
        >
          <option value="" disabled>
            {offices.length ? "Select your office" : "No offices configured"}
          </option>
          {offices.map((office) => (
            <option key={office.id} value={office.id}>
              {office.officeName}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        id="password"
        label="Password"
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

      <SubmitButton loading={isSubmitting} className="h-10 w-full">
        Create account
      </SubmitButton>
    </form>
  );
}
