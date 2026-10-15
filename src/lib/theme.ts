"use client";

import { useSyncExternalStore } from "react";

export type ThemePref = "light" | "dark" | "system";
export type ThemeMode = "light" | "dark";

export function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveMode(pref: ThemePref): ThemeMode {
  return pref === "dark" || (pref === "system" && systemPrefersDark()) ? "dark" : "light";
}

/** Apply a preference to the DOM (used by the toggle and the settings page). */
export function applyThemePref(pref: ThemePref): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", resolveMode(pref));
  root.dataset.themePref = pref;
}

export function setThemePref(pref: ThemePref): void {
  applyThemePref(pref);
  try {
    localStorage.setItem("theme", pref);
    document.cookie = `theme=${pref}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    /* storage may be unavailable */
  }
}

export function getThemePref(): ThemePref {
  const value = document.documentElement.dataset.themePref;
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

function subscribePref(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme-pref"],
  });
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMediaChange = () => {
    if (getThemePref() === "system") applyThemePref("system");
  };
  media.addEventListener("change", onMediaChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onMediaChange);
  };
}

function currentMode(): ThemeMode {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function subscribeMode(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

/** The user's stored preference (light / dark / system). */
export function useThemePref(): ThemePref {
  return useSyncExternalStore(subscribePref, getThemePref, () => "system");
}

/** The resolved mode currently applied to the document. */
export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribeMode, currentMode, () => "light");
}
