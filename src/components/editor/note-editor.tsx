"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Highlight } from "@tiptap/extension-highlight";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import type { JSONContent } from "@tiptap/core";
import {
  Check,
  ChevronLeft,
  Loader2,
  Pin,
  PinOff,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { TagPicker } from "@/components/editor/tag-picker";
import { IconButton } from "@/components/ui/icon-button";
import { withAlpha } from "@/lib/color";
import { cn, countWords, formatFullDate } from "@/lib/utils";
import { extractText, saveNoteBody, saveNoteTitle } from "@/lib/notes";
import type { Note, Tag } from "@/lib/db";

interface NoteEditorProps {
  note: Note;
  allTags: Tag[];
  onBack: () => void;
  onTogglePin: () => void;
  onToggleTag: (tagId: string) => void;
  onCreateTag: (name: string, color?: string) => void;
  onRecolorTag: (tagId: string, color: string) => void;
  onTrash: () => void;
  onRestore: () => void;
  onDeleteForever: () => void;
}

type SaveStatus = "idle" | "saving" | "saved";

/**
 * The stock Highlight mark paints an opaque background and keeps the theme's
 * text colour, which makes light text unreadable on bright highlights in dark
 * mode. We store the plain hex in `data-color` (so the picker round-trips) but
 * render a translucent background, which reads well on either theme.
 */
const PaletteHighlight = Highlight.extend({
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-color") || element.style.backgroundColor || null,
        renderHTML: (attributes: { color?: string | null }) => {
          if (!attributes.color) return {};
          return {
            "data-color": attributes.color,
            style: `background-color: ${withAlpha(attributes.color, 0.4)}; color: inherit`,
          };
        },
      },
    };
  },
}).configure({ multicolor: true });

function buildExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      },
    }),
    Placeholder.configure({ placeholder: "Start writing…" }),
    TaskList,
    TaskItem.configure({ nested: true }),
    TextStyle,
    Color,
    PaletteHighlight,
  ];
}

export function NoteEditor({
  note,
  allTags,
  onBack,
  onTogglePin,
  onToggleTag,
  onCreateTag,
  onRecolorTag,
  onTrash,
  onRestore,
  onDeleteForever,
}: NoteEditorProps) {
  const readOnly = note.trashedAt !== null;

  const [title, setTitle] = useState(note.title);
  const [text, setText] = useState(() => extractText(note.content));
  const [status, setStatus] = useState<SaveStatus>("idle");

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{
    body?: { content: JSONContent; text: string };
    title?: string;
  }>({});

  const schedule = useCallback(() => {
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      timer.current = null;
      const queued = pending.current;
      pending.current = {};
      const tasks: Array<Promise<unknown>> = [];
      if (queued.title !== undefined) tasks.push(saveNoteTitle(note.id, queued.title));
      if (queued.body) tasks.push(saveNoteBody(note.id, queued.body.content, queued.body.text));
      if (tasks.length) await Promise.all(tasks);
      setStatus("saved");
    }, 550);
  }, [note.id]);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const queued = pending.current;
    pending.current = {};
    const tasks: Array<Promise<unknown>> = [];
    if (queued.title !== undefined) tasks.push(saveNoteTitle(note.id, queued.title));
    if (queued.body) tasks.push(saveNoteBody(note.id, queued.body.content, queued.body.text));
    if (tasks.length) await Promise.all(tasks);
  }, [note.id]);

  const extensions = useMemo(() => buildExtensions(), []);

  const editor = useEditor({
    extensions,
    content: note.content,
    immediatelyRender: false,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: "tiptap focus:outline-none",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: instance }) => {
      const json = instance.getJSON();
      const plain = instance.getText();
      pending.current.body = { content: json, text: plain };
      setText(plain);
      schedule();
    },
  });

  // Keep editability in sync when a note is trashed or restored in place.
  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [editor, readOnly]);

  // Flush any pending edits when switching away from this note.
  useEffect(() => {
    return () => {
      void flush();
    };
  }, [flush]);

  useEffect(() => {
    document.title = `${title.trim() || "Untitled"} · Notes`;
  }, [title]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    pending.current.title = value;
    schedule();
  };

  const words = countWords(text);

  return (
    <main className="relative flex h-full min-w-0 flex-1 flex-col bg-app">
      <header className="flex h-14 shrink-0 items-center gap-1 border-b border-line px-2 sm:px-3">
        <IconButton className="md:hidden" aria-label="Back to list" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </IconButton>

        <StatusBadge status={status} readOnly={readOnly} />

        <div className="ml-auto flex items-center gap-0.5">
          {readOnly ? (
            <>
              <IconButton aria-label="Restore note" title="Restore" onClick={onRestore}>
                <RotateCcw className="h-4 w-4" />
              </IconButton>
              <IconButton
                aria-label="Delete permanently"
                title="Delete permanently"
                className="hover:text-danger"
                onClick={onDeleteForever}
              >
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </>
          ) : (
            <>
              <TagPicker
                tags={allTags}
                selectedIds={note.tagIds}
                onToggle={onToggleTag}
                onCreate={onCreateTag}
                onRecolor={onRecolorTag}
              />
              <IconButton
                aria-label={note.pinned ? "Unpin note" : "Pin note"}
                title={note.pinned ? "Unpin" : "Pin"}
                active={note.pinned}
                onClick={onTogglePin}
              >
                {note.pinned ? (
                  <Pin className="h-4 w-4" fill="currentColor" />
                ) : (
                  <PinOff className="h-4 w-4" />
                )}
              </IconButton>
              <IconButton
                aria-label="Move to trash"
                title="Move to trash"
                className="hover:text-danger"
                onClick={onTrash}
              >
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </>
          )}
        </div>
      </header>

      <div className="shrink-0 border-b border-line">
        {editor ? <EditorToolbar editor={editor} /> : <div className="h-11" />}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-6 sm:px-10">
          <input
            value={title}
            readOnly={readOnly}
            autoFocus={!note.title && !note.plainText}
            onChange={(e) => handleTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                editor?.commands.focus("end");
              }
            }}
            placeholder="Untitled"
            className="w-full bg-transparent text-[1.7rem] font-bold leading-tight tracking-tight text-ink outline-none placeholder:text-faint/60"
          />

          <div className={cn("mt-4", readOnly && "opacity-70")}>
            <EditorContent editor={editor} />
          </div>

          <footer className="mt-12 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-4 text-xs text-faint">
            <span>
              {words} {words === 1 ? "word" : "words"}
            </span>
            <span aria-hidden="true">·</span>
            <span>Created {formatFullDate(note.createdAt)}</span>
            <span aria-hidden="true">·</span>
            <span>Edited {formatFullDate(note.updatedAt)}</span>
          </footer>
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ status, readOnly }: { status: SaveStatus; readOnly: boolean }) {
  if (readOnly) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
        <Trash2 className="h-3.5 w-3.5" />
        In trash
      </span>
    );
  }
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
        <Check className="h-3.5 w-3.5" />
        Saved
      </span>
    );
  }
  return null;
}
