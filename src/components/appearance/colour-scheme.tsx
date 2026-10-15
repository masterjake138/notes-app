"use client";

import { useState } from "react";
import {
  Check,
  Download,
  Grid2x2,
  Loader2,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
  Trash2,
} from "lucide-react";
import { ColorPicker } from "@/components/ui/color-picker";
import { TAG_COLORS } from "@/lib/db";
import { usePalette } from "@/lib/palette-store";
import {
  DEFAULT_TOKENS,
  fetchLospecPalette,
  parsePaletteText,
  TOKEN_META,
  type SavedPalette,
  type ThemeMode,
} from "@/lib/palette";
import { BUILTIN_PALETTES } from "@/lib/palettes-builtin";
import { setThemePref, useThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

function SwatchStrip({ colors, className }: { colors: string[]; className?: string }) {
  return (
    <span className={cn("flex overflow-hidden rounded-md ring-1 ring-inset ring-black/10", className)}>
      {colors.slice(0, 12).map((color, index) => (
        <span key={`${color}-${index}`} className="h-full flex-1" style={{ backgroundColor: color }} />
      ))}
    </span>
  );
}

export function ColourScheme() {
  const themeMode = useThemeMode();
  const [editMode, setEditMode] = useState<ThemeMode | null>(null);
  const mode = editMode ?? themeMode;

  const light = usePalette((s) => s.light);
  const dark = usePalette((s) => s.dark);
  const colors = usePalette((s) => s.colors);
  const saved = usePalette((s) => s.saved);
  const importPalette = usePalette((s) => s.importPalette);
  const regenerate = usePalette((s) => s.regenerate);
  const setToken = usePalette((s) => s.setToken);
  const clearMode = usePalette((s) => s.clearMode);
  const removeSaved = usePalette((s) => s.removeSaved);

  const [url, setUrl] = useState("");
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appliedTokens = mode === "dark" ? dark : light;
  const tokens = appliedTokens ?? DEFAULT_TOKENS[mode];
  const paletteColors = colors ?? [];
  const isEditingActive = mode === themeMode;

  const importFromLospec = async () => {
    if (!url.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const source = await fetchLospecPalette(url);
      importPalette(source, mode, "lospec");
      setUrl("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  };

  const applyPasted = () => {
    const source = parsePaletteText(paste);
    if (!source) {
      setError("Paste a list of hex codes or a Lospec JSON export.");
      return;
    }
    setError(null);
    importPalette(source, mode, "custom");
    setPaste("");
  };

  const applySaved = (palette: SavedPalette) => {
    setError(null);
    importPalette(
      { name: palette.name, author: palette.author, slug: palette.slug, colors: palette.colors },
      mode,
      palette.origin,
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-line bg-elevated p-0.5">
          {(["light", "dark"] as ThemeMode[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setEditMode(value)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-[0.6rem] px-3 text-xs font-semibold capitalize transition-colors",
                mode === value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
              )}
            >
              {value === "light" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {value}
            </button>
          ))}
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[0.7rem] font-semibold",
            appliedTokens ? "bg-accent-soft text-accent" : "bg-elevated text-faint",
          )}
        >
          {appliedTokens ? "Custom scheme" : "Default colours"}
        </span>
        {!isEditingActive ? (
          <button
            type="button"
            onClick={() => setThemePref(mode)}
            className="text-xs font-medium text-accent hover:underline"
          >
            Switch the app to {mode} to preview
          </button>
        ) : null}
      </div>

      <p className="text-sm leading-relaxed text-muted">
        Colours apply to the <strong className="font-semibold text-ink">{mode}</strong> theme only.
        Import a palette from lospec.com, tweak any individual colour, or clear it to go back to the
        defaults.
      </p>

      {/* Import -------------------------------------------------------- */}
      <div className="rounded-xl border border-line bg-surface p-3.5">
        <h3 className="text-sm font-semibold text-ink">Import a palette</h3>
        <p className="mt-0.5 text-xs text-muted">
          Paste a lospec.com palette link or slug (e.g. <code className="font-mono">sweetie-16</code>).
        </p>
        <div className="mt-2.5 flex gap-2">
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void importFromLospec();
            }}
            placeholder="https://lospec.com/palette-list/…"
            spellCheck={false}
            className="h-9 w-full rounded-lg border border-line bg-app px-2.5 text-base text-ink outline-none focus:border-accent sm:text-sm"
          />
          <button
            type="button"
            onClick={() => void importFromLospec()}
            disabled={busy || !url.trim()}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-semibold text-accent-ink transition-transform hover:brightness-110 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Import
          </button>
        </div>

        <details className="mt-2.5 group">
          <summary className="cursor-pointer text-xs font-medium text-muted hover:text-ink">
            Or paste hex codes / a JSON export
          </summary>
          <div className="mt-2 space-y-2">
            <textarea
              value={paste}
              onChange={(event) => setPaste(event.target.value)}
              rows={3}
              spellCheck={false}
              placeholder="#1a1c2c #5d275d #b13e53 …"
              className="w-full resize-y rounded-lg border border-line bg-app p-2 font-mono text-xs text-ink outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={applyPasted}
              disabled={!paste.trim()}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-semibold text-ink transition-colors hover:bg-elevated disabled:pointer-events-none disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Use these colours
            </button>
          </div>
        </details>

        {error ? <p className="mt-2 text-xs font-medium text-danger">{error}</p> : null}

        {paletteColors.length > 0 ? (
          <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
            <SwatchStrip colors={paletteColors} className="h-6 flex-1" />
            <button
              type="button"
              onClick={() => regenerate(mode)}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-semibold text-ink transition-colors hover:bg-elevated"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Re-generate
            </button>
          </div>
        ) : null}
      </div>

      {/* Built-ins ----------------------------------------------------- */}
      <div className="rounded-xl border border-line bg-surface p-3.5">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Grid2x2 className="h-4 w-4 text-muted" />
          Built-in palettes
        </h3>
        <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {BUILTIN_PALETTES.map((palette) => {
            const active = palette.colors.join() === paletteColors.join();
            return (
              <button
                key={palette.name}
                type="button"
                onClick={() => importPalette(palette, mode, "builtin")}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border p-2 text-left transition-colors",
                  active ? "border-accent bg-accent-soft" : "border-line hover:bg-elevated",
                )}
              >
                <SwatchStrip colors={palette.colors} className="h-7 w-16 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{palette.name}</span>
                  <span className="block truncate text-xs text-faint">{palette.author}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Token editor -------------------------------------------------- */}
      <div className="rounded-xl border border-line bg-surface p-3.5">
        <h3 className="text-sm font-semibold text-ink">Fine-tune colours</h3>
        <p className="mt-0.5 text-xs text-muted">
          Click a swatch to override any individual colour for the {mode} theme.
        </p>
        <div className="mt-2.5 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
          {TOKEN_META.map(({ token, label, hint }) => (
            <div key={token} className="flex items-center gap-3 py-1">
              <ColorPicker
                label={label}
                value={tokens[token]}
                swatches={[...paletteColors, ...TAG_COLORS]}
                onChange={(color) => setToken(mode, token, color)}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink">{label}</span>
                <span className="block truncate text-xs text-faint">{hint}</span>
              </span>
              <span className="font-mono text-[0.7rem] uppercase text-faint">{tokens[token]}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
          <button
            type="button"
            onClick={() => clearMode(mode)}
            disabled={!appliedTokens}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-semibold text-ink transition-colors hover:bg-elevated disabled:pointer-events-none disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset {mode} to default
          </button>
        </div>
      </div>

      {/* Library ------------------------------------------------------- */}
      {saved.length > 0 ? (
        <div className="rounded-xl border border-line bg-surface p-3.5">
          <h3 className="text-sm font-semibold text-ink">Your palettes</h3>
          <div className="mt-2.5 space-y-1">
            {saved.map((palette) => {
              const active = palette.colors.join() === paletteColors.join();
              return (
                <div key={palette.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applySaved(palette)}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border p-2 text-left transition-colors",
                      active ? "border-accent bg-accent-soft" : "border-line hover:bg-elevated",
                    )}
                  >
                    <SwatchStrip colors={palette.colors} className="h-6 w-14 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{palette.name}</span>
                      <span className="block truncate text-xs text-faint">
                        {palette.author ? `${palette.author} · ` : ""}
                        {palette.colors.length} colours · {palette.origin}
                      </span>
                    </span>
                    {active ? <Check className="h-4 w-4 shrink-0 text-accent" /> : null}
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${palette.name}`}
                    onClick={() => removeSaved(palette.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
