"use client";

import { Pin, RotateCcw, Trash2 } from "lucide-react";
import { cn, formatTimestamp } from "@/lib/utils";
import type { Note, Tag } from "@/lib/db";

interface NoteListItemProps {
  note: Note;
  tags: Tag[];
  active: boolean;
  trashed: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
  onTrash: () => void;
  onRestore: () => void;
  onDeleteForever: () => void;
}

export function NoteListItem({
  note,
  tags,
  active,
  trashed,
  onSelect,
  onTogglePin,
  onTrash,
  onRestore,
  onDeleteForever,
}: NoteListItemProps) {
  const rawTitle = note.title.trim();
  const text = note.plainText.trim();
  const displayTitle = rawTitle || (text ? text.slice(0, 60) : "Untitled note");
  const snippet = rawTitle ? text.slice(0, 160) : text.slice(60, 220);

  const noteTags = note.tagIds
    .map((id) => tags.find((tag) => tag.id === id))
    .filter((tag): tag is Tag => Boolean(tag));

  return (
    <div
      className={cn(
        "group relative rounded-xl border transition-colors",
        active
          ? "border-accent/40 bg-accent-soft"
          : "border-transparent hover:bg-elevated",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Open ${displayTitle}`}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
      />

      <div className="pointer-events-none relative z-10 px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          {note.pinned ? (
            <Pin className="h-3 w-3 shrink-0 text-accent" fill="currentColor" />
          ) : null}
          <h3
            className={cn(
              "truncate text-sm font-semibold",
              active ? "text-accent" : "text-ink",
            )}
          >
            {displayTitle}
          </h3>
        </div>

        {snippet ? (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">
            {snippet}
          </p>
        ) : null}

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[0.7rem] text-faint">
            {formatTimestamp(note.updatedAt)}
          </span>
          {noteTags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full bg-elevated px-1.5 py-0.5 text-[0.65rem] font-medium text-muted"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute right-2 top-2 z-20 flex items-center gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
        {trashed ? (
          <>
            <button
              type="button"
              onClick={onRestore}
              aria-label="Restore note"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface/80 text-muted backdrop-blur transition-colors hover:text-ink"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDeleteForever}
              aria-label="Delete permanently"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface/80 text-muted backdrop-blur transition-colors hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onTogglePin}
              aria-label={note.pinned ? "Unpin note" : "Pin note"}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg bg-surface/80 backdrop-blur transition-colors hover:text-ink",
                note.pinned ? "text-accent" : "text-muted",
              )}
            >
              <Pin className="h-3.5 w-3.5" fill={note.pinned ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              onClick={onTrash}
              aria-label="Move to trash"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface/80 text-muted backdrop-blur transition-colors hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
