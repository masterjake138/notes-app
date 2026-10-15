"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ColourScheme } from "@/components/appearance/colour-scheme";
import { TagsManager } from "@/components/appearance/tags-manager";
import { ConfirmDialog } from "@/components/confirm-dialog";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-thin bg-app">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-line bg-surface/90 px-3 backdrop-blur sm:px-5">
        <Link
          href="/"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted transition-colors hover:bg-elevated hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Notes
        </Link>
        <h1 className="text-base font-semibold tracking-tight text-ink">Settings</h1>
      </header>

      <main className="mx-auto w-full max-w-2xl space-y-5 px-3 py-5 sm:px-5 sm:py-7">
        <Section
          title="Appearance"
          description="Choose light, dark, or follow your system."
        >
          <ThemeToggle />
        </Section>

        <Section
          title="Colour scheme"
          description="Theme the interface with colour palettes from lospec.com."
        >
          <ColourScheme />
        </Section>

        <Section title="Tags" description="Rename, recolour, or remove tags.">
          <TagsManager />
        </Section>

        <p className="pb-2 text-center text-xs text-faint">
          Everything is stored locally in your browser.
        </p>
      </main>

      <ConfirmDialog />
    </div>
  );
}
