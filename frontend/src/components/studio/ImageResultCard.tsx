import { useState } from "react";
import { Download, FolderPlus, Maximize2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared";
import { DemoChip } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { ImageMeta, Project } from "@/lib/types";

export function extFor(mime: string): string {
  if (mime === "image/svg+xml") return "svg";
  if (mime === "image/jpeg") return "jpg";
  return "png";
}

export function ImageResultCard({
  image,
  index,
  projects,
  onDelete,
  onToggleFavorite,
  onAssignProject,
  onCreateProject,
}: {
  image: ImageMeta;
  index: number;
  projects: Project[];
  onDelete: (id: string) => void;
  onToggleFavorite: (image: ImageMeta) => void;
  onAssignProject: (imageId: string, projectId: string) => void;
  onCreateProject: (name: string) => Promise<Project>;
}) {
  const [zoom, setZoom] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(image.project_id ?? "");
  const [newProject, setNewProject] = useState("");

  const fileUrl = `/api/images/${image.id}/file`;
  const downloadName = `${(image.product_name || "foto-produk").toLowerCase().replace(/\s+/g, "-")}-${index + 1}.${extFor(image.mime)}`;

  return (
    <div
      data-testid={`result-card-${image.id}`}
      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 ease-out hover:shadow-md"
    >
      <div className="relative">
        <img
          src={fileUrl}
          alt={image.product_name}
          className="aspect-square w-full cursor-zoom-in bg-secondary object-cover"
          onClick={() => setZoom(true)}
          data-testid={`result-image-${image.id}`}
        />
        <div className="absolute left-2 top-2">
          {image.is_mock ? <DemoChip isMock /> : <DemoChip isMock={false} />}
        </div>
        <button
          type="button"
          onClick={() => onToggleFavorite(image)}
          data-testid={`favorite-btn-${image.id}`}
          className={cn(
            "absolute right-2 top-2 flex size-8 items-center justify-center rounded-full border shadow-sm backdrop-blur transition-colors duration-200",
            image.favorite ? "border-[#C9A87C] bg-[#F3EBDD] text-[#7A4D14]" : "border-border bg-white/80 text-muted-foreground hover:text-[#9B8264]",
          )}
        >
          <Star className="size-4" fill={image.favorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="p-3">
        <p className="truncate text-sm font-medium text-foreground">{image.product_name || "Foto produk"}</p>
        <p className="truncate text-xs text-muted-foreground">{image.style}</p>
        <div className="mt-2.5 flex items-center gap-1.5">
          <Button size="icon-xs" variant="outline" onClick={() => setZoom(true)} data-testid={`zoom-btn-${image.id}`}>
            <Maximize2 className="size-3.5" />
          </Button>
          <a href={fileUrl} download={downloadName} data-testid={`download-btn-${image.id}`}>
            <Button size="icon-xs" variant="outline">
              <Download className="size-3.5" />
            </Button>
          </a>
          <Button size="icon-xs" variant="outline" onClick={() => setProjectOpen(true)} data-testid={`project-btn-${image.id}`}>
            <FolderPlus className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="ghost" onClick={() => setConfirmDel(true)} data-testid={`delete-btn-${image.id}`}>
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Fullscreen preview */}
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-3xl p-2 sm:p-3">
          <DialogHeader className="sr-only">
            <DialogTitle>Pratinjau {image.product_name}</DialogTitle>
          </DialogHeader>
          <img
            src={fileUrl}
            alt={image.product_name}
            className="max-h-[80vh] w-full rounded-xl bg-secondary object-contain"
            data-testid={`fullscreen-image-${image.id}`}
          />
          <div className="flex items-center justify-between gap-3 px-1 pb-1">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{image.product_name}</p>
              <p className="truncate text-xs text-muted-foreground">{image.style}</p>
            </div>
            <a href={fileUrl} download={downloadName}>
              <Button size="sm" variant="outline">
                <Download className="size-4" /> Unduh
              </Button>
            </a>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save to project */}
      <Dialog open={projectOpen} onOpenChange={setProjectOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Simpan ke Proyek</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={selectedProject} onValueChange={(value: string) => setSelectedProject(value)}>
              <SelectTrigger data-testid="assign-project-select">
                <SelectValue>{projects.find((p) => p.id === selectedProject)?.name ?? "Pilih proyek"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {projects.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    Belum ada proyek
                  </SelectItem>
                ) : (
                  projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                placeholder="atau buat proyek baru..."
                data-testid="new-project-input"
              />
            </div>
            <div className="flex justify-end gap-2">
              {image.project_id ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onAssignProject(image.id, "");
                    setProjectOpen(false);
                  }}
                  data-testid="detach-project-btn"
                >
                  Lepas dari proyek
                </Button>
              ) : null}
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    if (newProject.trim().length >= 2) {
                      const project = await onCreateProject(newProject.trim());
                      onAssignProject(image.id, project.id);
                    } else if (selectedProject && selectedProject !== "_none") {
                      onAssignProject(image.id, selectedProject);
                    } else {
                      toast.error("Pilih proyek atau tulis nama proyek baru.");
                      return;
                    }
                    toast.success("Tersimpan ke proyek");
                    setProjectOpen(false);
                    setNewProject("");
                  } catch {
                    toast.error("Gagal menyimpan ke proyek.");
                  }
                }}
                data-testid="assign-project-submit"
              >
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDel}
        onOpenChange={setConfirmDel}
        title="Hapus gambar ini?"
        description="Gambar akan dihapus permanen dari galeri."
        onConfirm={() => onDelete(image.id)}
        testId={`delete-image-${image.id}`}
      />
    </div>
  );
}
