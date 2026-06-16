/// <reference lib="webworker" />
import {
  renderHalftone,
  type HalftoneSettings,
  type PaperTexture,
  type RasterImage,
} from "./halftone";

type InMessage =
  | { type: "source"; quality: "preview" | "full"; image: RasterImage }
  | { type: "texture"; texture: PaperTexture }
  | { type: "render"; id: number; quality: "preview" | "full"; settings: HalftoneSettings };

type OutMessage = {
  type: "result";
  id: number;
  quality: "preview" | "full";
  image: RasterImage;
};

const sources: Record<"preview" | "full", RasterImage | null> = {
  preview: null,
  full: null,
};
let texture: PaperTexture | null = null;

self.onmessage = (e: MessageEvent<InMessage>) => {
  const msg = e.data;
  if (msg.type === "source") {
    sources[msg.quality] = msg.image;
    return;
  }
  if (msg.type === "texture") {
    texture = msg.texture;
    return;
  }
  if (msg.type === "render") {
    const src = sources[msg.quality];
    if (!src) return;
    const result = renderHalftone(src, msg.settings, texture);
    const out: OutMessage = {
      type: "result",
      id: msg.id,
      quality: msg.quality,
      image: result,
    };
    (self as DedicatedWorkerGlobalScope).postMessage(out, [result.data.buffer]);
  }
};
