import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings · Notes",
};

export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return children;
}
