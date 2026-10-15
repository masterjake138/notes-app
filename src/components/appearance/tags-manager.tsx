"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Check, Plus, Trash2 } from "lucide-react";
import { ColorPicker } from "@/components/ui/color-picker";
import { IconButton } from "@/components/ui/icon-button";
import { db, TAG_COLORS, type Tag } from "@/lib/db";
import { createTag, deleteTag, renameTag, updateTagColor } from "@/lib/notes";
import { usePalette } from "@/lib/palette-store";
import { useUI } from "@/store/ui";
import { cn } from "@/lib/utils";

function TagEditRow({ tag, count, swatches }: { tag: Tag; count: number; swatches: string[] }) {
  const [name, setName] = useState(tag.name);
  const requestConfirm = useUI((s) => s.requestConfirm);

  const commit = () => {
    const value = name.trim();
    if (value && value !== tag.name) void renameTag(tag.id, value);
    else setName(tag.name);
  };

  const remove = () => {
    requestConfirm({
      title: `Delete tag “${tag.name}”?`,
      description: "The tag will be removed from every note. Notes are not deleted.",
      confirmLabel: "Delete tag",
      danger: true,
      onConfirm: () => void deleteTag(tag.id),
    });
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-line px-2 py-1.5">
      <ColorPicker
        label={`Colour for ${tag.name}`}
        value={tag.color}
        swatches={swatches}
        onChange={(color) => void updateTagColor(tag.id, color)}
      />
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setName(tag.name);
            event.currentTarget.blur();
          }
        }}
        className="h-8 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1.5 text-base text-ink outline-none transition-colors hover:border-line focus:border-accent sm:text-sm"
      />
      <span className="shrink-0 text-xs tabular-nums text-faint">
        {count} {count === 1 ? "note" : "notes"}
      </span>
      <IconButton
        size="sm"
        className="h-7 w-7 hover:text-danger"
        aria-label={`Delete ${tag.name}`}
        onClick={remove}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </IconButton>
    </div>
  );
}

export function TagsManager() {
  const tags = useLiveQuery(() => db.tags.toArray(), []);
  const notes = useLiveQuery(() => db.notes.toArray(), []);
  const paletteColors = usePalette((s) => s.colors);

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string | null>(null);

  const swatches = useMemo(
    () => [...(paletteColors ?? []), ...TAG_COLORS],
    [paletteColors],
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const note of notes ?? []) {
      if (note.trashedAt !== null) continue;
      for (const id of note.tagIds) map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [notes]);

  const sorted = useMemo(
    () => [...(tags ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [tags],
  );

  const color = newColor ?? swatches[0] ?? "#6366f1";

  const create = () => {
    const value = newName.trim();
    if (!value) return;
    void createTag(value, color);
    setNewName("");
    setNewColor(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-muted">
        Choose a colour for each tag, rename it, or remove it. Colours show up on note chips and in
        the sidebar.
      </p>

      {sorted.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-3.5 py-6 text-center text-sm text-faint">
          No tags yet. Create one below.
        </p>
      ) : (
        <div className="space-y-1.5">
          {sorted.map((tag) => (
            <TagEditRow key={tag.id} tag={tag} count={counts.get(tag.id) ?? 0} swatches={swatches} />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface p-2">
        <ColorPicker
          label="New tag colour"
          value={color}
          swatches={swatches}
          onChange={(next) => setNewColor(next)}
        />
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") create();
          }}
          placeholder="New tag name…"
          className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-app px-2.5 text-base text-ink outline-none focus:border-accent sm:text-sm"
        />
        <button
          type="button"
          onClick={create}
          disabled={!newName.trim()}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-semibold text-accent-ink transition-transform hover:brightness-110 active:scale-95",
            !newName.trim() && "pointer-events-none opacity-50",
          )}
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-faint">
        <Check className="h-3.5 w-3.5 text-accent" />
        Changes save automatically.
      </p>
    </div>
  );
}
