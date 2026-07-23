import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/features/auth/components/auth-card";
import { RegisterForm } from "@/features/auth/components/register-form";
import { getOfficeLocations } from "@/services/office.service";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  const offices = await getOfficeLocations();

  return (
    <AuthCard
      title="Create your account"
      description="Start tracking your workday with ClockUp"
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm
        offices={offices.map((o) => ({ id: o.id, officeName: o.officeName }))}
      />
    </AuthCard>
  );
}
