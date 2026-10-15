"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Pref = "light" | "dark" | "system";

const OPTIONS: Array<{ value: Pref; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(pref: Pref) {
  const dark = pref === "dark" || (pref === "system" && systemPrefersDark());
  const el = document.documentElement;
  el.setAttribute("data-theme", dark ? "dark" : "light");
  el.dataset.themePref = pref;
}

/**
 * The preference lives in the DOM (`data-theme-pref`), set before paint by the
 * inline script in the root layout. We treat it as an external store so React
 * stays in sync without a setState-in-effect.
 */
function getSnapshot(): Pref {
  const value = document.documentElement.dataset.themePref;
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

function getServerSnapshot(): Pref {
  return "system";
}

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme-pref"],
  });

  // Follow OS changes while "system" is selected.
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMediaChange = () => {
    if (getSnapshot() === "system") applyTheme("system");
  };
  media.addEventListener("change", onMediaChange);

  return () => {
    observer.disconnect();
    media.removeEventListener("change", onMediaChange);
  };
}

function setPref(pref: Pref) {
  applyTheme(pref);
  try {
    localStorage.setItem("theme", pref);
    document.cookie = `theme=${pref}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    /* storage may be unavailable */
  }
}

export function ThemeToggle() {
  const pref = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

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
          onClick={() => setPref(value)}
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
