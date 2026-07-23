import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { getCurrentUser } from "@/services/auth.service";

export const metadata: Metadata = { title: "Set new password" };

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <AuthCard
        title="Link expired"
        description="This password reset link is invalid or has expired."
        footer={
          <Link
            href="/forgot-password"
            className="text-primary font-medium hover:underline"
          >
            Request a new link
          </Link>
        }
      >
        <p className="text-muted-foreground text-center text-sm">
          Reset links can only be used once and expire after a short time.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set a new password"
      description="Choose a new password for your account"
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
