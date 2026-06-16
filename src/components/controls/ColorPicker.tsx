import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
  swatchClassName?: string;
  label?: string;
}

export function ColorPicker({
  color,
  onChange,
  className,
  swatchClassName,
  label,
}: ColorPickerProps) {
  const sanitize = (v: string) => {
    let hex = v.startsWith("#") ? v : `#${v}`;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) onChange(hex.toLowerCase());
  };

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "group inline-flex items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        aria-label={label ?? "Pick colour"}
      >
        <span
          className={cn(
            "h-7 w-7 shrink-0 rounded-md border border-foreground/20 shadow-inner transition-transform group-hover:scale-105",
            swatchClassName,
          )}
          style={{ backgroundColor: color }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto" align="start">
        <div className="riso-picker space-y-3">
          <HexColorPicker color={color} onChange={(c) => onChange(c.toLowerCase())} />
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">HEX</span>
            <input
              value={color.toUpperCase()}
              onChange={(e) => sanitize(e.target.value)}
              spellCheck={false}
              className="tnum w-full rounded-md border border-input bg-background px-2 py-1 font-mono text-xs uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
