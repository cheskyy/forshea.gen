import { useEffect, useState } from "react";
import { AlertTriangle, Camera, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QUANTITIES } from "@/lib/studioMeta";
import { cn } from "@/lib/utils";
import type { Category, JobDetail, SceneSettings } from "@/lib/types";

const PROCESS_STEPS = [
  "Menganalisis sudut foto...",
  "Menyesuaikan pencahayaan...",
  "Merender tekstur produk...",
  "Menyusun komposisi akhir...",
];

function ProcessingPanel({ job }: { job: JobDetail }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => (s + 1) % PROCESS_STEPS.length), 1400);
    return () => clearInterval(timer);
  }, []);
  const pct = Math.min(100, Math.round(((job.progress + 0.4) / job.quantity) * 100));
  return (
    <div data-testid="processing-panel" className="rounded-xl border border-[#E8E3DC] bg-[#F8F5F0] p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Loader2 className="size-4 animate-spin text-[#9B8264]" />
        Sedang memproses... {job.progress}/{job.quantity} gambar
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E9E1D5]">
        <div className="h-full rounded-full bg-[#9B8264] transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{PROCESS_STEPS[step]}</p>
    </div>
  );
}

export function GenerationInspector({
  category,
  productName,
  style,
  scene,
  quantity,
  onQuantity,
  canGenerate,
  disabledReason,
  onGenerate,
  job,
  isGenerating,
}: {
  category: Category | null;
  productName: string;
  style: string;
  scene: SceneSettings;
  quantity: number;
  onQuantity: (q: number) => void;
  canGenerate: boolean;
  disabledReason: string | null;
  onGenerate: () => void;
  job: JobDetail | null;
  isGenerating: boolean;
}) {
  const rows: [string, string][] = [
    ["Kategori", category?.name ?? "-"],
    ["Produk", productName || "-"],
    ["Gaya foto", style || "-"],
    ["Latar", `${scene.background_color}${scene.background_type ? ` - ${scene.background_type}` : ""}`],
    ["Suasana", scene.mood || "-"],
    ["Rasio", scene.aspect_ratio],
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24" data-testid="generation-inspector">
      <div className="flex items-center gap-2">
        <Camera className="size-4 text-[#9B8264]" strokeWidth={1.8} />
        <h3 className="font-heading text-base font-semibold text-foreground">Ringkasan Generasi</h3>
      </div>

      <dl className="mt-4 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3 text-sm">
            <dt className="shrink-0 text-muted-foreground">{label}</dt>
            <dd className="truncate text-right font-medium text-foreground" title={value}>
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#9B8264]">Jumlah gambar</p>
      <div className="mt-2 grid grid-cols-4 gap-2" data-testid="quantity-selector">
        {QUANTITIES.map((q) => (
          <button
            key={q}
            type="button"
            disabled={isGenerating}
            onClick={() => onQuantity(q)}
            data-testid={`quantity-option-${q}`}
            className={cn(
              "rounded-xl border py-2 text-sm font-semibold transition-colors duration-200",
              q === quantity ? "border-[#9B8264] bg-[#9B8264] text-white" : "border-border bg-card text-foreground hover:bg-secondary",
              isGenerating ? "opacity-60" : "",
            )}
          >
            {q}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {isGenerating && job ? (
          <ProcessingPanel job={job} />
        ) : null}

        {job?.status === "error" ? (
          <div
            data-testid="generation-error"
            className="flex items-start gap-2 rounded-xl border border-[#E8CFC8] bg-[#FBF0ED] p-3 text-xs leading-relaxed text-[#8A3A28]"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>Generasi gagal: {job.error || "coba lagi sebentar."}</span>
          </div>
        ) : null}

        <Button
          className="mt-3 w-full"
          size="lg"
          disabled={!canGenerate}
          onClick={onGenerate}
          data-testid="generate-btn"
        >
          <Sparkles className="size-4" />
          {isGenerating ? "Sedang membuat..." : "Buat Foto Produk"}
        </Button>
        {!canGenerate && disabledReason ? (
          <p className="mt-2 text-center text-xs text-muted-foreground">{disabledReason}</p>
        ) : null}
        <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
          {job?.provider === "gemini"
            ? "AI Gemini aktif - foto asli kamu dipakai sebagai sumber kebenaran."
            : "Mode Demo - hasil diberi label DEMO, bukan gambar AI nyata."}
        </p>
      </div>
    </div>
  );
}
