import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ColorPicker } from "./ColorPicker";
import { SliderField } from "./SliderField";
import type { SettingsApi } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";

const CHANNEL_LABEL: Record<string, string> = {
  C: "Cyan plate",
  M: "Magenta plate",
  Y: "Yellow plate",
  K: "Key (black) plate",
};

export function InkPanel({ api }: { api: SettingsApi }) {
  const { settings, updateInk, addInk, removeInk, setMode, update } = api;
  const duotone = settings.mode === "duotone";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <span className="label-eyebrow">Separation</span>
        <ToggleGroup
          type="single"
          value={settings.mode}
          onValueChange={(v) => v && setMode(v as "cmyk" | "duotone")}
          className="w-full"
        >
          <ToggleGroupItem value="duotone">Spot inks</ToggleGroupItem>
          <ToggleGroupItem value="cmyk">CMYK</ToggleGroupItem>
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">
          {duotone
            ? "Each ink is anchored to a tonal range — highlights, mids and shadows."
            : "Four-colour process separation. Re-ink any plate by changing its colour."}
        </p>
      </div>

      <Accordion type="multiple" className="rounded-lg border border-border/70 px-3">
        {settings.inks.map((ink, i) => (
          <AccordionItem
            key={ink.id}
            value={ink.id}
            className={cn(i === settings.inks.length - 1 && "border-b-0")}
          >
            <div className="flex items-center gap-2 py-2">
              <div onClick={(e) => e.stopPropagation()}>
                <ColorPicker
                  color={ink.color}
                  onChange={(c) => updateInk(ink.id, { color: c })}
                  label={`${ink.name} colour`}
                />
              </div>
              <AccordionTrigger className="flex-1 py-1 normal-case tracking-normal">
                <span className="flex flex-col items-start">
                  <span className="font-sans text-sm font-medium text-foreground">
                    {duotone ? ink.name : CHANNEL_LABEL[ink.channel]}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {ink.angle}° screen
                  </span>
                </span>
              </AccordionTrigger>
              <button
                onClick={() => updateInk(ink.id, { enabled: !ink.enabled })}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label={ink.enabled ? "Hide ink" : "Show ink"}
              >
                {ink.enabled ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </button>
            </div>
            <AccordionContent className="space-y-4 pb-4">
              <SliderField
                label="Screen angle"
                value={ink.angle}
                min={0}
                max={90}
                unit="°"
                onChange={(v) => updateInk(ink.id, { angle: v })}
              />
              {duotone && (
                <>
                  <SliderField
                    label="Tonal position"
                    value={ink.level}
                    min={0}
                    max={1}
                    step={0.01}
                    format={(v) =>
                      v < 0.34 ? "Highlights" : v < 0.67 ? "Midtones" : "Shadows"
                    }
                    onChange={(v) => updateInk(ink.id, { level: v })}
                  />
                  <SliderField
                    label="Tonal spread"
                    value={ink.spread}
                    min={0.1}
                    max={1}
                    step={0.01}
                    format={(v) => `${Math.round(v * 100)}%`}
                    onChange={(v) => updateInk(ink.id, { spread: v })}
                  />
                </>
              )}
              <SliderField
                label="Ink density"
                value={ink.strength}
                min={0.2}
                max={1.5}
                step={0.01}
                format={(v) => `${Math.round(v * 100)}%`}
                onChange={(v) => updateInk(ink.id, { strength: v })}
              />
              {duotone && settings.inks.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeInk(ink.id)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" /> Remove ink
                </Button>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {duotone && settings.inks.length < 5 && (
        <Button variant="outline" size="sm" className="w-full" onClick={addInk}>
          <Plus className="h-4 w-4" /> Add spot ink
        </Button>
      )}

      <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
        <div>
          <p className="text-sm font-medium">Paper stock</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {settings.paper}
          </p>
        </div>
        <ColorPicker
          color={settings.paper}
          onChange={(c) => update({ paper: c })}
          label="Paper colour"
        />
      </div>
    </div>
  );
}
