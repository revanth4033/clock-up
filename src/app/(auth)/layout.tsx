import type { ReactNode } from "react";
import { Brand } from "@/components/layout/brand";

/**
 * Centered layout for authentication screens (login / register / forgot
 * password). Pages are added in Phase 5.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-secondary flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="mb-8">
        <Brand />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
