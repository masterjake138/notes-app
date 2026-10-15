"use client";

import { useEffect } from "react";
import { usePalette } from "@/lib/palette-store";

function currentMode(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

/**
 * Loads the saved colour scheme and keeps the inline `--c-*` variables in sync
 * with the active theme. The first paint is handled by the inline script in the
 * root layout; this component takes over once React has mounted.
 */
export function PaletteSync() {
  const hydrate = usePalette((state) => state.hydrate);
  const syncMode = usePalette((state) => state.syncMode);

  useEffect(() => {
    hydrate();

    const observer = new MutationObserver(() => syncMode(currentMode()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, [hydrate, syncMode]);

  return null;
}
