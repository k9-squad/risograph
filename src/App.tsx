import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Layers,
  Moon,
  Palette,
  RotateCcw,
  Settings2,
  Sparkles,
  Sun,
  Grid2x2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dropzone } from "@/components/Dropzone";
import { CanvasPreview } from "@/components/CanvasPreview";
import { ExportDialog } from "@/components/ExportDialog";
import { Section } from "@/components/controls/Section";
import { PresetGallery } from "@/components/controls/PresetGallery";
import { InkPanel } from "@/components/controls/InkPanel";
import { AdjustPanel, ScreenPanel } from "@/components/controls/ScreenPanel";
import { useSettings } from "@/hooks/useSettings";
import { useHalftone } from "@/hooks/useHalftone";
import { useMediaQuery } from "@/hooks/useMediaQuery";

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}

export default function App() {
  const api = useSettings();
  const { settings } = api;
  const { source, preview, rendering, loadFile, renderFull } = useHalftone(settings);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { dark, toggle } = useTheme();
  const [mobileSheet, setMobileSheet] = useState<string | null>(null);

  const inkColors = useMemo(() => settings.inks.map((i) => i.color), [settings.inks]);

  const sections = useMemo(
    () => [
      {
        id: "palette",
        title: "Palette",
        icon: Palette,
        content: (
          <PresetGallery activeInkColors={inkColors} onSelect={api.applyColorPreset} />
        ),
      },
      { id: "inks", title: "Inks", icon: Layers, content: <InkPanel api={api} /> },
      {
        id: "screen",
        title: "Screen",
        icon: Grid2x2,
        content: <ScreenPanel api={api} />,
      },
      {
        id: "finish",
        title: "Finish",
        icon: Settings2,
        content: <AdjustPanel api={api} />,
      },
    ],
    [api, inkColors],
  );

  const exportTrigger = (
    <Button size={isDesktop ? "default" : "sm"} disabled={!source}>
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Export</span>
    </Button>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full flex-col overflow-hidden">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="z-30 flex items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span className="absolute left-0 h-6 w-6 rounded-full bg-primary mix-blend-multiply" />
              <span className="absolute right-0 h-6 w-6 rounded-full bg-[#1b4d8f] mix-blend-multiply" />
            </span>
            <div className="leading-none">
              <h1 className="font-display text-xl font-medium tracking-tight">
                Risograph
              </h1>
              <p className="hidden font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground sm:block">
                Halftone Print Studio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={toggle}>
                  {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle theme</TooltipContent>
            </Tooltip>
            {source && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={api.reset}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset settings</TooltipContent>
              </Tooltip>
            )}
            <ExportDialog
              renderFull={renderFull}
              baseName={source?.name ?? "risograph"}
              trigger={exportTrigger}
            />
          </div>
        </header>

        {/* ── Body ───────────────────────────────────────────── */}
        {!source ? (
          <Hero onFile={loadFile} />
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Desktop control sidebar */}
            {isDesktop && (
              <aside className="w-[340px] shrink-0 border-r border-border bg-card/40">
                <ScrollArea className="h-full">
                  <div className="space-y-7 p-6">
                    <Dropzone onFile={loadFile} compact />
                    {sections.map((s) => (
                      <Section key={s.id} title={s.title}>
                        {s.content}
                      </Section>
                    ))}
                  </div>
                </ScrollArea>
              </aside>
            )}

            {/* Preview stage */}
            <main className="relative flex flex-1 flex-col overflow-hidden bg-muted/40">
              <div className="flex-1 overflow-hidden p-4 sm:p-8">
                <CanvasPreview
                  image={preview}
                  rendering={rendering}
                  paper={settings.paper}
                />
              </div>

              {/* Mobile toolbar */}
              {!isDesktop && (
                <nav className="flex items-center justify-around border-t border-border bg-background/90 px-2 py-2 backdrop-blur-md">
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setMobileSheet(s.id)}
                      className="flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <s.icon className="h-5 w-5" />
                      <span className="text-[10px] font-medium">{s.title}</span>
                    </button>
                  ))}
                </nav>
              )}
            </main>

            {/* Desktop info rail */}
            {isDesktop && (
              <InfoRail
                fileName={source.name}
                dims={`${source.width} × ${source.height}`}
                api={api}
              />
            )}
          </div>
        )}
      </div>

      {/* Mobile sheets */}
      {!isDesktop && (
        <Sheet open={!!mobileSheet} onOpenChange={(o) => !o && setMobileSheet(null)}>
          <SheetContent side="bottom" className="px-5 pb-8 pt-5">
            {(() => {
              const s = sections.find((x) => x.id === mobileSheet);
              if (!s) return null;
              return (
                <>
                  <SheetHeader className="mb-4">
                    <SheetTitle className="flex items-center gap-2">
                      <s.icon className="h-5 w-5" /> {s.title}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="max-h-[64vh] overflow-y-auto scrollbar-none">
                    {s.content}
                  </div>
                </>
              );
            })()}
          </SheetContent>
        </Sheet>
      )}
    </TooltipProvider>
  );
}

/* ── Empty state ──────────────────────────────────────────── */
function Hero({ onFile }: { onFile: (f: File) => void }) {
  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto px-5 py-10">
      <div className="w-full max-w-xl animate-fade-in text-center">
        <p className="label-eyebrow mb-4 flex items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5" /> Four-colour risograph filter
        </p>
        <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
          Print your photos
          <br />
          <span className="italic text-primary">in halftone.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-md text-balance text-muted-foreground">
          Upload an image and turn it into a screen-printed risograph poster —
          adjustable inks, screen angles and dot density, exported in a click.
        </p>
        <div className="mt-8">
          <Dropzone onFile={onFile} />
        </div>
      </div>
    </div>
  );
}

/* ── Desktop info rail ────────────────────────────────────── */
function InfoRail({
  fileName,
  dims,
  api,
}: {
  fileName: string;
  dims: string;
  api: ReturnType<typeof useSettings>;
}) {
  const { settings } = api;
  const enabled = settings.inks.filter((i) => i.enabled);
  return (
    <aside className="hidden w-[280px] shrink-0 border-l border-border bg-card/40 xl:block">
      <ScrollArea className="h-full">
        <div className="space-y-7 p-6">
          <div>
            <span className="label-eyebrow">Source</span>
            <p className="mt-1 truncate text-sm font-medium" title={fileName}>
              {fileName}
            </p>
            <p className="tnum font-mono text-xs text-muted-foreground">{dims} px</p>
          </div>

          <div>
            <span className="label-eyebrow">Plates · {enabled.length}</span>
            <ul className="mt-3 space-y-3">
              {enabled.map((ink) => (
                <li key={ink.id} className="flex items-center gap-3">
                  <span
                    className="h-8 w-8 shrink-0 rounded-md border border-foreground/15"
                    style={{ backgroundColor: ink.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{ink.name}</p>
                    <p className="tnum font-mono text-[10px] uppercase text-muted-foreground">
                      {ink.color} · {ink.angle}°
                    </p>
                  </div>
                  <AngleGlyph angle={ink.angle} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="label-eyebrow">Screen</span>
            <dl className="mt-2 space-y-1.5 text-sm">
              <Row k="Mode" v={settings.mode === "cmyk" ? "CMYK process" : "Spot inks"} />
              <Row k="Dot shape" v={cap(settings.dotShape)} />
              <Row k="Cell size" v={`${settings.cell}px`} />
              <Row k="Grain" v={`${settings.grain}%`} />
            </dl>
          </div>

          <p className="text-balance border-t border-border pt-4 font-mono text-[10px] leading-relaxed text-muted-foreground">
            Tip — overlap two screen angles for the woven crosshatch look of a real
            riso duplicator.
          </p>
        </div>
      </ScrollArea>
    </aside>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

function AngleGlyph({ angle }: { angle: number }) {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border">
      <span
        className="h-4 w-px bg-foreground"
        style={{ transform: `rotate(${angle}deg)` }}
      />
    </span>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
