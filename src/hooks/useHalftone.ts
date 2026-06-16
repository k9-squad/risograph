import { useCallback, useEffect, useRef, useState } from "react";
import type { HalftoneSettings, PaperTexture, RasterImage } from "@/lib/halftone";
import paperTextureUrl from "@/assets/paper-texture.jpg";

// Higher caps than before so previews stay crisp on large displays and exports
// keep their detail. Rendering runs off the main thread in a worker.
const PREVIEW_MAX = 1500;
const FULL_MAX = 4000;
const TEXTURE_MAX = 1100;

interface SourceInfo {
  name: string;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = src;
  });
}

/** Draw a loaded image onto an offscreen canvas, capped to `max` longest side. */
function rasterize(img: HTMLImageElement, max: number): RasterImage {
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  return { data, width: w, height: h };
}

/**
 * Build a luminance-only delta map from the paper texture: (lum - mean),
 * roughly -1..1. Colour is discarded so the texture only modulates brightness.
 */
function buildTexture(img: HTMLImageElement): PaperTexture {
  const { data, width, height } = rasterize(img, TEXTURE_MAX);
  const n = width * height;
  const lum = new Float32Array(n);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    const l = (0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]) / 255;
    lum[i] = l;
    sum += l;
  }
  const mean = sum / n;
  for (let i = 0; i < n; i++) lum[i] -= mean;
  return { delta: lum, width, height };
}

export function useHalftone(settings: HalftoneSettings) {
  const workerRef = useRef<Worker | null>(null);
  const reqId = useRef(0);
  const exportWaiters = useRef<Map<number, (img: RasterImage) => void>>(new Map());
  const debounceTimer = useRef<number | null>(null);

  const [source, setSource] = useState<SourceInfo | null>(null);
  const [preview, setPreview] = useState<RasterImage | null>(null);
  const [rendering, setRendering] = useState(false);

  // boot the worker once
  useEffect(() => {
    const worker = new Worker(new URL("../lib/halftone.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type !== "result") return;
      if (msg.quality === "full") {
        const waiter = exportWaiters.current.get(msg.id);
        if (waiter) {
          waiter(msg.image);
          exportWaiters.current.delete(msg.id);
        }
        return;
      }
      // only accept the latest preview
      if (msg.id === reqId.current) {
        setPreview(msg.image);
        setRendering(false);
      }
    };
    workerRef.current = worker;

    // load the paper texture once and hand it to the worker
    loadImage(paperTextureUrl)
      .then((img) => {
        const texture = buildTexture(img);
        worker.postMessage({ type: "texture", texture }, [texture.delta.buffer]);
      })
      .catch(() => {
        /* texture is optional — ignore load failures */
      });

    return () => worker.terminate();
  }, []);

  const loadFile = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      const previewSrc = rasterize(img, PREVIEW_MAX);
      const fullSrc = rasterize(img, FULL_MAX);
      const worker = workerRef.current!;
      // structuredClone so the buffers we keep aren't detached by transfer
      worker.postMessage({ type: "source", quality: "preview", image: previewSrc });
      worker.postMessage({ type: "source", quality: "full", image: fullSrc });
      setSource({ name: file.name, width: img.width, height: img.height });
    } finally {
      URL.revokeObjectURL(url);
    }
  }, []);

  // re-render preview whenever settings change (debounced)
  useEffect(() => {
    if (!source) return;
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    setRendering(true);
    debounceTimer.current = window.setTimeout(() => {
      const id = ++reqId.current;
      workerRef.current?.postMessage({
        type: "render",
        id,
        quality: "preview",
        settings,
      });
    }, 90);
    return () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
  }, [settings, source]);

  /** Render at full resolution and return the pixels (off the main thread). */
  const renderFull = useCallback((): Promise<RasterImage> => {
    return new Promise((resolve) => {
      const id = ++reqId.current + 1_000_000;
      exportWaiters.current.set(id, resolve);
      workerRef.current?.postMessage({
        type: "render",
        id,
        quality: "full",
        settings,
      });
    });
  }, [settings]);

  return { source, preview, rendering, loadFile, renderFull };
}
