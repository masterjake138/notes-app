"use client";

import { useState } from "react";
import { Check, Plus, Tag as TagIcon } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import type { Tag } from "@/lib/db";

interface TagPickerProps {
  tags: Tag[];
  selectedIds: string[];
  onToggle: (tagId: string) => void;
  onCreate: (name: string) => void;
}

export function TagPicker({ tags, selectedIds, onToggle, onCreate }: TagPickerProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const submit = () => {
    const value = name.trim();
    if (value) onCreate(value);
    setName("");
  };

  return (
    <div className="relative">
      <IconButton
        aria-label="Tags"
        title="Tags"
        active={selectedIds.length > 0}
        onClick={() => setOpen((v) => !v)}
      >
        <TagIcon className="h-4 w-4" />
      </IconButton>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-60 origin-top-right rounded-xl border border-line bg-surface p-1.5 shadow-2xl animate-pop-in">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-faint">
              Tags
            </p>
            <div className="max-h-56 overflow-y-auto scrollbar-thin">
              {tags.length === 0 ? (
                <p className="px-2 py-2 text-xs text-faint">No tags yet.</p>
              ) : (
                tags.map((tag) => {
                  const selected = selectedIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => onToggle(tag.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-elevated"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="truncate text-ink">{tag.name}</span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4 shrink-0",
                          selected ? "text-accent" : "text-transparent",
                        )}
                      />
                    </button>
                  );
                })
              )}
            </div>

            <div className="mt-1 flex items-center gap-1 border-t border-line pt-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="New tag…"
                className="h-8 w-full rounded-lg border border-line bg-app px-2 text-base text-ink outline-none focus:border-accent sm:text-sm"
              />
              <IconButton size="sm" aria-label="Create tag" onClick={submit}>
                <Plus className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
