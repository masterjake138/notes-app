import type { JSONContent } from "@tiptap/core";
import { db, emptyDoc, TAG_COLORS, type Note } from "./db";

/** Recursively collect all text from a ProseMirror document. */
export function extractText(node: JSONContent | null | undefined): string {
  const parts: string[] = [];
  const walk = (current: JSONContent | null | undefined) => {
    if (!current) return;
    if (typeof current.text === "string" && current.text) parts.push(current.text);
    if (Array.isArray(current.content)) current.content.forEach(walk);
  };
  walk(node);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export async function createNote(init?: Partial<Note>): Promise<string> {
  const now = Date.now();
  const id = crypto.randomUUID();
  const note: Note = {
    id,
    title: "",
    content: emptyDoc(),
    plainText: "",
    tagIds: [],
    pinned: false,
    trashedAt: null,
    createdAt: now,
    updatedAt: now,
    ...init,
  };
  await db.notes.add(note);
  return id;
}

export function saveNoteBody(
  id: string,
  content: JSONContent,
  plainText: string,
): Promise<number> {
  return db.notes.update(id, { content, plainText, updatedAt: Date.now() });
}

export function saveNoteTitle(id: string, title: string): Promise<number> {
  return db.notes.update(id, { title, updatedAt: Date.now() });
}

export async function togglePin(id: string): Promise<void> {
  const note = await db.notes.get(id);
  if (!note) return;
  await db.notes.update(id, { pinned: !note.pinned });
}

export function trashNote(id: string): Promise<number> {
  return db.notes.update(id, {
    trashedAt: Date.now(),
    pinned: false,
  });
}

export function restoreNote(id: string): Promise<number> {
  return db.notes.update(id, { trashedAt: null, updatedAt: Date.now() });
}

export function deleteNoteForever(id: string): Promise<void> {
  return db.notes.delete(id);
}

export async function emptyTrash(): Promise<void> {
  const all = await db.notes.toArray();
  const trashed = all.filter((note) => note.trashedAt !== null).map((n) => n.id);
  await db.notes.bulkDelete(trashed);
}

export function setNoteTags(id: string, tagIds: string[]): Promise<number> {
  return db.notes.update(id, { tagIds });
}

export async function createTag(name: string, color?: string): Promise<string> {
  const trimmed = name.trim();
  const existing = await db.tags.where("name").equalsIgnoreCase(trimmed).first();
  if (existing) return existing.id;

  const id = crypto.randomUUID();
  const paletteIndex = await db.tags.count();
  await db.tags.add({
    id,
    name: trimmed,
    color: color ?? TAG_COLORS[paletteIndex % TAG_COLORS.length],
    createdAt: Date.now(),
  });
  return id;
}

export function renameTag(id: string, name: string): Promise<number> {
  return db.tags.update(id, { name: name.trim() });
}

export function updateTagColor(id: string, color: string): Promise<number> {
  return db.tags.update(id, { color });
}

export async function deleteTag(id: string): Promise<void> {
  await db.tags.delete(id);
  const tagged = await db.notes.where("tagIds").equals(id).toArray();
  await Promise.all(
    tagged.map((note) =>
      db.notes.update(note.id, {
        tagIds: note.tagIds.filter((tagId) => tagId !== id),
      }),
    ),
  );
}

const WELCOME_DOC: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This is your space for notes, ideas and to-dos. Everything is stored locally in your browser — fast, private and available offline.",
        },
      ],
    },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Try it out" }] },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Read this welcome note" }] },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Create a new note with the + button" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Format text using the toolbar above" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Switch between light and dark mode" }],
            },
          ],
        },
      ],
    },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Tips" }] },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Organise notes with tags" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Pin the notes you use most" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Search across every note instantly" }],
            },
          ],
        },
      ],
    },
  ],
};

/** Seeds a welcome note and starter tags the first time the app is opened. */
async function runSeed(): Promise<void> {
  const seeded = await db.settings.get("seeded");
  if (seeded) return;

  const noteCount = await db.notes.count();
  if (noteCount === 0) {
    const gettingStarted = await createTag("Getting started");
    await createNote({
      title: "Welcome to Notes",
      content: WELCOME_DOC,
      plainText: extractText(WELCOME_DOC),
      tagIds: [gettingStarted],
    });
  }

  await db.settings.put({ key: "seeded", value: "1" });
}

// Deduplicate concurrent calls (e.g. React StrictMode remounts in dev) so the
// welcome note is only ever created once.
let seedPromise: Promise<void> | null = null;

export function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}
