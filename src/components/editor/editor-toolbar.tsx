"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import {
  Bold,
  Braces,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Redo,
  Strikethrough,
  Underline,
  Undo,
} from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

interface EditorToolbarProps {
  editor: Editor;
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-line" aria-hidden="true" />;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      taskList: e.isActive("taskList"),
      blockquote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const promptLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  };

  const btn = (
    label: string,
    active: boolean,
    onClick: () => void,
    icon: React.ReactNode,
    disabled = false,
  ) => (
    <IconButton
      size="sm"
      active={active}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
    >
      {icon}
    </IconButton>
  );

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-thin px-2 py-1.5 sm:px-3">
      {btn("Bold", state.bold, () => editor.chain().focus().toggleBold().run(), <Bold className="h-4 w-4" />)}
      {btn("Italic", state.italic, () => editor.chain().focus().toggleItalic().run(), <Italic className="h-4 w-4" />)}
      {btn("Underline", state.underline, () => editor.chain().focus().toggleUnderline().run(), <Underline className="h-4 w-4" />)}
      {btn("Strikethrough", state.strike, () => editor.chain().focus().toggleStrike().run(), <Strikethrough className="h-4 w-4" />)}
      {btn("Inline code", state.code, () => editor.chain().focus().toggleCode().run(), <Code className="h-4 w-4" />)}

      <Divider />

      {btn("Heading 1", state.h1, () => editor.chain().focus().toggleHeading({ level: 1 }).run(), <Heading1 className="h-4 w-4" />)}
      {btn("Heading 2", state.h2, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 className="h-4 w-4" />)}
      {btn("Heading 3", state.h3, () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <Heading3 className="h-4 w-4" />)}

      <Divider />

      {btn("Bullet list", state.bulletList, () => editor.chain().focus().toggleBulletList().run(), <List className="h-4 w-4" />)}
      {btn("Numbered list", state.orderedList, () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered className="h-4 w-4" />)}
      {btn("Task list", state.taskList, () => editor.chain().focus().toggleTaskList().run(), <ListTodo className="h-4 w-4" />)}

      <Divider />

      {btn("Quote", state.blockquote, () => editor.chain().focus().toggleBlockquote().run(), <Quote className="h-4 w-4" />)}
      {btn("Code block", state.codeBlock, () => editor.chain().focus().toggleCodeBlock().run(), <Braces className="h-4 w-4" />)}
      {btn("Link", state.link, promptLink, <LinkIcon className="h-4 w-4" />)}
      {btn("Divider", false, () => editor.chain().focus().setHorizontalRule().run(), <Minus className="h-4 w-4" />)}

      <Divider />

      {btn("Undo", false, () => editor.chain().focus().undo().run(), <Undo className="h-4 w-4" />, !state.canUndo)}
      {btn("Redo", false, () => editor.chain().focus().redo().run(), <Redo className="h-4 w-4" />, !state.canRedo)}
    </div>
  );
}
