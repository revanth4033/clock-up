"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { settingsApi } from "../api";

/**
 * Notification preference — a single persisted toggle (`notifications_enabled`),
 * the only notification setting defined in the docs. Optimistic with rollback.
 * (Notification delivery itself is a deferred/P2 feature; this stores intent.)
 */
export function NotificationsCard({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function onChange(next: boolean) {
    setEnabled(next);
    setSaving(true);
    const res = await settingsApi.update({ notifications: next });
    setSaving(false);
    if (!res.success) {
      setEnabled(!next); // rollback
      toast.error(res.message);
    }
  }

  return (
    <DashboardCard title="Notifications" icon={Bell}>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="notifications-enabled">Enable notifications</Label>
          <p className="text-muted-foreground text-sm">
            Get updates about clock-ins, goals, and achievements.
          </p>
        </div>
        <Switch
          id="notifications-enabled"
          checked={enabled}
          disabled={saving}
          onCheckedChange={onChange}
          aria-label="Enable notifications"
        />
      </div>
    </DashboardCard>
  );
}
