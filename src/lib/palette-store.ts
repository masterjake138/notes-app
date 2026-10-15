"use client";

import { create } from "zustand";
import {
  applySchemeToDom,
  DEFAULT_TOKENS,
  deriveTokens,
  makeSavedPalette,
  readScheme,
  writeScheme,
  type PaletteSource,
  type SavedPalette,
  type SchemeState,
  type ThemeMode,
  type TokenMap,
  type TokenName,
} from "./palette";

interface PaletteStore extends SchemeState {
  hydrated: boolean;

  hydrate: () => void;
  /** Re-apply the active mode's tokens (called when the theme changes). */
  syncMode: (mode: ThemeMode) => void;
  /** Derive and apply a palette to one mode, remembering it in the library. */
  importPalette: (
    source: PaletteSource,
    mode: ThemeMode,
    origin?: SavedPalette["origin"],
  ) => void;
  /** Re-derive the given mode's tokens from the current palette colours. */
  regenerate: (mode: ThemeMode) => void;
  setToken: (mode: ThemeMode, token: TokenName, color: string) => void;
  clearMode: (mode: ThemeMode) => void;
  removeSaved: (id: string) => void;
  reset: () => void;
}

function snapshot(state: SchemeState): SchemeState {
  return { light: state.light, dark: state.dark, colors: state.colors, saved: state.saved };
}

function remember(list: SavedPalette[], palette: SavedPalette): SavedPalette[] {
  const rest = list.filter(
    (entry) =>
      entry.id !== palette.id &&
      !(palette.slug && entry.slug === palette.slug) &&
      !(entry.name === palette.name && entry.colors.join() === palette.colors.join()),
  );
  return [palette, ...rest].slice(0, 24);
}

export const usePalette = create<PaletteStore>((set, get) => {
  const commit = (partial: Partial<SchemeState>, mode?: ThemeMode) => {
    set(partial);
    const scheme = snapshot(get());
    writeScheme(scheme);
    if (mode) applySchemeToDom(scheme, mode);
  };

  return {
    light: undefined,
    dark: undefined,
    colors: undefined,
    saved: [],
    hydrated: false,

    hydrate: () => {
      const stored = readScheme();
      set({ ...stored, hydrated: true });
      if (typeof document !== "undefined") {
        const mode = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
        applySchemeToDom(stored, mode);
      }
    },

    syncMode: (mode) => {
      applySchemeToDom(snapshot(get()), mode);
    },

    importPalette: (source, mode, origin = "lospec") => {
      const colors = source.colors;
      const tokens = deriveTokens(colors, mode);
      const palette = makeSavedPalette({ ...source, colors }, origin);
      commit(
        {
          [mode]: tokens,
          colors,
          saved: remember(get().saved, palette),
        } as Partial<SchemeState>,
        mode,
      );
    },

    regenerate: (mode) => {
      const colors = get().colors;
      if (!colors || colors.length === 0) return;
      commit({ [mode]: deriveTokens(colors, mode) } as Partial<SchemeState>, mode);
    },

    setToken: (mode, token, color) => {
      const current = get()[mode] ?? DEFAULT_TOKENS[mode];
      commit({ [mode]: { ...current, [token]: color } } as Partial<SchemeState>, mode);
    },

    clearMode: (mode) => {
      commit({ [mode]: undefined } as Partial<SchemeState>, mode);
    },

    removeSaved: (id) => {
      commit({ saved: get().saved.filter((entry) => entry.id !== id) });
    },

    reset: () => {
      commit({ light: undefined, dark: undefined, colors: undefined, saved: [] });
      if (typeof document !== "undefined") {
        const mode = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
        applySchemeToDom(snapshot(get()), mode);
      }
    },
  };
});

export type { TokenMap };
