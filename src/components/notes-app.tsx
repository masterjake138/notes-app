"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { FileText, Plus } from "lucide-react";
import { db, type Note, type Tag } from "@/lib/db";
import {
  createNote,
  createTag,
  deleteNoteForever,
  deleteTag,
  emptyTrash,
  ensureSeeded,
  renameTag,
  restoreNote,
  setNoteTags,
  togglePin,
  trashNote,
  updateTagColor,
} from "@/lib/notes";
import { useUI, type Filter, type SortKey } from "@/store/ui";
import { Sidebar } from "@/components/sidebar";
import { NoteList } from "@/components/note-list";
import { NoteEditor } from "@/components/editor/note-editor";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

export default function NotesApp() {
  const filter = useUI((s) => s.filter);
  const selectedNoteId = useUI((s) => s.selectedNoteId);
  const search = useUI((s) => s.search);
  const sort = useUI((s) => s.sort);
  const sidebarOpen = useUI((s) => s.sidebarOpen);

  const setFilter = useUI((s) => s.setFilter);
  const selectNote = useUI((s) => s.selectNote);
  const setSearch = useUI((s) => s.setSearch);
  const setSort = useUI((s) => s.setSort);
  const setSidebarOpen = useUI((s) => s.setSidebarOpen);
  const requestConfirm = useUI((s) => s.requestConfirm);

  const allNotes = useLiveQuery(() => db.notes.toArray(), []);
  const tags = useLiveQuery(() => db.tags.toArray(), []);
  const loading = allNotes === undefined || tags === undefined;

  // Seed a welcome note the first time the app runs.
  useEffect(() => {
    void ensureSeeded();
  }, []);

  // Restore the saved sort preference once, then persist changes.
  const sortHydrated = useRef(false);
  useEffect(() => {
    let cancelled = false;
    void db.settings.get("sort").then((setting) => {
      if (cancelled) return;
      if (setting && ["updated", "created", "title"].includes(setting.value)) {
        setSort(setting.value as SortKey);
      }
      sortHydrated.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, [setSort]);

  useEffect(() => {
    if (!sortHydrated.current) return;
    void db.settings.put({ key: "sort", value: sort });
  }, [sort]);

  // Close the mobile drawer on Escape.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSidebarOpen]);

  const activeNotes = useMemo(
    () => (allNotes ?? []).filter((note) => note.trashedAt === null),
    [allNotes],
  );
  const trashedNotes = useMemo(
    () => (allNotes ?? []).filter((note) => note.trashedAt !== null),
    [allNotes],
  );

  const selectedNote = useMemo(
    () => (allNotes ?? []).find((note) => note.id === selectedNoteId) ?? null,
    [allNotes, selectedNoteId],
  );

  // Clear a stale selection (e.g. after the note was deleted elsewhere).
  useEffect(() => {
    if (allNotes && selectedNoteId && !allNotes.some((n) => n.id === selectedNoteId)) {
      selectNote(null);
    }
  }, [allNotes, selectedNoteId, selectNote]);

  const filteredNotes = useMemo(() => {
    let list: Note[];
    if (filter.type === "trash") list = trashedNotes;
    else if (filter.type === "pinned") list = activeNotes.filter((n) => n.pinned);
    else if (filter.type === "tag")
      list = activeNotes.filter((n) => n.tagIds.includes(filter.tagId));
    else list = activeNotes;

    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.plainText.toLowerCase().includes(query),
      );
    }

    const sorted = [...list];
    if (filter.type === "trash") {
      sorted.sort((a, b) => (b.trashedAt ?? 0) - (a.trashedAt ?? 0));
    } else {
      sorted.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        if (sort === "title") {
          const at = (a.title || a.plainText).toLowerCase();
          const bt = (b.title || b.plainText).toLowerCase();
          return at.localeCompare(bt);
        }
        if (sort === "created") return b.createdAt - a.createdAt;
        return b.updatedAt - a.updatedAt;
      });
    }
    return sorted;
  }, [activeNotes, trashedNotes, filter, search, sort]);

  const heading = useMemo(() => {
    if (filter.type === "trash") return "Trash";
    if (filter.type === "pinned") return "Pinned";
    if (filter.type === "tag") {
      return tags?.find((tag) => tag.id === filter.tagId)?.name ?? "Tag";
    }
    return "All notes";
  }, [filter, tags]);

  const tagsWithCounts = useMemo(() => {
    return (tags ?? [])
      .map((tag) => ({
        ...tag,
        count: activeNotes.filter((note) => note.tagIds.includes(tag.id)).length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tags, activeNotes]);

  const counts = {
    all: activeNotes.length,
    pinned: activeNotes.filter((note) => note.pinned).length,
    trash: trashedNotes.length,
  };

  const handleNewNote = useCallback(async () => {
    const id = await createNote();
    if (filter.type !== "all") setFilter({ type: "all" });
    selectNote(id);
  }, [filter.type, setFilter, selectNote]);

  const handleSelectFilter = useCallback(
    (next: Filter) => {
      setFilter(next);
    },
    [setFilter],
  );

  const handleTrash = useCallback(
    async (note: Note) => {
      await trashNote(note.id);
      if (selectedNoteId === note.id) selectNote(null);
    },
    [selectedNoteId, selectNote],
  );

  const handleDeleteForever = useCallback(
    (note: Note) => {
      requestConfirm({
        title: "Delete note permanently?",
        description: "This action cannot be undone.",
        confirmLabel: "Delete",
        danger: true,
        onConfirm: () => {
          if (selectedNoteId === note.id) selectNote(null);
          void deleteNoteForever(note.id);
        },
      });
    },
    [requestConfirm, selectedNoteId, selectNote],
  );

  const handleEmptyTrash = useCallback(() => {
    requestConfirm({
      title: "Empty trash?",
      description: "All notes in the trash will be permanently deleted.",
      confirmLabel: "Empty trash",
      danger: true,
      onConfirm: () => {
        selectNote(null);
        void emptyTrash();
      },
    });
  }, [requestConfirm, selectNote]);

  const handleDeleteTag = useCallback(
    (tag: Tag) => {
      requestConfirm({
        title: `Delete tag “${tag.name}”?`,
        description: "The tag will be removed from every note. Notes are not deleted.",
        confirmLabel: "Delete tag",
        danger: true,
        onConfirm: () => {
          if (filter.type === "tag" && filter.tagId === tag.id) {
            setFilter({ type: "all" });
          }
          void deleteTag(tag.id);
        },
      });
    },
    [requestConfirm, filter, setFilter],
  );

  const handleToggleTag = useCallback(
    async (note: Note, tagId: string) => {
      const next = note.tagIds.includes(tagId)
        ? note.tagIds.filter((id) => id !== tagId)
        : [...note.tagIds, tagId];
      await setNoteTags(note.id, next);
    },
    [],
  );

  const handleCreateTagForNote = useCallback(
    async (note: Note, name: string, color?: string) => {
      const id = await createTag(name, color);
      const fresh = await db.notes.get(note.id);
      if (fresh && !fresh.tagIds.includes(id)) {
        await setNoteTags(note.id, [...fresh.tagIds, id]);
      }
    },
    [],
  );

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-app">
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 h-full shrink-0 transition-transform duration-200 ease-out",
          "lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar
          counts={counts}
          tags={tagsWithCounts}
          filter={filter}
          onSelectFilter={handleSelectFilter}
          onCreateTag={(name) => void createTag(name)}
          onRenameTag={(id, name) => void renameTag(id, name)}
          onRecolorTag={(id, color) => void updateTagColor(id, color)}
          onDeleteTag={handleDeleteTag}
          onNewNote={() => void handleNewNote()}
          onCloseDrawer={() => setSidebarOpen(false)}
        />
      </div>

      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 animate-fade-in lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <div
        className={cn(
          "h-full min-h-0 w-full shrink-0 md:w-80 xl:w-[22rem]",
          selectedNote ? "hidden md:flex" : "flex",
        )}
      >
        <NoteList
          notes={filteredNotes}
          tags={tags ?? []}
          loading={loading}
          heading={heading}
          filter={filter}
          search={search}
          sort={sort}
          selectedNoteId={selectedNoteId}
          onSearch={setSearch}
          onSort={setSort}
          onSelect={selectNote}
          onTogglePin={(note) => void togglePin(note.id)}
          onTrash={(note) => void handleTrash(note)}
          onRestore={(note) => void restoreNote(note.id)}
          onDeleteForever={handleDeleteForever}
          onEmptyTrash={handleEmptyTrash}
          onOpenSidebar={() => setSidebarOpen(true)}
          onNewNote={() => void handleNewNote()}
        />
      </div>

      {selectedNote ? (
        <NoteEditor
          key={selectedNote.id}
          note={selectedNote}
          allTags={tags ?? []}
          onBack={() => selectNote(null)}
          onTogglePin={() => void togglePin(selectedNote.id)}
          onToggleTag={(tagId) => void handleToggleTag(selectedNote, tagId)}
          onCreateTag={(name, color) => void handleCreateTagForNote(selectedNote, name, color)}
          onRecolorTag={(tagId, color) => void updateTagColor(tagId, color)}
          onTrash={() => void handleTrash(selectedNote)}
          onRestore={() => void restoreNote(selectedNote.id)}
          onDeleteForever={() => handleDeleteForever(selectedNote)}
        />
      ) : (
        <main className="hidden h-full min-w-0 flex-1 flex-col bg-app md:flex">
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="No note selected"
            description="Pick a note from the list, or create a new one to start writing."
            action={
              <button
                type="button"
                onClick={() => void handleNewNote()}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-semibold text-accent-ink transition-transform hover:brightness-110 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                New note
              </button>
            }
          />
        </main>
      )}

      <ConfirmDialog />
    </div>
  );
}
