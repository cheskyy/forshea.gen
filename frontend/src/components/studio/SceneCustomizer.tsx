import { useState } from "react";
import { ChevronDown, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ASPECT_RATIOS, OPTION_SETS, SCENE_PRESETS } from "@/lib/studioMeta";
import { cn } from "@/lib/utils";
import type { SceneSettings } from "@/lib/types";

function SceneSelect({
  label,
  field,
  scene,
  onChange,
}: {
  label: string;
  field: keyof SceneSettings;
  scene: SceneSettings;
  onChange: (patch: Partial<SceneSettings>) => void;
}) {
  const options = OPTION_SETS[field as string] ?? [];
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-foreground">{label}</Label>
      <Select value={String(scene[field] ?? "")} onValueChange={(value: string) => onChange({ [field]: value } as Partial<SceneSettings>)}>
        <SelectTrigger data-testid={`scene-${field}-select`}>
          <SelectValue>{String(scene[field] || "Pilih...")}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function SceneCustomizer({
  scene,
  onChange,
}: {
  scene: SceneSettings;
  onChange: (patch: Partial<SceneSettings>) => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#9B8264]">Preset latar & suasana</p>
        <div className="flex flex-wrap gap-2" data-testid="scene-presets">
          {SCENE_PRESETS.map((preset) => {
            const active = scene.preset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange({ ...preset.values, preset: preset.id })}
                data-testid={`scene-preset-${preset.id}`}
                className={cn(
                  "flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5",
                  active ? "border-[#9B8264] ring-2 ring-[#9B8264]/30" : "border-border text-foreground",
                )}
              >
                <span className="size-3.5 rounded-full border border-[#D9CEBF]" style={{ backgroundColor: preset.swatch }} />
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-foreground">Warna latar</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={scene.background_color}
              onChange={(e) => onChange({ background_color: e.target.value, preset: "" })}
              data-testid="scene-bg-color-input"
              className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-card p-1"
            />
            <Input
              value={scene.background_color}
              onChange={(e) => onChange({ background_color: e.target.value, preset: "" })}
              className="font-mono text-xs"
              data-testid="scene-bg-color-text"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-foreground">Rasio gambar</Label>
          <Select value={scene.aspect_ratio} onValueChange={(value: string) => onChange({ aspect_ratio: value })}>
            <SelectTrigger data-testid="scene-aspect-select">
              <SelectValue>{ASPECT_RATIOS.find((a) => a.value === scene.aspect_ratio)?.label ?? scene.aspect_ratio}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ASPECT_RATIOS.map((ratio) => (
                <SelectItem key={ratio.value} value={ratio.value}>
                  {ratio.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <SceneSelect label="Jenis latar" field="background_type" scene={scene} onChange={onChange} />
        <SceneSelect label="Pencahayaan" field="lighting" scene={scene} onChange={onChange} />
        <SceneSelect label="Sudut kamera" field="camera_angle" scene={scene} onChange={onChange} />
        <SceneSelect label="Komposisi" field="composition" scene={scene} onChange={onChange} />

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-foreground">Props</Label>
          <Input
            value={scene.props}
            onChange={(e) => onChange({ props: e.target.value })}
            placeholder="cth. Meja kayu, kain linen"
            data-testid="scene-props-input"
          />
        </div>

        <SceneSelect label="Suasana (mood)" field="mood" scene={scene} onChange={onChange} />
      </div>

      <div>
        <Button variant="ghost" size="sm" onClick={() => setShowAdvanced((v) => !v)} data-testid="scene-advanced-toggle">
          <Wand2 className="size-4 text-[#9B8264]" /> Pengaturan lanjutan
          <ChevronDown className={cn("size-4 transition-transform duration-200", showAdvanced && "rotate-180")} />
        </Button>
        {showAdvanced ? (
          <div className="mt-2 flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-foreground">Custom prompt (bahasa bebas)</Label>
            <Textarea
              value={scene.custom_prompt}
              onChange={(e) => onChange({ custom_prompt: e.target.value })}
              placeholder="cth. tambahkan bayangan lembut di sisi kanan, nuansa katalog premium..."
              rows={3}
              data-testid="scene-custom-prompt-input"
            />
            <p className="text-[11px] text-muted-foreground">
              Prompt tambahan digabung ke pengaturan di atas. Aturan fidelity produk tetap diprioritaskan.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
