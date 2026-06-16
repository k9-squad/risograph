import type { HalftoneSettings, Ink } from "./halftone";

type InkSeed = Omit<Ink, "id">;

const mkInks = (seeds: InkSeed[]): Ink[] =>
  seeds.map((s, i) => ({ ...s, id: `ink-${i}` }));

export interface ColorPreset {
  id: string;
  name: string;
  tag: string;
  mode: HalftoneSettings["mode"];
  paper: string;
  inks: Ink[];
}

/** Curated ink palettes. Classic CMYK angles: C15° M75° Y0° K45°. */
export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: "orange-blue",
    name: "Daydream",
    tag: "Orange · Blue",
    mode: "duotone",
    paper: "#f3ead7",
    inks: mkInks([
      {
        name: "Fluoro Orange",
        color: "#ff5b29",
        angle: 15,
        enabled: true,
        channel: "M",
        level: 0.38,
        spread: 0.62,
        strength: 1.05,
      },
      {
        name: "Federal Blue",
        color: "#1b4d8f",
        angle: 75,
        enabled: true,
        channel: "C",
        level: 0.82,
        spread: 0.5,
        strength: 1.0,
      },
    ]),
  },
  {
    id: "cmyk",
    name: "Full Press",
    tag: "C · M · Y · K",
    mode: "cmyk",
    paper: "#f7f4ec",
    inks: mkInks([
      { name: "Cyan", color: "#00aeef", angle: 15, enabled: true, channel: "C", level: 0.7, spread: 0.5, strength: 1 },
      { name: "Magenta", color: "#ec008c", angle: 75, enabled: true, channel: "M", level: 0.5, spread: 0.5, strength: 1 },
      { name: "Yellow", color: "#fff200", angle: 0, enabled: true, channel: "Y", level: 0.3, spread: 0.5, strength: 1 },
      { name: "Key", color: "#1a1a1a", angle: 45, enabled: true, channel: "K", level: 0.9, spread: 0.5, strength: 1 },
    ]),
  },
  {
    id: "fluoro",
    name: "Rave",
    tag: "Pink · Teal",
    mode: "duotone",
    paper: "#fbf7ef",
    inks: mkInks([
      { name: "Fluoro Pink", color: "#ff48a4", angle: 18, enabled: true, channel: "M", level: 0.34, spread: 0.6, strength: 1.05 },
      { name: "Teal", color: "#00867d", angle: 72, enabled: true, channel: "C", level: 0.8, spread: 0.52, strength: 1 },
    ]),
  },
  {
    id: "noir",
    name: "Newsprint",
    tag: "Black · Red",
    mode: "duotone",
    paper: "#efe9da",
    inks: mkInks([
      { name: "Bright Red", color: "#e8443b", angle: 12, enabled: true, channel: "M", level: 0.45, spread: 0.55, strength: 1 },
      { name: "Black", color: "#181614", angle: 45, enabled: true, channel: "K", level: 0.85, spread: 0.55, strength: 1.05 },
    ]),
  },
  {
    id: "botanic",
    name: "Orchard",
    tag: "Green · Plum",
    mode: "duotone",
    paper: "#f1efe2",
    inks: mkInks([
      { name: "Leaf Green", color: "#3f7a4f", angle: 20, enabled: true, channel: "Y", level: 0.4, spread: 0.58, strength: 1 },
      { name: "Plum", color: "#6b2c5b", angle: 70, enabled: true, channel: "M", level: 0.82, spread: 0.5, strength: 1 },
    ]),
  },
  {
    id: "dusk",
    name: "Dusk",
    tag: "Violet · Gold",
    mode: "duotone",
    paper: "#1c1b22",
    inks: mkInks([
      { name: "Electric Violet", color: "#7b5cff", angle: 22, enabled: true, channel: "C", level: 0.78, spread: 0.55, strength: 1.1 },
      { name: "Gold", color: "#f2b53c", angle: 68, enabled: true, channel: "Y", level: 0.32, spread: 0.62, strength: 1.05 },
    ]),
  },
];

export interface ScreenPreset {
  id: string;
  name: string;
  cell: number;
  dotShape: HalftoneSettings["dotShape"];
  dotScale: number;
}

export const SCREEN_PRESETS: ScreenPreset[] = [
  { id: "fine", name: "Fine Dot", cell: 5, dotShape: "circle", dotScale: 1.0 },
  { id: "classic", name: "Classic", cell: 8, dotShape: "circle", dotScale: 1.05 },
  { id: "coarse", name: "Coarse", cell: 14, dotShape: "circle", dotScale: 1.05 },
  { id: "weave", name: "Crosshatch", cell: 7, dotShape: "line", dotScale: 1.1 },
  { id: "pixel", name: "Pixel", cell: 9, dotShape: "square", dotScale: 1.0 },
  { id: "gem", name: "Diamond", cell: 9, dotShape: "diamond", dotScale: 1.05 },
];

export const DEFAULT_PRESET =
  COLOR_PRESETS.find((p) => p.id === "cmyk") ?? COLOR_PRESETS[0];

export function defaultSettings(): HalftoneSettings {
  return {
    mode: DEFAULT_PRESET.mode,
    inks: DEFAULT_PRESET.inks.map((i) => ({ ...i })),
    paper: DEFAULT_PRESET.paper,
    // Fine Dot screen by default — a crisp classic CMYK rosette.
    cell: 5,
    dotShape: "circle",
    dotScale: 1.0,
    contrast: 16,
    brightness: 4,
    grain: 10,
    bleed: 6,
    texture: 70,
    invert: false,
  };
}
