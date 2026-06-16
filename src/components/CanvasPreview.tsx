import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import type { RasterImage } from "@/lib/halftone";
import { cn, toImageData } from "@/lib/utils";

interface CanvasPreviewProps {
  image: RasterImage | null;
  rendering: boolean;
  paper: string;
}

export function CanvasPreview({ image, rendering, paper }: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.width !== image.width || canvas.height !== image.height) {
      canvas.width = image.width;
      canvas.height = image.height;
    }
    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(toImageData(image.data, image.width, image.height), 0, 0);
  }, [image]);

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        className="relative max-h-full max-w-full overflow-hidden rounded-lg shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)] ring-1 ring-foreground/10"
        style={{ backgroundColor: paper }}
      >
        <canvas
          ref={canvasRef}
          className="block max-h-[78vh] w-auto max-w-full object-contain"
          style={{ imageRendering: "auto" }}
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] transition-opacity duration-200",
            rendering ? "opacity-100" : "opacity-0",
          )}
        >
          <Loader2 className="h-6 w-6 animate-spin text-white drop-shadow" />
        </div>
      </div>
    </div>
  );
}
