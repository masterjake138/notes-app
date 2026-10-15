import Dexie, { type Table } from "dexie";
import type { JSONContent } from "@tiptap/core";

export interface Note {
  id: string;
  title: string;
  /** Tiptap / ProseMirror document JSON. */
  content: JSONContent;
  /** Flattened text used for fast full-text style search. */
  plainText: string;
  tagIds: string[];
  pinned: boolean;
  /** Timestamp when moved to trash, or `null` when active. */
  trashedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface Setting {
  key: string;
  value: string;
}

/** Palette used for tag dots. */
export const TAG_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
] as const;

class NotesDatabase extends Dexie {
  notes!: Table<Note, string>;
  tags!: Table<Tag, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super("notes-app");
    this.version(1).stores({
      notes: "id, updatedAt, createdAt, pinned, trashedAt, *tagIds",
      tags: "id, name, createdAt",
      settings: "key",
    });
  }
}

export const db = new NotesDatabase();

export function emptyDoc(): JSONContent {
  return { type: "doc", content: [{ type: "paragraph" }] };
}
