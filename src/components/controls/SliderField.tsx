import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
  className?: string;
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  format,
  onChange,
  className,
}: SliderFieldProps) {
  const display = format ? format(value) : `${Math.round(value)}${unit}`;
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="tnum font-mono text-xs text-muted-foreground">{display}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}
