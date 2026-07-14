"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/": "Siege",
  "/schedule": "Workout",
  "/nutrition": "Nutrition",
  "/mind": "Mind",
  "/progress": "Progress",
  "/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Siege";

  return (
    <header className="glass-header sticky top-0 z-40 px-5 pt-3 pb-2 safe-area-top">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-[hsl(var(--foreground))]">
          {title}
        </h1>
        {pathname !== "/settings" && (
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex items-center justify-center h-11 w-11 rounded-full text-[hsl(var(--muted-foreground))] active:bg-[rgba(0,0,0,0.04)] transition-colors"
          >
            <Settings className="h-5 w-5" strokeWidth={1.8} />
          </Link>
        )}
      </div>
    </header>
  );
}
