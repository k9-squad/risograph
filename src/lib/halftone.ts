import { hexToRgb } from "./utils";

/**
 * The risograph halftone engine.
 *
 * An image is separated into a set of "inks". Each ink draws an amplitude
 * modulated halftone screen (variable dot size, fixed grid) at its own angle,
 * and the screens are composited with a multiply blend over the paper colour —
 * mimicking how overlapping risograph / CMYK plates overprint.
 *
 * Two separation modes are supported:
 *  - "cmyk": classic four-colour separation. Each ink pulls from one of the
 *    C / M / Y / K channels, but its printed colour is fully editable so the
 *    plates can be re-inked (e.g. fluoro pink instead of magenta).
 *  - "duotone": N spot inks, each anchored to a tonal "level". A tent-shaped
 *    response spreads each ink around its level so highlights, mids and shadows
 *    are carried by different inks — the classic 2/3-colour riso look.
 */

export type SeparationMode = "cmyk" | "duotone";
export type DotShape = "circle" | "square" | "line" | "diamond";
export type ChannelSource = "C" | "M" | "Y" | "K";

export interface Ink {
  id: string;
  name: string;
  color: string; // #rrggbb — the printed ink colour
  angle: number; // screen angle in degrees
  enabled: boolean;
  channel: ChannelSource; // used in cmyk mode
  level: number; // 0 (highlight) .. 1 (shadow) — used in duotone mode
  spread: number; // 0..1 tonal width of the ink's response — duotone mode
  strength: number; // 0..1.5 ink density multiplier
}

export interface HalftoneSettings {
  mode: SeparationMode;
  inks: Ink[];
  cell: number; // halftone cell size in px (smaller = denser screen)
  dotShape: DotShape;
  dotScale: number; // 0.5..1.6 — relative max dot size within a cell
  contrast: number; // -100..100
  brightness: number; // -100..100
  paper: string; // #rrggbb paper colour
  grain: number; // 0..100 paper grain amount
  bleed: number; // 0..100 mis-registration / ink bleed jitter
  invert: boolean;
}

export interface RasterImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

let _uid = 0;
export const uid = (prefix = "id") => `${prefix}-${Date.now().toString(36)}-${_uid++}`;

/** Apply brightness/contrast and return a luminance-adjusted RGB triplet. */
function adjust(
  r: number,
  g: number,
  b: number,
  bright: number,
  contrastFactor: number,
): [number, number, number] {
  // brightness: simple additive shift
  r += bright;
  g += bright;
  b += bright;
  // contrast around mid grey
  r = (r - 128) * contrastFactor + 128;
  g = (g - 128) * contrastFactor + 128;
  b = (b - 128) * contrastFactor + 128;
  return [r, g, b];
}

/**
 * Build a per-ink amplitude map (0..255) describing how much ink lands at each
 * source pixel, before screening. Returns one Uint8Array per ink.
 */
function buildSeparation(src: RasterImage, settings: HalftoneSettings): Uint8Array[] {
  const { width: w, height: h, data } = src;
  const n = w * h;
  const inks = settings.inks;
  const maps = inks.map(() => new Uint8Array(n));

  const contrastFactor =
    (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));
  const bright = settings.brightness * 1.6;

  for (let i = 0; i < n; i++) {
    const p = i * 4;
    let [r, g, b] = adjust(
      data[p],
      data[p + 1],
      data[p + 2],
      bright,
      contrastFactor,
    );
    if (settings.invert) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }
    r = r < 0 ? 0 : r > 255 ? 255 : r;
    g = g < 0 ? 0 : g > 255 ? 255 : g;
    b = b < 0 ? 0 : b > 255 ? 255 : b;

    if (settings.mode === "cmyk") {
      const rn = r / 255,
        gn = g / 255,
        bn = b / 255;
      const k = 1 - Math.max(rn, gn, bn);
      const inv = k < 1 ? 1 / (1 - k) : 0;
      const c = (1 - rn - k) * inv;
      const m = (1 - gn - k) * inv;
      const y = (1 - bn - k) * inv;
      for (let j = 0; j < inks.length; j++) {
        const ink = inks[j];
        const v =
          ink.channel === "C"
            ? c
            : ink.channel === "M"
              ? m
              : ink.channel === "Y"
                ? y
                : k;
        maps[j][i] = Math.min(255, v * ink.strength * 255);
      }
    } else {
      // duotone: anchor each ink to a tonal level using a tent response.
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const darkness = 1 - lum;
      for (let j = 0; j < inks.length; j++) {
        const ink = inks[j];
        const spread = Math.max(0.04, ink.spread);
        const t = 1 - Math.abs(darkness - ink.level) / spread;
        const v = t > 0 ? t : 0;
        maps[j][i] = Math.min(255, v * ink.strength * 255);
      }
    }
  }
  return maps;
}

/**
 * Render the screened, composited result. Pure function — used both for the
 * live preview (worker, smaller source) and full-resolution export.
 */
export function renderHalftone(
  src: RasterImage,
  settings: HalftoneSettings,
): RasterImage {
  const { width: w, height: h } = src;
  const out = new Uint8ClampedArray(w * h * 4);

  const [pr, pg, pb] = hexToRgb(settings.paper);
  // initialise with paper colour
  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    out[p] = pr;
    out[p + 1] = pg;
    out[p + 2] = pb;
    out[p + 3] = 255;
  }

  const inks = settings.inks.filter((ink) => ink.enabled);
  if (inks.length === 0) return { data: out, width: w, height: h };

  const allMaps = buildSeparation(src, settings);
  const enabledIndex = settings.inks
    .map((ink, idx) => ({ ink, idx }))
    .filter(({ ink }) => ink.enabled);

  const cell = Math.max(2, settings.cell);
  const grain = settings.grain / 100;
  const bleed = (settings.bleed / 100) * cell * 0.5;
  const shape = settings.dotShape;
  // max dot radius at full ink. At dotScale 1 a circle just fills the cell
  // (~79% coverage, leaving paper between dots); higher values overlap into
  // solids for deep shadows.
  const rMax = cell * 0.5 * settings.dotScale;

  for (const { ink, idx } of enabledIndex) {
    const map = allMaps[idx];
    const [ir, ig, ib] = hexToRgb(ink.color);
    const irn = ir / 255,
      ign = ig / 255,
      ibn = ib / 255;
    const a = (ink.angle * Math.PI) / 180;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    // deterministic per-ink registration offset for the riso "off" feel
    const ox = bleed > 0 ? (((idx * 53) % 7) / 7 - 0.5) * bleed : 0;
    const oy = bleed > 0 ? (((idx * 31) % 5) / 5 - 0.5) * bleed : 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = x + ox;
        const py = y + oy;
        // rotate into screen space
        const u = px * cos + py * sin;
        const v = -px * sin + py * cos;
        const cu = Math.round(u / cell);
        const cv = Math.round(v / cell);
        const ccx = cu * cell;
        const ccy = cv * cell;
        // cell centre back into image space, to sample ink amount
        let sx = Math.round(ccx * cos - ccy * sin);
        let sy = Math.round(ccx * sin + ccy * cos);
        sx = sx < 0 ? 0 : sx >= w ? w - 1 : sx;
        sy = sy < 0 ? 0 : sy >= h ? h - 1 : sy;
        const amt = map[sy * w + sx] / 255;
        if (amt <= 0) continue;

        const radius = rMax * Math.sqrt(amt);
        const du = u - ccx;
        const dv = v - ccy;

        let covered = false;
        switch (shape) {
          case "square": {
            const r2 = radius * 0.886; // match area to circle
            covered = Math.abs(du) <= r2 && Math.abs(dv) <= r2;
            break;
          }
          case "diamond": {
            const r2 = radius * 1.12;
            covered = Math.abs(du) + Math.abs(dv) <= r2;
            break;
          }
          case "line": {
            // line screen: coverage by distance to the cell's centre line
            covered = Math.abs(dv) <= radius;
            break;
          }
          default: {
            covered = du * du + dv * dv <= radius * radius;
          }
        }
        if (!covered) continue;

        // multiply blend the ink colour onto the accumulator
        const o = (y * w + x) * 4;
        out[o] = out[o] * irn;
        out[o + 1] = out[o + 1] * ign;
        out[o + 2] = out[o + 2] * ibn;
      }
    }
  }

  // paper grain — subtle multiplicative noise
  if (grain > 0) {
    for (let i = 0; i < w * h; i++) {
      const o = i * 4;
      const noise = 1 - Math.random() * grain * 0.18;
      out[o] *= noise;
      out[o + 1] *= noise;
      out[o + 2] *= noise;
    }
  }

  return { data: out, width: w, height: h };
}
