import { useCallback, useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onFile: (file: File) => void;
  className?: string;
  compact?: boolean;
}

export function Dropzone({ onFile, className, compact }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file && file.type.startsWith("image/")) onFile(file);
    },
    [onFile],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-foreground/25 bg-card/40 text-center transition-colors hover:border-primary hover:bg-card/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        over && "border-primary bg-card/80",
        compact ? "gap-2 p-6" : "gap-4 p-10",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-foreground/5 text-foreground/70 transition-transform group-hover:scale-105 group-hover:text-primary",
          compact ? "h-11 w-11" : "h-16 w-16",
        )}
      >
        <ImageUp className={compact ? "h-5 w-5" : "h-7 w-7"} />
      </div>
      <div className="space-y-1">
        <p className={cn("font-medium", compact ? "text-sm" : "text-base")}>
          {compact ? "Replace image" : "Drop a photo here"}
        </p>
        {!compact && (
          <p className="text-sm text-muted-foreground">
            or <span className="text-primary underline-offset-2">browse</span> — JPG,
            PNG, WebP
          </p>
        )}
      </div>
    </div>
  );
}
