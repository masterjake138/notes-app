"use client";

import { useEffect, useRef } from "react";
import { Menu, Plus, Search, Trash2, X } from "lucide-react";
import { NoteListItem } from "@/components/note-list-item";
import { EmptyState } from "@/components/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import type { Note, Tag } from "@/lib/db";
import type { Filter, SortKey } from "@/store/ui";

interface NoteListProps {
  notes: Note[];
  tags: Tag[];
  loading: boolean;
  heading: string;
  filter: Filter;
  search: string;
  sort: SortKey;
  selectedNoteId: string | null;
  onSearch: (search: string) => void;
  onSort: (sort: SortKey) => void;
  onSelect: (id: string) => void;
  onTogglePin: (note: Note) => void;
  onTrash: (note: Note) => void;
  onRestore: (note: Note) => void;
  onDeleteForever: (note: Note) => void;
  onEmptyTrash: () => void;
  onOpenSidebar: () => void;
  onNewNote: () => void;
}

export function NoteList({
  notes,
  tags,
  loading,
  heading,
  filter,
  search,
  sort,
  selectedNoteId,
  onSearch,
  onSort,
  onSelect,
  onTogglePin,
  onTrash,
  onRestore,
  onDeleteForever,
  onEmptyTrash,
  onOpenSidebar,
  onNewNote,
}: NoteListProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const trashed = filter.type === "trash";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section className="relative flex h-full w-full flex-col border-r border-line bg-surface">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3">
        <IconButton className="lg:hidden" aria-label="Open menu" onClick={onOpenSidebar}>
          <Menu className="h-4.5 w-4.5" />
        </IconButton>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search notes"
            type="search"
            className="h-9 w-full rounded-xl border border-line bg-app pl-9 pr-8 text-base text-ink outline-none transition-colors placeholder:text-faint focus:border-accent sm:text-sm"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearch("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-faint transition-colors hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex h-10 shrink-0 items-center justify-between px-3">
        <span className="truncate text-xs font-semibold uppercase tracking-wider text-faint">
          {heading}
          {!loading ? <span className="ml-1.5 text-faint/70">{notes.length}</span> : null}
        </span>
        {trashed ? (
          notes.length > 0 ? (
            <button
              type="button"
              onClick={onEmptyTrash}
              className="text-xs font-medium text-muted transition-colors hover:text-danger"
            >
              Empty trash
            </button>
          ) : null
        ) : (
          <label className="flex items-center gap-1 text-xs text-muted">
            <span className="sr-only">Sort notes</span>
            <select
              value={sort}
              onChange={(e) => onSort(e.target.value as SortKey)}
              className="cursor-pointer rounded-md bg-transparent py-0.5 text-xs font-medium text-muted outline-none transition-colors hover:text-ink"
            >
              <option value="updated">Last edited</option>
              <option value="created">Date created</option>
              <option value="title">Title</option>
            </select>
          </label>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-2 pb-24 md:pb-3">
        {loading ? (
          <div className="space-y-2 px-1 pt-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[4.5rem] animate-pulse rounded-xl bg-elevated/70" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <EmptyState
            icon={trashed ? <Trash2 className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            title={
              search
                ? "No matching notes"
                : trashed
                  ? "Trash is empty"
                  : "No notes yet"
            }
            description={
              search
                ? "Try a different search term."
                : trashed
                  ? "Deleted notes will appear here."
                  : "Create your first note to get started."
            }
            action={
              !search && !trashed ? (
                <button
                  type="button"
                  onClick={onNewNote}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-semibold text-accent-ink transition-transform hover:brightness-110 active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  New note
                </button>
              ) : null
            }
          />
        ) : (
          <div className="space-y-0.5">
            {notes.map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                tags={tags}
                active={note.id === selectedNoteId}
                trashed={trashed}
                onSelect={() => onSelect(note.id)}
                onTogglePin={() => onTogglePin(note)}
                onTrash={() => onTrash(note)}
                onRestore={() => onRestore(note)}
                onDeleteForever={() => onDeleteForever(note)}
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onNewNote}
        aria-label="New note"
        className={cn(
          "absolute bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-ink shadow-lg transition-transform hover:brightness-110 active:scale-95 md:hidden",
        )}
      >
        <Plus className="h-6 w-6" />
      </button>
    </section>
  );
}
