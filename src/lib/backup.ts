import type { JSONContent } from "@tiptap/core";
import { db, type Note, type Setting, type Tag } from "./db";

export interface BackupData {
  /** Backup format version. */
  version: number;
  /** Timestamp when the backup was exported (milliseconds since epoch). */
  exportedAt: number;
  /** App version from package.json, if available. */
  appVersion?: string;
  /** Dexie schema version at time of export. */
  schemaVersion: number;
  notes: Note[];
  tags: Tag[];
  settings: Setting[];
}

const BACKUP_VERSION = 1;
const SCHEMA_VERSION = 1;

/**
 * Export all data from the database as a backup object.
 */
export async function exportData(): Promise<BackupData> {
  const [notes, tags, settings] = await Promise.all([
    db.notes.toArray(),
    db.tags.toArray(),
    db.settings.toArray(),
  ]);

  let appVersion: string | undefined;
  try {
    // Dynamically import package.json for version info
    const pkg = await import("../../package.json").then((m) => m.default ?? m);
    if (typeof pkg?.version === "string") {
      appVersion = pkg.version;
    }
  } catch {
    // Ignore if package.json can't be read
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    appVersion,
    schemaVersion: SCHEMA_VERSION,
    notes,
    tags,
    settings,
  };
}

/**
 * Download backup data as a JSON file.
 */
export function downloadBackup(data: BackupData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const date = new Date(data.exportedAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const filename = `notes-backup-${year}-${month}-${day}.json`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export all data and trigger a download.
 */
export async function exportAndDownload(): Promise<void> {
  const data = await exportData();
  downloadBackup(data);
}

/**
 * Type guard to validate backup data structure.
 */
export function validateBackup(data: unknown): data is BackupData {
  if (!data || typeof data !== "object") {
    return false;
  }

  const backup = data as Partial<BackupData>;

  // Check required fields
  if (typeof backup.version !== "number") {
    return false;
  }
  if (typeof backup.exportedAt !== "number") {
    return false;
  }
  if (!Array.isArray(backup.notes)) {
    return false;
  }
  if (!Array.isArray(backup.tags)) {
    return false;
  }
  if (!Array.isArray(backup.settings)) {
    return false;
  }

  // Basic validation of notes
  for (const note of backup.notes) {
    if (!note || typeof note !== "object") {
      return false;
    }
    if (typeof note.id !== "string") {
      return false;
    }
    if (typeof note.title !== "string") {
      return false;
    }
    if (!note.content || typeof note.content !== "object") {
      return false;
    }
    if (typeof (note.content as JSONContent).type !== "string") {
      return false;
    }
    if (typeof note.plainText !== "string") {
      return false;
    }
    if (!Array.isArray(note.tagIds)) {
      return false;
    }
    if (typeof note.pinned !== "boolean") {
      return false;
    }
    if (note.trashedAt !== null && typeof note.trashedAt !== "number") {
      return false;
    }
    if (typeof note.createdAt !== "number") {
      return false;
    }
    if (typeof note.updatedAt !== "number") {
      return false;
    }
  }

  // Basic validation of tags
  for (const tag of backup.tags) {
    if (!tag || typeof tag !== "object") {
      return false;
    }
    if (typeof tag.id !== "string") {
      return false;
    }
    if (typeof tag.name !== "string") {
      return false;
    }
    if (typeof tag.color !== "string") {
      return false;
    }
    if (typeof tag.createdAt !== "number") {
      return false;
    }
  }

  // Basic validation of settings
  for (const setting of backup.settings) {
    if (!setting || typeof setting !== "object") {
      return false;
    }
    if (typeof setting.key !== "string") {
      return false;
    }
    if (typeof setting.value !== "string") {
      return false;
    }
  }

  return true;
}

export interface ImportOptions {
  /** Whether to replace existing data (default: true). */
  replace?: boolean;
}

export interface ImportResult {
  notesImported: number;
  tagsImported: number;
  settingsImported: number;
}

/**
 * Import backup data into the database.
 */
export async function importData(
  data: BackupData,
  opts: ImportOptions = {},
): Promise<ImportResult> {
  const replace = opts.replace ?? true;

  if (replace) {
    await db.transaction("rw", db.notes, db.tags, db.settings, async () => {
      await Promise.all([db.notes.clear(), db.tags.clear(), db.settings.clear()]);
    });
  }

  // Import in any order - no foreign key constraints
  await db.transaction("rw", db.notes, db.tags, db.settings, async () => {
    if (data.notes.length > 0) {
      await db.notes.bulkPut(data.notes);
    }
    if (data.tags.length > 0) {
      await db.tags.bulkPut(data.tags);
    }
    if (data.settings.length > 0) {
      await db.settings.bulkPut(data.settings);
    }
  });

  return {
    notesImported: data.notes.length,
    tagsImported: data.tags.length,
    settingsImported: data.settings.length,
  };
}