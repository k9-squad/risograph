import { useCallback, useState } from "react";
import type { HalftoneSettings, Ink, SeparationMode } from "@/lib/halftone";
import { uid } from "@/lib/halftone";
import {
  COLOR_PRESETS,
  SCREEN_PRESETS,
  defaultSettings,
  type ColorPreset,
  type ScreenPreset,
} from "@/lib/presets";

const SPARE_COLORS = ["#2e8b8b", "#e8443b", "#f2b53c", "#6b2c5b", "#3f7a4f"];

export function useSettings() {
  const [settings, setSettings] = useState<HalftoneSettings>(defaultSettings);

  const update = useCallback((partial: Partial<HalftoneSettings>) => {
    setSettings((s) => ({ ...s, ...partial }));
  }, []);

  const updateInk = useCallback((id: string, partial: Partial<Ink>) => {
    setSettings((s) => ({
      ...s,
      inks: s.inks.map((ink) => (ink.id === id ? { ...ink, ...partial } : ink)),
    }));
  }, []);

  const addInk = useCallback(() => {
    setSettings((s) => {
      if (s.inks.length >= 5) return s;
      const used = s.inks.length;
      const ink: Ink = {
        id: uid("ink"),
        name: "Spot Ink",
        color: SPARE_COLORS[used % SPARE_COLORS.length],
        angle: (used * 30) % 90,
        enabled: true,
        channel: "K",
        level: 0.6,
        spread: 0.55,
        strength: 1,
      };
      return { ...s, inks: [...s.inks, ink] };
    });
  }, []);

  const removeInk = useCallback((id: string) => {
    setSettings((s) =>
      s.inks.length <= 1 ? s : { ...s, inks: s.inks.filter((i) => i.id !== id) },
    );
  }, []);

  const applyColorPreset = useCallback((preset: ColorPreset) => {
    setSettings((s) => ({
      ...s,
      mode: preset.mode,
      paper: preset.paper,
      inks: preset.inks.map((i) => ({ ...i, id: uid("ink") })),
    }));
  }, []);

  const applyScreenPreset = useCallback((preset: ScreenPreset) => {
    setSettings((s) => ({
      ...s,
      cell: preset.cell,
      dotShape: preset.dotShape,
      dotScale: preset.dotScale,
    }));
  }, []);

  const setMode = useCallback((mode: SeparationMode) => {
    setSettings((s) => {
      if (s.mode === mode) return s;
      const preset =
        mode === "cmyk"
          ? COLOR_PRESETS.find((p) => p.id === "cmyk")!
          : COLOR_PRESETS.find((p) => p.id === "orange-blue")!;
      return {
        ...s,
        mode,
        paper: preset.paper,
        inks: preset.inks.map((i) => ({ ...i, id: uid("ink") })),
      };
    });
  }, []);

  const reset = useCallback(() => setSettings(defaultSettings()), []);

  return {
    settings,
    update,
    updateInk,
    addInk,
    removeInk,
    applyColorPreset,
    applyScreenPreset,
    setMode,
    reset,
  };
}

export type SettingsApi = ReturnType<typeof useSettings>;
export { SCREEN_PRESETS, COLOR_PRESETS };
