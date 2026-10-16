"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  FileText,
  NotebookPen,
  Pencil,
  Pin,
  Plus,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ColorPicker } from "@/components/ui/color-picker";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import { TAG_COLORS, type Tag } from "@/lib/db";
import { usePalette } from "@/lib/palette-store";
import type { Filter } from "@/store/ui";

interface SidebarProps {
  counts: { all: number; pinned: number; trash: number };
  tags: Array<Tag & { count: number }>;
  filter: Filter;
  onSelectFilter: (filter: Filter) => void;
  onCreateTag: (name: string) => void;
  onRenameTag: (id: string, name: string) => void;
  onRecolorTag: (id: string, color: string) => void;
  onDeleteTag: (tag: Tag) => void;
  onNewNote: () => void;
  onCloseDrawer: () => void;
  onExportData: () => void;
  onImportFile: (file: File) => void;
}

function isActive(filter: Filter, item: Filter): boolean {
  if (filter.type !== item.type) return false;
  if (filter.type === "tag" && item.type === "tag") {
    return filter.tagId === item.tagId;
  }
  return true;
}

export function Sidebar({
  counts,
  tags,
  filter,
  onSelectFilter,
  onCreateTag,
  onRenameTag,
  onRecolorTag,
  onDeleteTag,
  onNewNote,
  onCloseDrawer,
  onExportData,
  onImportFile,
}: SidebarProps) {
  const [addingTag, setAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const paletteColors = usePalette((s) => s.colors);
  const swatches = [...(paletteColors ?? []), ...TAG_COLORS];

  const navItems: Array<{ label: string; icon: typeof FileText; filter: Filter; count: number }> = [
    { label: "All notes", icon: FileText, filter: { type: "all" }, count: counts.all },
    { label: "Pinned", icon: Pin, filter: { type: "pinned" }, count: counts.pinned },
    { label: "Trash", icon: Trash2, filter: { type: "trash" }, count: counts.trash },
  ];

  const submitTag = () => {
    const name = newTagName.trim();
    if (name) onCreateTag(name);
    setNewTagName("");
    setAddingTag(false);
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-line bg-surface xl:w-72">
      <div className="flex h-14 shrink-0 items-center gap-2 px-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-accent-ink">
          <NotebookPen className="h-4.5 w-4.5" />
        </div>
        <span className="text-[0.95rem] font-semibold tracking-tight text-ink">Notes</span>
        <IconButton
          className="ml-auto lg:hidden"
          size="sm"
          aria-label="Close menu"
          onClick={onCloseDrawer}
        >
          <X className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="px-3 pb-1">
        <button
          type="button"
          onClick={onNewNote}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-accent-ink transition-transform hover:brightness-110 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          New note
        </button>
      </div>

      <nav className="mt-4 space-y-0.5 px-2">
        {navItems.map((item) => {
          const active = isActive(filter, item.filter);
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelectFilter(item.filter)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent-soft text-accent"
                  : "text-ink/80 hover:bg-elevated hover:text-ink",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
              <span
                className={cn(
                  "ml-auto text-xs tabular-nums",
                  active ? "text-accent/80" : "text-faint",
                )}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-6 flex min-h-0 flex-1 flex-col px-2">
        <div className="flex items-center justify-between px-2.5 pb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-faint">
            Tags
          </span>
          <IconButton
            size="sm"
            className="h-6 w-6"
            aria-label="New tag"
            onClick={() => setAddingTag(true)}
          >
            <Plus className="h-3.5 w-3.5" />
          </IconButton>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin pb-2">
          {addingTag ? (
            <div className="flex items-center gap-1 px-2.5 py-1">
              <input
                autoFocus
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitTag();
                  if (e.key === "Escape") {
                    setAddingTag(false);
                    setNewTagName("");
                  }
                }}
                onBlur={submitTag}
                placeholder="Tag name"
                className="h-8 w-full rounded-lg border border-line bg-app px-2 text-base text-ink outline-none focus:border-accent sm:text-sm"
              />
            </div>
          ) : null}

          {tags.length === 0 && !addingTag ? (
            <p className="px-2.5 py-2 text-xs leading-relaxed text-faint">
              No tags yet. Add one to group your notes.
            </p>
          ) : null}

          <div className="space-y-0.5">
            {tags.map((tag) => (
              <TagRow
                key={tag.id}
                tag={tag}
                active={isActive(filter, { type: "tag", tagId: tag.id })}
                swatches={swatches}
                onSelect={() => onSelectFilter({ type: "tag", tagId: tag.id })}
                onRename={(name) => onRenameTag(tag.id, name)}
                onRecolor={(color) => onRecolorTag(tag.id, color)}
                onDelete={() => onDeleteTag(tag)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-line p-3">
        <div className="flex flex-col gap-1 text-sm">
          <button
            type="button"
            onClick={onExportData}
            className="flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted transition-colors hover:bg-elevated hover:text-ink"
          >
            Export data
          </button>
          <label className="flex h-9 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted transition-colors hover:bg-elevated hover:text-ink">
            Import data
            <input
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImportFile(file);
                  e.currentTarget.value = "";
                }
              }}
            />
          </label>
        </div>
        <ThemeToggle />
        <Link
          href="/settings"
          className="flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted transition-colors hover:bg-elevated hover:text-ink"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}

interface TagRowProps {
  tag: Tag & { count: number };
  active: boolean;
  swatches: string[];
  onSelect: () => void;
  onRename: (name: string) => void;
  onRecolor: (color: string) => void;
  onDelete: () => void;
}

function TagRow({ tag, active, swatches, onSelect, onRename, onRecolor, onDelete }: TagRowProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(tag.name);

  const commit = () => {
    const name = value.trim();
    if (name && name !== tag.name) onRename(name);
    else setValue(tag.name);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 px-2.5 py-1">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setValue(tag.name);
              setEditing(false);
            }
          }}
          onBlur={commit}
          className="h-8 w-full rounded-lg border border-line bg-app px-2 text-base text-ink outline-none focus:border-accent sm:text-sm"
        />
        <IconButton size="sm" className="h-7 w-7" aria-label="Save tag" onClick={commit}>
          <Check className="h-3.5 w-3.5" />
        </IconButton>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
        active ? "bg-accent-soft" : "hover:bg-elevated",
      )}
    >
      <ColorPicker
        label={`Colour for ${tag.name}`}
        value={tag.color}
        swatches={swatches}
        onChange={onRecolor}
        triggerClassName="h-2.5 w-2.5 hover:scale-125"
      />
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
      >
        <span
          className={cn(
            "truncate text-sm font-medium",
            active ? "text-accent" : "text-ink/80",
          )}
        >
          {tag.name}
        </span>
        <span
          className={cn(
            "ml-auto text-xs tabular-nums transition-opacity group-hover:opacity-0",
            active ? "text-accent/80" : "text-faint",
          )}
        >
          {tag.count}
        </span>
      </button>
      <div className="absolute right-2 flex items-center opacity-0 transition-opacity group-hover:opacity-100">
        <IconButton
          size="sm"
          className="h-7 w-7"
          aria-label={`Rename ${tag.name}`}
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton
          size="sm"
          className="h-7 w-7 hover:text-danger"
          aria-label={`Delete ${tag.name}`}
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </IconButton>
      </div>
    </div>
  );
}
