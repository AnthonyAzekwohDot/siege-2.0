"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  Apple,
  Brain,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/schedule", label: "Workout", icon: Dumbbell },
  { href: "/nutrition", label: "Nutrition", icon: Apple },
  { href: "/mind", label: "Mind", icon: Brain },
  { href: "/progress", label: "Progress", icon: TrendingUp },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-nav fixed bottom-4 left-0 right-0 z-50 safe-area-bottom">
      <div className="flex items-center justify-around px-2 pt-1.5 pb-0.5">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                // Inactive labels are bright enough to clear WCAG AA at 10px; the
                // active tab is distinguished by a subtle chip + bolder icon.
                "flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-white/12 text-white"
                  : "text-[rgba(255,255,255,0.92)]"
              )}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 1.8} />
              <span className={cn("text-[10px]", isActive ? "font-semibold" : "font-medium")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
