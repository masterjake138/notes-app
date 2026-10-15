"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { setThemePref, useThemePref, type ThemePref } from "@/lib/theme";

const OPTIONS: Array<{ value: ThemePref; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle() {
  const pref = useThemePref();

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="flex rounded-xl border border-line bg-elevated p-0.5"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={pref === value}
          title={label}
          onClick={() => setThemePref(value)}
          className={cn(
            "flex h-8 flex-1 items-center justify-center rounded-[0.6rem] transition-colors",
            pref === value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
