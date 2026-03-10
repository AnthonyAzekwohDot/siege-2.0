"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/": "Siege",
  "/schedule": "Workout",
  "/nutrition": "Nutrition",
  "/mind": "Mind",
  "/progress": "Progress",
};

export function Header() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Siege";

  return (
    <header className="glass-header sticky top-0 z-40 px-5 pt-3 pb-2">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[28px] font-bold tracking-tight text-[hsl(var(--foreground))]">
          {title}
        </h1>
      </div>
    </header>
  );
}
