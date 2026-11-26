import { ArrowLeftRight, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DemoChip } from "@/components/shared";
import { useState } from "react";
import { ImageResultCard } from "@/components/studio/ImageResultCard";
import type { ImageMeta, JobDetail, Project } from "@/lib/types";

function SettingsRow({ label, value, swatch }: { label: string; value: string; swatch?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-2 text-sm last:border-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-right font-medium text-foreground">
        {swatch ? <span className="size-3.5 rounded-full border border-[#D9CEBF]" style={{ backgroundColor: swatch }} /> : null}
        {value || "-"}
      </span>
    </div>
  );
}

export function ResultGallery({
  job,
  projects,
  onRegenerate,
  onDeleteImage,
  onToggleFavorite,
  onAssignProject,
  onCreateProject,
}: {
  job: JobDetail;
  projects: Project[];
  onRegenerate: () => void;
  onDeleteImage: (id: string) => void;
  onToggleFavorite: (image: ImageMeta) => void;
  onAssignProject: (imageId: string, projectId: string) => void;
  onCreateProject: (name: string) => Promise<Project>;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  return (
    <section data-testid="result-gallery" className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-lg font-semibold text-foreground">Hasil Generasi</h3>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {job.images.length} gambar
          </span>
          {job.images[0] ? <DemoChip isMock={job.images[0].is_mock} /> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)} data-testid="view-settings-btn">
            <Info className="size-4" /> Lihat Pengaturan
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCompareOpen(true)} data-testid="compare-btn">
            <ArrowLeftRight className="size-4" /> Bandingkan
          </Button>
          <Button size="sm" variant="outline" onClick={onRegenerate} data-testid="regenerate-btn">
            <RefreshCw className="size-4" /> Generate Ulang
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {job.images.map((image, i) => (
          <ImageResultCard
            key={image.id}
            image={image}
            index={i}
            projects={projects}
            onDelete={onDeleteImage}
            onToggleFavorite={onToggleFavorite}
            onAssignProject={onAssignProject}
            onCreateProject={onCreateProject}
          />
        ))}
      </div>

      <p className="mt-4 rounded-xl bg-[#F8F5F0] p-3 text-[11px] leading-relaxed text-muted-foreground">
        Catatan fidelity: AI menjaga warna, motif, tekstur, bentuk, proporsi, dan detail cetak produk sesuai foto asli.
        Jika ada detail yang tidak dapat dipertahankan dengan andal, AI tidak mengarangnya - periksa hasil sebelum
        dipakai di listing.
      </p>

      {/* Generation settings */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pengaturan Generasi</DialogTitle>
          </DialogHeader>
          <div>
            <SettingsRow label="Produk" value={job.product_name} />
            <SettingsRow label="Gaya foto" value={job.style} />
            <SettingsRow label="Warna latar" value={job.scene.background_color} swatch={job.scene.background_color} />
            <SettingsRow label="Jenis latar" value={job.scene.background_type} />
            <SettingsRow label="Pencahayaan" value={job.scene.lighting} />
            <SettingsRow label="Sudut kamera" value={job.scene.camera_angle} />
            <SettingsRow label="Komposisi" value={job.scene.composition} />
            <SettingsRow label="Props" value={job.scene.props} />
            <SettingsRow label="Suasana" value={job.scene.mood} />
            <SettingsRow label="Rasio" value={job.scene.aspect_ratio} />
            <SettingsRow label="Custom prompt" value={job.scene.custom_prompt} />
            <SettingsRow label="Jumlah" value={String(job.quantity)} />
            <SettingsRow label="Provider" value={job.provider === "gemini" ? "Gemini Image (nyata)" : "Demo/Mock"} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Original vs generated comparison */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bandingkan: Foto Asli vs Hasil</DialogTitle>
          </DialogHeader>
          <div className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#9B8264]">Foto Asli</p>
              {job.originals.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {job.originals.map((original) => (
                    <img
                      key={original.id}
                      src={`/api/uploads/${original.id}/file`}
                      alt={original.slot}
                      className="aspect-square w-full rounded-xl border border-border bg-secondary object-cover"
                      data-testid={`compare-original-${original.slot}`}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada foto asli pada produk ini.</p>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#9B8264]">Hasil</p>
              <div className="grid grid-cols-2 gap-2">
                {job.images.map((image) => (
                  <img
                    key={image.id}
                    src={`/api/images/${image.id}/file`}
                    alt={image.product_name}
                    className="aspect-square w-full rounded-xl border border-border bg-secondary object-cover"
                    data-testid={`compare-result-${image.id}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
