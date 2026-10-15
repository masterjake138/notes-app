"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, Pipette, X } from "lucide-react";
import { normalizeHex } from "@/lib/color";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/icon-button";

interface ColorPickerProps {
  value?: string;
  swatches?: string[];
  /** Called with a normalised `#rrggbb` colour. */
  onChange: (color: string) => void;
  /** When provided, renders a "None" action that calls this. */
  onClear?: () => void;
  label?: string;
  /** Custom trigger; defaults to a circular colour swatch. */
  children?: ReactNode;
  triggerClassName?: string;
  align?: "left" | "right";
}

const PANEL_WIDTH = 236;
const PANEL_HEIGHT = 268;

export function ColorPicker({
  value,
  swatches = [],
  onChange,
  onClear,
  label = "Colour",
  children,
  triggerClassName,
  align = "left",
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [draft, setDraft] = useState(value ?? "#000000");
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setDraft(value ?? "#000000");
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      let left = align === "right" ? rect.right - PANEL_WIDTH : rect.left;
      left = Math.max(8, Math.min(left, window.innerWidth - PANEL_WIDTH - 8));
      let top = rect.bottom + 6;
      if (top + PANEL_HEIGHT > window.innerHeight - 8) {
        top = Math.max(8, rect.top - PANEL_HEIGHT - 6);
      }
      setPosition({ top, left });
    }
    setOpen(true);
  };

  const pick = (color: string) => {
    const hex = normalizeHex(color);
    if (!hex) return;
    setDraft(hex);
    onChange(hex);
  };

  const uniqueSwatches = Array.from(new Set(swatches.map((c) => normalizeHex(c)).filter(Boolean) as string[]));

  return (
    <div className="relative inline-flex">
      <div ref={triggerRef} className="contents">
        {children ? (
          <button
            type="button"
            onClick={toggle}
            aria-label={label}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={triggerClassName}
          >
            {children}
          </button>
        ) : (
          <button
            type="button"
            onClick={toggle}
            aria-label={label}
            aria-haspopup="dialog"
            aria-expanded={open}
            title={label}
            className={cn(
              "shrink-0 rounded-full ring-1 ring-inset ring-black/15 transition-transform hover:scale-110",
              triggerClassName ?? "h-6 w-6",
            )}
            style={{ backgroundColor: value ?? "var(--c-elevated)" }}
          />
        )}
      </div>

      {open && position
        ? createPortal(
            <>
              <div
                className="fixed inset-0 z-[70]"
                onClick={() => setOpen(false)}
                aria-hidden="true"
              />
              <div
                role="dialog"
                aria-label={label}
                className="fixed z-[71] rounded-xl border border-line bg-surface p-2.5 shadow-2xl animate-pop-in"
                style={{ top: position.top, left: position.left, width: PANEL_WIDTH }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-faint">
                    {label}
                  </span>
                  <IconButton size="sm" className="h-6 w-6" aria-label="Close" onClick={() => setOpen(false)}>
                    <X className="h-3.5 w-3.5" />
                  </IconButton>
                </div>

                {uniqueSwatches.length > 0 ? (
                  <div className="grid grid-cols-6 gap-1.5">
                    {uniqueSwatches.map((color) => {
                      const selected = value?.toLowerCase() === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => pick(color)}
                          title={color}
                          aria-label={color}
                          className={cn(
                            "relative flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-inset ring-black/15 transition-transform hover:scale-110",
                            selected && "ring-2 ring-accent",
                          )}
                          style={{ backgroundColor: color }}
                        >
                          {selected ? <Check className="h-3.5 w-3.5 text-black/70" /> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                <div className="mt-2.5 flex items-center gap-1.5 border-t border-line pt-2.5">
                  <label
                    className="relative flex h-8 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line"
                    style={{ backgroundColor: draft }}
                    title="Pick a colour"
                  >
                    <Pipette className="h-3.5 w-3.5 text-white mix-blend-difference" />
                    <input
                      type="color"
                      value={draft}
                      onChange={(event) => pick(event.target.value)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                      aria-label="Custom colour"
                    />
                  </label>
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onBlur={() => {
                      const hex = normalizeHex(draft);
                      if (hex) pick(hex);
                      else setDraft(value ?? "#000000");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        const hex = normalizeHex(draft);
                        if (hex) pick(hex);
                      }
                    }}
                    spellCheck={false}
                    className="h-8 w-full rounded-lg border border-line bg-app px-2 font-mono text-xs uppercase text-ink outline-none focus:border-accent"
                    aria-label="Hex value"
                  />
                </div>

                {onClear ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClear();
                      setOpen(false);
                    }}
                    className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-line text-xs font-medium text-muted transition-colors hover:bg-elevated hover:text-ink"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove colour
                  </button>
                ) : null}
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
