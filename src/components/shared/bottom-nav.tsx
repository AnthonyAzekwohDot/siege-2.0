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
    <nav className="glass-nav fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="flex items-center justify-around px-1 pt-2 pb-1.5">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200",
                isActive
                  ? "text-white"
                  : "text-[rgba(255,255,255,0.45)]"
              )}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
