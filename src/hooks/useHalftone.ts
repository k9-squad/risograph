import { useCallback, useEffect, useRef, useState } from "react";
import type { HalftoneSettings, RasterImage } from "@/lib/halftone";

const PREVIEW_MAX = 900;
const FULL_MAX = 2400;

interface SourceInfo {
  name: string;
  width: number;
  height: number;
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
    return () => worker.terminate();
  }, []);

  const loadFile = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = url;
      });
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
