import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { RasterImage } from "@/lib/halftone";
import { toImageData } from "@/lib/utils";

interface ExportDialogProps {
  renderFull: () => Promise<RasterImage>;
  baseName: string;
  trigger: React.ReactNode;
}

type Format = "png" | "jpeg";

export function ExportDialog({ renderFull, baseName, trigger }: ExportDialogProps) {
  const [format, setFormat] = useState<Format>("png");
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    try {
      const img = await renderFull();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.putImageData(toImageData(img.data, img.width, img.height), 0, 0);
      const mime = format === "png" ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, mime, 0.92),
      );
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const clean = baseName.replace(/\.[^.]+$/, "") || "risograph";
      a.href = url;
      a.download = `${clean}-riso.${format === "png" ? "png" : "jpg"}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export print</DialogTitle>
          <DialogDescription>
            Rendered at full resolution with your current screen settings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <span className="label-eyebrow">File format</span>
            <ToggleGroup
              type="single"
              value={format}
              onValueChange={(v) => v && setFormat(v as Format)}
              className="w-full"
            >
              <ToggleGroupItem value="png">PNG · lossless</ToggleGroupItem>
              <ToggleGroupItem value="jpeg">JPG · smaller</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={handleExport}
            disabled={busy}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Rendering…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> Download
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
