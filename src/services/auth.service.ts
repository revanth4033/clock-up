import "server-only";

import { cache } from "react";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { usersRepository } from "@/repositories/users.repository";
import type { LoginInput, RegisterInput } from "@/features/auth/schemas";
import type { ServiceResult } from "./types";
import type { UserProfile } from "@/types/domain";

/**
 * Register a user with Supabase Auth. The public.users and public.user_settings
 * rows are created atomically by the `on_auth_user_created` database trigger
 * (see migration `..._handle_new_user.sql`) from the signup metadata below — the
 * service never inserts profile rows itself.
 *
 * Email confirmation is intentionally disabled for this product, so a successful
 * signUp returns a session and the user is auto-logged-in (per the PRD/UFD).
 */
export async function registerUser(
  input: RegisterInput,
): Promise<ServiceResult<{ needsEmailConfirmation: boolean }>> {
  const supabase = await createClient();

  const { data: signUp, error } = await supabase.auth.signUp({
    email: input.officeEmail,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        employee_id: input.employeeId,
        designation: input.designation,
        office_location_id: input.officeLocationId,
      },
    },
  });

  if (error) return mapSignUpError(error);

  if (!signUp.user) {
    return {
      ok: false,
      code: "SERVER_ERROR",
      message: "We couldn't create your account. Please try again.",
    };
  }

  // Safety net: if confirmation is ever re-enabled there is no session. The
  // profile is still created by the trigger, but the user must confirm first.
  if (!signUp.session) {
    return {
      ok: true,
      message:
        "Account created. Check your email to confirm your address, then sign in.",
      data: { needsEmailConfirmation: true },
    };
  }

  return {
    ok: true,
    message: "Account created successfully.",
    data: { needsEmailConfirmation: false },
  };
}

function mapSignUpError(
  error: AuthError,
): ServiceResult<{ needsEmailConfirmation: boolean }> {
  const message = error.message.toLowerCase();

  if (message.includes("already") || error.code === "user_already_exists") {
    return {
      ok: false,
      code: "EMAIL_EXISTS",
      message: "An account with this email already exists.",
    };
  }
  if (
    error.code === "over_email_send_rate_limit" ||
    message.includes("rate limit")
  ) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      message:
        "Too many attempts right now. Please wait a minute and try again.",
    };
  }
  if (message.includes("password")) {
    return { ok: false, code: "INVALID_REQUEST", message: error.message };
  }
  // A 500 from signUp means the on_auth_user_created trigger raised. After
  // Zod-valid input that is almost always a duplicate employee_id (or a tampered
  // office_location_id). GoTrue masks the details, so we map by HTTP status.
  if (error.status === 500) {
    return {
      ok: false,
      code: "EMPLOYEE_EXISTS",
      message:
        "That employee ID is already registered, or your office selection is invalid.",
    };
  }
  console.error("[auth] signUp failed:", error.code, error.message);
  return {
    ok: false,
    code: "SERVER_ERROR",
    message: "We couldn't create your account. Please try again.",
  };
}

export async function loginUser(input: LoginInput): Promise<ServiceResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: input.officeEmail,
    password: input.password,
  });

  if (error) {
    if (error.message.toLowerCase().includes("not confirmed")) {
      return {
        ok: false,
        code: "EMAIL_NOT_CONFIRMED",
        message: "Please confirm your email address before signing in.",
      };
    }
    return {
      ok: false,
      code: "INVALID_CREDENTIALS",
      message: "Incorrect email or password.",
    };
  }
  return { ok: true, message: "Signed in.", data: null };
}

export async function logoutUser(): Promise<ServiceResult> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { ok: true, message: "Signed out.", data: null };
}

export async function requestPasswordReset(
  email: string,
  redirectTo: string,
): Promise<ServiceResult> {
  const supabase = await createClient();
  // Ignore the result to avoid revealing whether the email is registered.
  await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  return {
    ok: true,
    message: "If that email is registered, a reset link is on its way.",
    data: null,
  };
}

export async function updatePassword(
  newPassword: string,
): Promise<ServiceResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      code: "AUTH_REQUIRED",
      message: "Your reset link is invalid or has expired. Request a new one.",
    };
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { ok: false, code: "SERVER_ERROR", message: error.message };
  }
  return { ok: true, message: "Password updated.", data: null };
}

/**
 * Resolves the authenticated user + profile, or null. Wrapped in React `cache`
 * so multiple callers within one request (the dashboard layout + the dashboard
 * page/service) share a single `getUser` + profile query.
 */
export const getCurrentUser = cache(
  async (): Promise<{
    authId: string;
    email: string;
    profile: UserProfile | null;
  } | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const profile = await usersRepository.findByAuthId(supabase, user.id);
    return { authId: user.id, email: user.email ?? "", profile };
  },
);
