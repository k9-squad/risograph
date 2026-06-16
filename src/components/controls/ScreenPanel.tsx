import { Circle, Minus, Square, Diamond } from "lucide-react";
import { SliderField } from "./SliderField";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { SCREEN_PRESETS } from "@/hooks/useSettings";
import type { SettingsApi } from "@/hooks/useSettings";
import type { DotShape } from "@/lib/halftone";
import { cn } from "@/lib/utils";

const SHAPES: { value: DotShape; icon: typeof Circle; label: string }[] = [
  { value: "circle", icon: Circle, label: "Dot" },
  { value: "line", icon: Minus, label: "Line" },
  { value: "square", icon: Square, label: "Square" },
  { value: "diamond", icon: Diamond, label: "Diamond" },
];

// Density slider runs opposite to cell size: bigger density => smaller cells.
const CELL_MIN = 3;
const CELL_MAX = 22;
const cellToDensity = (cell: number) =>
  Math.round(((CELL_MAX - cell) / (CELL_MAX - CELL_MIN)) * 100);
const densityToCell = (d: number) =>
  Math.round(CELL_MAX - (d / 100) * (CELL_MAX - CELL_MIN));

export function ScreenPanel({ api }: { api: SettingsApi }) {
  const { settings, update, applyScreenPreset } = api;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <span className="label-eyebrow">Screen preset</span>
        <div className="grid grid-cols-3 gap-1.5">
          {SCREEN_PRESETS.map((p) => {
            const active =
              p.cell === settings.cell &&
              p.dotShape === settings.dotShape &&
              p.dotScale === settings.dotScale;
            return (
              <button
                key={p.id}
                onClick={() => applyScreenPreset(p)}
                className={cn(
                  "rounded-md border px-2 py-2 text-xs font-medium transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground/50",
                )}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      <SliderField
        label="Dot density"
        value={cellToDensity(settings.cell)}
        min={0}
        max={100}
        unit="%"
        onChange={(v) => update({ cell: densityToCell(v) })}
      />

      <SliderField
        label="Dot size"
        value={settings.dotScale}
        min={0.5}
        max={1.6}
        step={0.01}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => update({ dotScale: v })}
      />

      <div className="space-y-2">
        <span className="label-eyebrow">Dot shape</span>
        <ToggleGroup
          type="single"
          value={settings.dotShape}
          onValueChange={(v) => v && update({ dotShape: v as DotShape })}
          className="w-full"
        >
          {SHAPES.map(({ value, icon: Icon, label }) => (
            <ToggleGroupItem key={value} value={value} aria-label={label}>
              <Icon className="h-3.5 w-3.5" />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}

export function AdjustPanel({ api }: { api: SettingsApi }) {
  const { settings, update } = api;
  return (
    <div className="space-y-5">
      <SliderField
        label="Contrast"
        value={settings.contrast}
        min={-80}
        max={100}
        onChange={(v) => update({ contrast: v })}
      />
      <SliderField
        label="Brightness"
        value={settings.brightness}
        min={-80}
        max={80}
        onChange={(v) => update({ brightness: v })}
      />
      <SliderField
        label="Paper grain"
        value={settings.grain}
        min={0}
        max={100}
        unit="%"
        onChange={(v) => update({ grain: v })}
      />
      <SliderField
        label="Mis-registration"
        value={settings.bleed}
        min={0}
        max={100}
        unit="%"
        onChange={(v) => update({ bleed: v })}
      />
      <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border/70 p-3">
        <div>
          <p className="text-sm font-medium">Invert tones</p>
          <p className="text-xs text-muted-foreground">Negative / photo-booth look</p>
        </div>
        <Switch
          checked={settings.invert}
          onCheckedChange={(v) => update({ invert: v })}
        />
      </label>
    </div>
  );
}
