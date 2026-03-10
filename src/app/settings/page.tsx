"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import * as queries from "@/lib/queries";
import type { UpdateUserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
  getNotificationPermission,
} from "@/lib/push";

// ============================================================
// Settings — Profile & preferences
// ============================================================

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentary",
  light: "Light",
  moderate: "Moderate",
  high: "Active",
};

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
        checked
          ? "bg-[hsl(var(--primary))]"
          : "bg-[rgba(0,0,0,0.1)]"
      }`}
    >
      <span
        className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function FormRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[hsl(var(--border))] last:border-0">
      <span className="text-sm font-medium text-[hsl(var(--foreground))]">
        {label}
      </span>
      <div className="w-[140px] flex justify-end">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();

  // ---------- Load profile ----------
  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: queries.getUserProfile,
  });

  // ---------- Local form state ----------
  const [form, setForm] = useState<UpdateUserProfile>({
    weight_kg: 151,
    height_cm: 183,
    age: 25,
    sex: "male",
    activity_level: "light",
    deficit_target: 1500,
    has_asthma: false,
    tonight_lock_enabled: true,
    tonight_lock_time: "20:00",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        weight_kg: profile.weight_kg,
        height_cm: profile.height_cm,
        age: profile.age,
        sex: profile.sex,
        activity_level: profile.activity_level,
        deficit_target: profile.deficit_target,
        has_asthma: profile.has_asthma,
        tonight_lock_enabled: profile.tonight_lock_enabled,
        tonight_lock_time: profile.tonight_lock_time,
      });
    }
  }, [profile]);

  // ---------- Save mutation ----------
  const saveMutation = useMutation({
    mutationFn: (update: UpdateUserProfile) =>
      queries.updateUserProfile(update),
    onSuccess: (data) => {
      queryClient.setQueryData(["user-profile"], data);
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(form);
  };

  const updateField = <K extends keyof UpdateUserProfile>(
    key: K,
    value: UpdateUserProfile[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ---------- Notification state ----------
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifPermission, setNotifPermission] = useState<
    NotificationPermission | "unsupported" | "loading"
  >("loading");
  const [notifLoading, setNotifLoading] = useState(false);

  const checkNotifState = useCallback(async () => {
    const perm = getNotificationPermission();
    setNotifPermission(perm);

    if (perm === "granted") {
      const sub = await getCurrentSubscription();
      setNotifEnabled(!!sub);
    } else {
      setNotifEnabled(false);
    }
  }, []);

  useEffect(() => {
    checkNotifState();
  }, [checkNotifState]);

  const handleNotifToggle = async (enable: boolean) => {
    setNotifLoading(true);
    try {
      if (enable) {
        const sub = await subscribeToPush();
        setNotifEnabled(!!sub);
      } else {
        await unsubscribeFromPush();
        setNotifEnabled(false);
      }
      await checkNotifState();
    } catch (err) {
      console.error("Notification toggle error:", err);
    } finally {
      setNotifLoading(false);
    }
  };

  // ---------- Loading skeleton ----------
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 pb-12 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="glass-card p-6 h-40 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-12 space-y-4">
      {/* ---------- Body ---------- */}
      <section className="glass-card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">
          Body
        </h3>
        <div>
          <FormRow label="Weight (kg)">
            <Input
              type="number"
              value={form.weight_kg ?? ""}
              onChange={(e) =>
                updateField("weight_kg", Number(e.target.value))
              }
              className="w-[100px] text-right"
            />
          </FormRow>
          <FormRow label="Height (cm)">
            <Input
              type="number"
              value={form.height_cm ?? ""}
              onChange={(e) =>
                updateField("height_cm", Number(e.target.value))
              }
              className="w-[100px] text-right"
            />
          </FormRow>
          <FormRow label="Age">
            <Input
              type="number"
              value={form.age ?? ""}
              onChange={(e) =>
                updateField("age", Number(e.target.value))
              }
              className="w-[100px] text-right"
            />
          </FormRow>
          <FormRow label="Sex">
            <select
              value={form.sex ?? "male"}
              onChange={(e) =>
                updateField("sex", e.target.value as "male" | "female")
              }
              className="h-11 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white/50 backdrop-blur-sm px-3 text-sm text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]/20 transition-all duration-150 appearance-none w-[100px] text-right"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </FormRow>
        </div>
      </section>

      {/* ---------- Goals ---------- */}
      <section className="glass-card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">
          Goals
        </h3>
        <div>
          <FormRow label="Deficit Target (cal)">
            <Input
              type="number"
              value={form.deficit_target ?? ""}
              onChange={(e) =>
                updateField("deficit_target", Number(e.target.value))
              }
              className="w-[100px] text-right"
            />
          </FormRow>
          <FormRow label="Activity Level">
            <select
              value={form.activity_level ?? "light"}
              onChange={(e) =>
                updateField(
                  "activity_level",
                  e.target.value as UpdateUserProfile["activity_level"]
                )
              }
              className="h-11 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white/50 backdrop-blur-sm px-3 text-sm text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]/20 transition-all duration-150 appearance-none w-[140px] text-right"
            >
              {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FormRow>
        </div>
      </section>

      {/* ---------- Health ---------- */}
      <section className="glass-card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">
          Health
        </h3>
        <div>
          <FormRow label="Has Asthma">
            <Toggle
              checked={form.has_asthma ?? false}
              onChange={(v) => updateField("has_asthma", v)}
            />
          </FormRow>
        </div>
      </section>

      {/* ---------- Notifications ---------- */}
      <section className="glass-card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">
          Notifications
        </h3>
        <div>
          <FormRow label="Enable Notifications">
            {notifPermission === "loading" ? (
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                Loading...
              </span>
            ) : notifPermission === "unsupported" ? (
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                Not supported
              </span>
            ) : (
              <div className="flex items-center gap-2">
                {notifLoading ? (
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    ...
                  </span>
                ) : (
                  <Toggle
                    checked={notifEnabled}
                    onChange={handleNotifToggle}
                  />
                )}
              </div>
            )}
          </FormRow>
          {notifPermission === "denied" && (
            <p className="text-xs text-[hsl(var(--destructive))] mt-2 px-1">
              Notifications blocked. Enable in your browser settings.
            </p>
          )}
          {notifPermission === "granted" && notifEnabled && (
            <p className="text-xs text-[hsl(var(--chart-3))] mt-2 px-1">
              You will receive reminders for weigh-ins, meals, water, and workouts.
            </p>
          )}
        </div>
      </section>

      {/* ---------- Tonight Lock ---------- */}
      <section className="glass-card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">
          Tonight Lock
        </h3>
        <div>
          <FormRow label="Enabled">
            <Toggle
              checked={form.tonight_lock_enabled ?? true}
              onChange={(v) => updateField("tonight_lock_enabled", v)}
            />
          </FormRow>
          <FormRow label="Lock Time">
            <Input
              type="time"
              value={form.tonight_lock_time ?? "20:00"}
              onChange={(e) =>
                updateField("tonight_lock_time", e.target.value)
              }
              className="w-[120px] text-right"
            />
          </FormRow>
        </div>
      </section>

      {/* ---------- Save ---------- */}
      <Button
        onClick={handleSave}
        disabled={saveMutation.isPending}
        className="w-full"
        size="lg"
      >
        {saveMutation.isPending ? "Saving..." : "Save Changes"}
      </Button>

      {saveMutation.isSuccess && (
        <p className="text-center text-sm text-[hsl(var(--chart-3))]">
          Saved successfully
        </p>
      )}

      {saveMutation.isError && (
        <p className="text-center text-sm text-[hsl(var(--destructive))]">
          Failed to save. Try again.
        </p>
      )}
    </div>
  );
}
