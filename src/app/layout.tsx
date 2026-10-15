import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PaletteSync } from "@/components/palette-sync";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Notes",
  description:
    "A fast, private, offline-first note taking app with rich text, tags and dark mode.",
  applicationName: "Notes",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#090a0c" },
  ],
};

/**
 * Runs synchronously in <head> before first paint so the correct theme *and*
 * colour scheme are applied without a flash. Preferences are stored in
 * localStorage (theme also mirrored to a cookie).
 */
const themeScript = `(function(){try{
var m=document.cookie.match(/(?:^|; )theme=([^;]*)/);
var p=(m&&decodeURIComponent(m[1]))||localStorage.getItem("theme")||"system";
if(p!=="light"&&p!=="dark"&&p!=="system"){p="system"}
var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
var el=document.documentElement;
el.setAttribute("data-theme",d?"dark":"light");
el.dataset.themePref=p;
var names=["app","surface","elevated","line","ink","muted","faint","accent","accent-ink","accent-soft","danger","danger-soft"];
var raw=localStorage.getItem("scheme");
if(raw){var s=JSON.parse(raw);var t=d?s.dark:s.light;
if(t){for(var i=0;i<names.length;i++){var v=t[names[i]];if(typeof v==="string"){el.style.setProperty("--c-"+names[i],v);}}}}
}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-full">
        <PaletteSync />
        <div className="flex h-dvh flex-col overflow-hidden">{children}</div>
      </body>
    </html>
  );
}
