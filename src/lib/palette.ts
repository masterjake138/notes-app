/**
 * Palette theming: turn a list of colours (e.g. a Lospec palette) into the
 * twelve `--c-*` UI tokens the app already uses, and persist/apply the result.
 *
 * The app's colour system is a fixed set of CSS custom properties (see
 * `globals.css`). A "scheme" can override those tokens for light and/or dark
 * mode independently. Values are applied as inline styles on `<html>` so they
 * win over the stylesheet, and are re-applied before first paint by the inline
 * script in `layout.tsx`.
 */

import {
  desaturate,
  hue,
  mix,
  normalizeHex,
  readableInk,
  relativeLuminance,
  saturate,
  saturation,
  tone,
} from "./color";

export const TOKEN_NAMES = [
  "app",
  "surface",
  "elevated",
  "line",
  "ink",
  "muted",
  "faint",
  "accent",
  "accent-ink",
  "accent-soft",
  "danger",
  "danger-soft",
] as const;

export type TokenName = (typeof TOKEN_NAMES)[number];
export type TokenMap = Record<TokenName, string>;
export type ThemeMode = "light" | "dark";

export interface TokenMeta {
  token: TokenName;
  label: string;
  hint: string;
}

/** Display order + labels for the token editor in Settings. */
export const TOKEN_META: TokenMeta[] = [
  { token: "app", label: "App background", hint: "The page backdrop" },
  { token: "surface", label: "Surface", hint: "Panels and the sidebar" },
  { token: "elevated", label: "Elevated", hint: "Hover states and subtle fills" },
  { token: "line", label: "Lines", hint: "Borders and dividers" },
  { token: "ink", label: "Text", hint: "Primary text" },
  { token: "muted", label: "Muted text", hint: "Secondary text" },
  { token: "faint", label: "Faint text", hint: "Icons and hints" },
  { token: "accent", label: "Accent", hint: "Buttons, links, selection" },
  { token: "accent-ink", label: "Accent text", hint: "Text on accent fills" },
  { token: "accent-soft", label: "Accent soft", hint: "Tinted backgrounds" },
  { token: "danger", label: "Danger", hint: "Destructive actions" },
  { token: "danger-soft", label: "Danger soft", hint: "Destructive backgrounds" },
];

/**
 * Built-in token values, matching `globals.css`. Used as the starting point
 * when a mode is edited before any palette has been applied, and for previews.
 */
export const DEFAULT_TOKENS: Record<ThemeMode, TokenMap> = {
  light: {
    app: "#f3f4f6",
    surface: "#ffffff",
    elevated: "#eef0f3",
    line: "#e5e7eb",
    ink: "#16181c",
    muted: "#6b7280",
    faint: "#9aa1ab",
    accent: "#4f46e5",
    "accent-ink": "#ffffff",
    "accent-soft": "#eef1ff",
    danger: "#dc2626",
    "danger-soft": "#fef2f2",
  },
  dark: {
    app: "#090a0c",
    surface: "#121417",
    elevated: "#1b1e23",
    line: "#25292f",
    ink: "#e9ebee",
    muted: "#98a0ab",
    faint: "#6b7280",
    accent: "#818cf8",
    "accent-ink": "#0a0b12",
    "accent-soft": "#1d2030",
    danger: "#f87171",
    "danger-soft": "#2a1719",
  },
};

export interface SavedPalette {
  id: string;
  name: string;
  author?: string;
  slug?: string;
  origin: "lospec" | "builtin" | "custom";
  colors: string[];
  createdAt: number;
}

export interface SchemeState {
  light?: TokenMap;
  dark?: TokenMap;
  /** Colours of the most recently applied palette, offered as swatches. */
  colors?: string[];
  saved: SavedPalette[];
}

export const SCHEME_STORAGE_KEY = "scheme";

/* ------------------------------------------------------------------ *
 * Parsing
 * ------------------------------------------------------------------ */

/** Normalise + de-duplicate a list of colour strings into `#rrggbb`. */
export function uniqueColors(input: unknown): string[] {
  const out: string[] = [];
  if (Array.isArray(input)) {
    for (const value of input) {
      if (typeof value !== "string") continue;
      const hex = normalizeHex(value);
      if (hex) out.push(hex);
    }
  }
  return Array.from(new Set(out));
}

export interface PaletteSource {
  name: string;
  author?: string;
  slug?: string;
  colors: string[];
}

/** Accept a full Lospec URL, a bare slug, or a slug with trailing slash. */
export function lospecSlug(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/lospec\.com\/palette-list\/([a-z0-9-]+)/i);
  if (match) return match[1].toLowerCase();
  if (/^[a-z0-9][a-z0-9-]*$/i.test(trimmed)) return trimmed.toLowerCase();
  return null;
}

/**
 * Fetch a palette from Lospec. Only the per-palette JSON endpoint allows
 * cross-origin requests from the browser, so we build on that. The response is
 * served as `application/octet-stream`, hence `res.text()` + `JSON.parse`.
 */
export async function fetchLospecPalette(input: string): Promise<PaletteSource> {
  const slug = lospecSlug(input);
  if (!slug) {
    throw new Error("Enter a Lospec palette link or slug, e.g. “sweetie-16”.");
  }
  let response: Response;
  try {
    response = await fetch(`https://lospec.com/palette-list/${slug}.json`);
  } catch {
    throw new Error("Couldn’t reach Lospec. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new Error(`Lospec has no palette called “${slug}” (${response.status}).`);
  }
  const raw = await response.text();
  let data: { name?: unknown; author?: unknown; colors?: unknown };
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    throw new Error("That palette couldn’t be read.");
  }
  const colors = uniqueColors(data.colors);
  if (colors.length === 0) throw new Error("That palette had no colours.");
  const name = typeof data.name === "string" && data.name.trim() ? data.name.trim() : slug;
  const author = typeof data.author === "string" && data.author.trim() ? data.author.trim() : undefined;
  return { name, author, slug, colors };
}

/** Parse either a Lospec JSON blob or a plain list of hex codes. */
export function parsePaletteText(text: string): PaletteSource | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{")) {
    try {
      const data = JSON.parse(trimmed) as { name?: unknown; author?: unknown; colors?: unknown };
      const colors = uniqueColors(data.colors);
      if (colors.length > 0) {
        return {
          name: typeof data.name === "string" && data.name.trim() ? data.name.trim() : "Custom palette",
          author:
            typeof data.author === "string" && data.author.trim() ? data.author.trim() : undefined,
          colors,
        };
      }
    } catch {
      /* fall through to the hex list parser */
    }
  }

  const colors = uniqueColors(trimmed.split(/[\s,;]+/));
  return colors.length > 0 ? { name: "Custom palette", colors } : null;
}

export function makeSavedPalette(
  source: PaletteSource,
  origin: SavedPalette["origin"],
): SavedPalette {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: source.name,
    author: source.author,
    slug: source.slug,
    origin,
    colors: source.colors,
    createdAt: Date.now(),
  };
}

/* ------------------------------------------------------------------ *
 * Token derivation
 * ------------------------------------------------------------------ */

function pickAccent(colors: string[], mode: ThemeMode): string {
  const scored = colors
    .map((color) => {
      const sat = saturation(color);
      const luma = relativeLuminance(color);
      const mid = 1 - Math.abs(luma - 0.5) * 1.6;
      return { color, score: sat * Math.max(0.12, mid) };
    })
    .sort((a, b) => b.score - a.score);

  let accent = scored[0]?.color ?? "#4f46e5";
  if (saturation(accent) < 0.25) accent = saturate(accent, 0.35);
  const luma = relativeLuminance(accent);
  if (mode === "dark" && luma < 0.16) accent = tone(accent, 0.45);
  if (mode === "light" && luma > 0.72) accent = tone(accent, 0.42);
  return accent;
}

function pickDanger(colors: string[], mode: ThemeMode): string {
  const reds = colors
    .map((color) => {
      const h = hue(color);
      return { color, sat: saturation(color), distance: Math.min(h, 360 - h) };
    })
    .filter((entry) => entry.sat > 0.35 && entry.distance < 42)
    .sort((a, b) => a.distance - b.distance);

  let danger = reds[0]?.color ?? (mode === "dark" ? "#f87171" : "#dc2626");
  const luma = relativeLuminance(danger);
  if (mode === "dark" && luma < 0.2) danger = tone(danger, 0.5);
  if (mode === "light" && luma > 0.66) danger = tone(danger, 0.4);
  return danger;
}

/**
 * Build a full token set for one mode from a palette.
 *
 * Surfaces and text are derived from the palette's darkest/lightest colours
 * (lightly desaturated so the UI stays legible), while the accent and danger
 * colours carry the palette's personality.
 */
export function deriveTokens(input: string[], mode: ThemeMode): TokenMap {
  const colors = uniqueColors(input);
  if (colors.length === 0) throw new Error("A palette needs at least one colour.");

  const byLuma = [...colors].sort((a, b) => relativeLuminance(a) - relativeLuminance(b));
  const darkest = byLuma[0];
  const lightest = byLuma[byLuma.length - 1];

  const accent = pickAccent(colors, mode);
  const danger = pickDanger(colors, mode);

  if (mode === "dark") {
    const app = tone(desaturate(darkest, 0.45), 0.045);
    const ink = tone(desaturate(lightest, 0.78), 0.92);
    return {
      app,
      surface: mix(app, ink, 0.06),
      elevated: mix(app, ink, 0.12),
      line: mix(app, ink, 0.2),
      faint: mix(app, ink, 0.44),
      muted: mix(app, ink, 0.64),
      ink,
      accent,
      "accent-ink": readableInk(accent),
      "accent-soft": mix(app, accent, 0.22),
      danger,
      "danger-soft": mix(app, danger, 0.2),
    };
  }

  const surface = tone(desaturate(lightest, 0.85), 0.97);
  const ink = tone(desaturate(darkest, 0.55), 0.14);
  return {
    app: mix(surface, ink, 0.05),
    surface,
    elevated: mix(surface, ink, 0.08),
    line: mix(surface, ink, 0.16),
    faint: mix(surface, ink, 0.45),
    muted: mix(surface, ink, 0.62),
    ink,
    accent,
    "accent-ink": readableInk(accent),
    "accent-soft": mix(surface, accent, 0.14),
    danger,
    "danger-soft": mix(surface, danger, 0.12),
  };
}

export function sanitizeTokens(input: unknown): TokenMap | undefined {
  if (!input || typeof input !== "object") return undefined;
  const source = input as Record<string, unknown>;
  const out = {} as TokenMap;
  for (const name of TOKEN_NAMES) {
    const hex = typeof source[name] === "string" ? normalizeHex(source[name] as string) : null;
    if (!hex) return undefined;
    out[name] = hex;
  }
  return out;
}

export function hasAnyTokens(scheme: SchemeState): boolean {
  return Boolean(scheme.light || scheme.dark);
}

/* ------------------------------------------------------------------ *
 * Persistence + DOM application
 * ------------------------------------------------------------------ */

export function readScheme(): SchemeState {
  if (typeof localStorage === "undefined") return { saved: [] };
  try {
    const raw = localStorage.getItem(SCHEME_STORAGE_KEY);
    if (!raw) return { saved: [] };
    const parsed = JSON.parse(raw) as Partial<SchemeState>;
    return {
      light: sanitizeTokens(parsed.light),
      dark: sanitizeTokens(parsed.dark),
      colors: uniqueColors(parsed.colors),
      saved: Array.isArray(parsed.saved)
        ? parsed.saved.filter((entry): entry is SavedPalette => {
            if (!entry || typeof entry !== "object") return false;
            const candidate = entry as Partial<SavedPalette>;
            return typeof candidate.id === "string" && typeof candidate.name === "string";
          })
        : [],
    };
  } catch {
    return { saved: [] };
  }
}

export function writeScheme(scheme: SchemeState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SCHEME_STORAGE_KEY, JSON.stringify(scheme));
  } catch {
    /* storage may be unavailable */
  }
}

/** Apply (or clear) a mode's tokens as inline CSS variables on `<html>`. */
export function applySchemeToDom(scheme: SchemeState, mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const name of TOKEN_NAMES) root.style.removeProperty(`--c-${name}`);
  const tokens = scheme[mode];
  if (!tokens) return;
  for (const name of TOKEN_NAMES) root.style.setProperty(`--c-${name}`, tokens[name]);
}
