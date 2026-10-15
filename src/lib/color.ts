/**
 * Small, dependency-free colour utilities used by the palette theming system.
 *
 * Everything works in sRGB hex (`#rrggbb`). Mixing is done in sRGB space, which
 * is good enough (and predictable) for deriving UI shades from a palette.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

/** Normalise `#abc`, `abc`, `#AABBCC` … to lowercase `#aabbcc`, or `null`. */
export function normalizeHex(input: string): string | null {
  if (typeof input !== "string") return null;
  let hex = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  return `#${hex.toLowerCase()}`;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

export function hexToRgb(input: string): RGB {
  const hex = normalizeHex(input) ?? "#000000";
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const to = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function relativeLuminance(input: string): number {
  const { r, g, b } = hexToRgb(input);
  const linear = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** WCAG contrast ratio between two colours (1 … 21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

const INK_DARK = "#101216";
const INK_LIGHT = "#ffffff";

/** Pick black or white text for maximum contrast against `bg`. */
export function readableInk(bg: string): string {
  return contrastRatio(bg, INK_LIGHT) >= contrastRatio(bg, INK_DARK) ? INK_LIGHT : INK_DARK;
}

/** Linear interpolation between two colours. `t` is the weight of `b`. */
export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  const k = clamp(t);
  return rgbToHex({
    r: x.r + (y.r - x.r) * k,
    g: x.g + (y.g - x.g) * k,
    b: x.b + (y.b - x.b) * k,
  });
}

export function rgbToHsl(input: string): HSL {
  const { r, g, b } = hexToRgb(input);
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rr) h = (gg - bb) / d + (gg < bb ? 6 : 0);
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h /= 6;
  }
  return { h: h * 360, s, l };
}

export function hslToHex({ h, s, l }: HSL): string {
  const hue = (((h % 360) + 360) % 360) / 360;
  const sat = clamp(s);
  const light = clamp(l);
  if (sat === 0) return rgbToHex({ r: light * 255, g: light * 255, b: light * 255 });

  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  const channel = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return rgbToHex({
    r: channel(hue + 1 / 3) * 255,
    g: channel(hue) * 255,
    b: channel(hue - 1 / 3) * 255,
  });
}

export function saturation(input: string): number {
  return rgbToHsl(input).s;
}

export function hue(input: string): number {
  return rgbToHsl(input).h;
}

export function lightness(input: string): number {
  return rgbToHsl(input).l;
}

/** Reduce saturation by `amount` (0 … 1). */
export function desaturate(input: string, amount: number): string {
  const { h, s, l } = rgbToHsl(input);
  return hslToHex({ h, s: s * (1 - clamp(amount)), l });
}

/** Increase saturation by `amount` (0 … 1), clamped at fully saturated. */
export function saturate(input: string, amount: number): string {
  const { h, s, l } = rgbToHsl(input);
  return hslToHex({ h, s: Math.min(1, s + amount), l });
}

/**
 * Mix a colour toward white or black until its relative luminance is close to
 * `target`. Used to guarantee readable surfaces/text from arbitrary palettes.
 */
export function tone(input: string, target: number): string {
  const start = normalizeHex(input) ?? "#000000";
  const towardWhite = relativeLuminance(start) < target;
  const anchor = towardWhite ? "#ffffff" : "#000000";
  let lo = 0;
  let hi = 1;
  let best = start;
  for (let i = 0; i < 14; i += 1) {
    const t = (lo + hi) / 2;
    const candidate = mix(start, anchor, t);
    const delta = relativeLuminance(candidate) - target;
    best = candidate;
    if (Math.abs(delta) < 0.004) return candidate;
    const needsMore = towardWhite ? delta < 0 : delta > 0;
    if (needsMore) lo = t;
    else hi = t;
  }
  return best;
}

export function withAlpha(input: string, alpha: number): string {
  const { r, g, b } = hexToRgb(input);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha).toFixed(3)})`;
}
