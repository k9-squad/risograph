import { Check } from "lucide-react";
import { COLOR_PRESETS } from "@/hooks/useSettings";
import type { ColorPreset } from "@/lib/presets";
import { cn } from "@/lib/utils";

interface PresetGalleryProps {
  activeInkColors: string[];
  onSelect: (preset: ColorPreset) => void;
}

function isActive(preset: ColorPreset, active: string[]) {
  const a = preset.inks.map((i) => i.color).join();
  return a === active.join();
}

export function PresetGallery({ activeInkColors, onSelect }: PresetGalleryProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {COLOR_PRESETS.map((preset) => {
        const active = isActive(preset, activeInkColors);
        return (
          <button
            key={preset.id}
            onClick={() => onSelect(preset)}
            className={cn(
              "group relative overflow-hidden rounded-lg border p-2.5 text-left transition-all",
              active
                ? "border-foreground ring-1 ring-foreground"
                : "border-border hover:border-foreground/50",
            )}
            style={{ backgroundColor: preset.paper }}
          >
            <div className="mb-2 flex items-center gap-1">
              {preset.inks.map((ink) => (
                <span
                  key={ink.id}
                  className="h-5 w-5 rounded-full border border-black/10 shadow-sm"
                  style={{ backgroundColor: ink.color }}
                />
              ))}
              {active && (
                <span className="ml-auto rounded-full bg-foreground p-0.5 text-background">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </div>
            <p
              className="font-display text-sm font-medium leading-tight"
              style={{ color: "#1a1714" }}
            >
              {preset.name}
            </p>
            <p
              className="font-mono text-[10px] uppercase tracking-wider"
              style={{ color: "#1a171499" }}
            >
              {preset.tag}
            </p>
          </button>
        );
      })}
    </div>
  );
}
