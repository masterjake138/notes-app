/**
 * A small set of classic pixel-art palettes, bundled so the theming feature is
 * useful immediately and works offline. These are public palettes from
 * lospec.com; the original author is credited where known. `slug` matches the
 * Lospec palette URL so users can find the source.
 */

import type { PaletteSource } from "./palette";

export const BUILTIN_PALETTES: PaletteSource[] = [
  {
    name: "PICO-8",
    author: "Lexaloffle",
    slug: "pico-8",
    colors: [
      "#000000", "#1d2b53", "#7e2553", "#008751", "#ab5236", "#5f574f", "#c2c3c7", "#fff1e8",
      "#ff004d", "#ffa300", "#ffec27", "#00e436", "#29adff", "#83769c", "#ff77a8", "#ffccaa",
    ],
  },
  {
    name: "Sweetie 16",
    author: "GrafxKid",
    slug: "sweetie-16",
    colors: [
      "#1a1c2c", "#5d275d", "#b13e53", "#ef7d57", "#ffcd75", "#a7f070", "#38b764", "#257179",
      "#29366f", "#3b5dc9", "#41a6f6", "#73eff7", "#f4f4f4", "#94b0c2", "#566c86", "#333c57",
    ],
  },
  {
    name: "Endesga 32",
    author: "Endesga",
    slug: "endesga-32",
    colors: [
      "#be4a2f", "#d77643", "#ead4aa", "#e4a672", "#b86f50", "#733e39", "#3e2731", "#a22633",
      "#e43b44", "#f77622", "#feae34", "#fee761", "#63c74d", "#3e8948", "#265c42", "#193c3e",
      "#124e89", "#0099db", "#2ce8f5", "#ffffff", "#c0cbdc", "#8b9bb4", "#5a6988", "#3a4466",
      "#262b44", "#181425", "#ff0044", "#68386c", "#b55088", "#f6757a", "#e8b796", "#c28569",
    ],
  },
  {
    name: "Vinik 24",
    author: "Vinik",
    slug: "vinik24",
    colors: [
      "#000000", "#6f6776", "#9a9a97", "#c5ccb8", "#8b5580", "#c38890", "#a593a5", "#666092",
      "#9a4f50", "#c28d75", "#7ca1c0", "#416aa3", "#8d6268", "#be955c", "#68aca9", "#387080",
      "#6e6962", "#93a167", "#6eaa78", "#557064", "#9d9f7f", "#7e9e99", "#5d6872", "#433455",
    ],
  },
  {
    name: "Commodore 64",
    author: "Commodore",
    slug: "commodore64",
    colors: [
      "#000000", "#ffffff", "#880000", "#aaffee", "#cc44cc", "#00cc55", "#0000aa", "#eeee77",
      "#dd8855", "#664400", "#ff7777", "#333333", "#777777", "#aaff66", "#0088ff", "#bbbbbb",
    ],
  },
  {
    name: "ZX Spectrum",
    author: "Sinclair Research",
    slug: "zx-spectrum",
    colors: [
      "#000000", "#0000d7", "#d70000", "#d700d7", "#00d700", "#00d7d7", "#d7d700", "#d7d7d7",
      "#0000ff", "#ff0000", "#ff00ff", "#00ff00", "#00ffff", "#ffff00", "#ffffff",
    ],
  },
  {
    name: "Game Boy",
    author: "Nintendo",
    slug: "gameboy",
    colors: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
  },
  {
    name: "Ice Cream GB",
    author: "Kerrie Lake",
    slug: "ice-cream-gb",
    colors: ["#7c3f58", "#eb6b6f", "#f9a875", "#fff6d3"],
  },
  {
    name: "SLSO8",
    author: "Adigun A. Polack",
    slug: "slso8",
    colors: ["#0d2b45", "#203c56", "#544e68", "#8d697a", "#d08159", "#ffaa5e", "#ffd4a3", "#ffecd6"],
  },
  {
    name: "Ammo-8",
    author: "r1",
    slug: "ammo-8",
    colors: ["#04080f", "#507dbc", "#a1c6ea", "#bbd1ea", "#dae3e5"],
  },
  {
    name: "1bit Monitor Glow",
    author: "Adigun A. Polack",
    slug: "1bit-monitor-glow",
    colors: ["#222323", "#f0f6f0"],
  },
];
