import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FolderPlus, Images, Plus, Trash2, Upload, History, Star, FolderOpen } from "lucide-react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog, EmptyState, PageHeader } from "@/components/shared";
import { ImageResultCard } from "@/components/studio/ImageResultCard";
import { timeAgo } from "@/lib/format";
import type { Activity, ImageMeta, Project, UploadMeta } from "@/lib/types";

export default function Workspace() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDetail, setProjectDetail] = useState<Project | null>(null);
  const [deleteImageTarget, setDeleteImageTarget] = useState<ImageMeta | null>(null);
  const [deleteUploadTarget, setDeleteUploadTarget] = useState<UploadMeta | null>(null);
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<Project | null>(null);

  const { data: images = [] } = useQuery({ queryKey: ["images"], queryFn: () => apiGet<ImageMeta[]>("/images") });
  const { data: favorites = [] } = useQuery({ queryKey: ["images-fav"], queryFn: () => apiGet<ImageMeta[]>("/images?favorite=true") });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => apiGet<Project[]>("/projects") });
  const { data: uploads = [] } = useQuery({ queryKey: ["uploads"], queryFn: () => apiGet<UploadMeta[]>("/uploads") });
  const { data: activities = [] } = useQuery({ queryKey: ["activities-ws"], queryFn: () => apiGet<Activity[]>("/activities") });

  const invalidateImages = () => {
    qc.invalidateQueries({ queryKey: ["images"] });
    qc.invalidateQueries({ queryKey: ["images-fav"] });
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const deleteImage = useMutation({
    mutationFn: (id: string) => apiDelete(`/images/${id}`),
    onSuccess: () => {
      toast.success("Gambar dihapus.");
      invalidateImages();
    },
    onError: () => toast.error("Gagal menghapus gambar."),
  });

  const patchImage = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { favorite?: boolean; project_id?: string } }) =>
      apiPatch<ImageMeta>(`/images/${id}`, body),
    onSuccess: invalidateImages,
    onError: () => toast.error("Gagal memperbarui gambar."),
  });

  const createProject = useMutation({
    mutationFn: (name: string) => apiPost<Project>("/projects", { name }),
    onSuccess: () => {
      toast.success("Proyek dibuat.");
      setCreateOpen(false);
      setProjectName("");
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: () => toast.error("Gagal membuat proyek."),
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => apiDelete(`/projects/${id}`),
    onSuccess: () => {
      toast.success("Proyek dihapus (gambar tetap aman di galeri).");
      qc.invalidateQueries({ queryKey: ["projects"] });
      invalidateImages();
    },
    onError: () => toast.error("Gagal menghapus proyek."),
  });

  const deleteUpload = useMutation({
    mutationFn: (id: string) => apiDelete(`/uploads/${id}`),
    onSuccess: () => {
      toast.success("File terunggah dihapus.");
      qc.invalidateQueries({ queryKey: ["uploads"] });
    },
    onError: () => toast.error("Gagal menghapus file."),
  });

  const cardProps = {
    projects,
    onDelete: (id: string) => setDeleteImageTarget(images.find((i) => i.id === id) ?? null),
    onToggleFavorite: (image: ImageMeta) => patchImage.mutate({ id: image.id, body: { favorite: !image.favorite } }),
    onAssignProject: (imageId: string, projectId: string) => patchImage.mutate({ id: imageId, body: { project_id: projectId } }),
    onCreateProject: (name: string) => createProject.mutateAsync(name),
  };

  const galleryGrid = (list: ImageMeta[], testId: string) =>
    list.length === 0 ? (
      <EmptyState icon={Images} title="Belum ada gambar" description="Hasil generate dari AI Product Studio akan muncul di sini." />
    ) : (
      <div className={`grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 ${testId}`}>
        {list.map((image, i) => (
          <ImageResultCard key={image.id} image={image} index={i} {...cardProps} />
        ))}
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader title="Ruang Kerja Saya" description="Semua aset digitalmu: foto hasil AI, proyek, file terunggah, riwayat, dan favorit.">
        <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="create-project-btn">
          <FolderPlus className="size-4" /> Proyek Baru
        </Button>
      </PageHeader>

      <Tabs defaultValue="galeri">
        <TabsList data-testid="workspace-tabs">
          <TabsTrigger value="galeri">
            <Images className="size-4" /> Galeri Hasil
          </TabsTrigger>
          <TabsTrigger value="favorit">
            <Star className="size-4" /> Favorit
          </TabsTrigger>
          <TabsTrigger value="proyek">
            <FolderOpen className="size-4" /> Proyek
          </TabsTrigger>
          <TabsTrigger value="file">
            <Upload className="size-4" /> File Terunggah
          </TabsTrigger>
          <TabsTrigger value="riwayat">
            <History className="size-4" /> Riwayat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="galeri" className="mt-5">
          {galleryGrid(images, "workspace-gallery")}
        </TabsContent>

        <TabsContent value="favorit" className="mt-5">
          {favorites.length === 0 ? (
            <EmptyState icon={Star} title="Belum ada favorit" description="Tandai gambar dengan ikon bintang untuk menyimpannya di sini." />
          ) : (
            galleryGrid(favorites, "workspace-favorites")
          )}
        </TabsContent>

        <TabsContent value="proyek" className="mt-5" data-testid="workspace-projects">
          {projects.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="Belum ada proyek"
              description="Buat proyek seperti 'Katalog Lebaran 2026' lalu simpan foto hasil AI ke dalamnya."
            >
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <FolderPlus className="size-4" /> Buat Proyek
              </Button>
            </EmptyState>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setProjectDetail(project)}
                  data-testid={`project-card-${project.id}`}
                  className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <FolderOpen className="size-5 text-[#9B8264]" strokeWidth={1.8} />
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      {project.image_count} gambar
                    </span>
                  </div>
                  <p className="mt-3 font-heading text-base font-semibold">{project.name}</p>
                  {project.description ? <p className="mt-0.5 text-xs text-muted-foreground">{project.description}</p> : null}
                  <p className="mt-2 text-[11px] text-muted-foreground">Dibuat {timeAgo(project.created_at)}</p>
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="file" className="mt-5" data-testid="workspace-uploads">
          {uploads.length === 0 ? (
            <EmptyState icon={Upload} title="Belum ada file" description="Foto referensi yang kamu unggah di Studio Produk AI tersimpan di sini." />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-6">
              {uploads.map((upload) => (
                <div key={upload.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" data-testid={`upload-item-${upload.id}`}>
                  <img src={`/api/uploads/${upload.id}/file`} alt={upload.filename} className="aspect-square w-full bg-secondary object-cover" />
                  <div className="p-3">
                    <p className="truncate text-xs font-medium">{upload.filename}</p>
                    <p className="text-[11px] text-muted-foreground">{upload.slot}</p>
                    <Button size="icon-xs" variant="ghost" className="mt-1.5" onClick={() => setDeleteUploadTarget(upload)} data-testid={`upload-delete-${upload.id}`}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="riwayat" className="mt-5" data-testid="workspace-history">
          {activities.length === 0 ? (
            <EmptyState icon={History} title="Belum ada riwayat" description="Aktivitasmu di semua agen akan terekam di sini." />
          ) : (
            <ul className="space-y-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
              {activities.map((item) => (
                <li key={item.id} className="flex items-center gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
                  <span className="size-1.5 rounded-full bg-[#9B8264]" />
                  <span className="flex-1 text-sm">
                    <span className="font-medium">{item.title}</span>
                    {item.detail ? <span className="text-muted-foreground"> - {item.detail}</span> : null}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{timeAgo(item.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      {/* Create project */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Proyek Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Nama proyek</Label>
            <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="cth. Katalog Lebaran 2026" data-testid="project-name-input" />
          </div>
          <DialogFooter>
            <Button
              onClick={() => (projectName.trim().length >= 2 ? createProject.mutate(projectName.trim()) : toast.error("Nama proyek minimal 2 karakter."))}
              disabled={createProject.isPending}
              data-testid="project-submit"
            >
              <Plus className="size-4" /> Buat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project detail */}
      <Dialog open={!!projectDetail} onOpenChange={(open) => !open && setProjectDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{projectDetail?.name}</DialogTitle>
          </DialogHeader>
          {(() => {
            const projectImages = images.filter((img) => img.project_id === projectDetail?.id);
            if (projectImages.length === 0) {
              return <p className="text-sm text-muted-foreground">Belum ada gambar di proyek ini. Simpan gambar dari galeri lewat ikon folder.</p>;
            }
            return (
              <div className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto">
                {projectImages.map((image) => (
                  <div key={image.id} className="relative" data-testid={`project-image-${image.id}`}>
                    <img src={`/api/images/${image.id}/file`} alt={image.product_name} className="aspect-square w-full rounded-xl border border-border bg-secondary object-cover" />
                    <Button
                      size="icon-xs"
                      variant="outline"
                      className="absolute right-1.5 top-1.5 bg-white/80"
                      onClick={() => patchImage.mutate({ id: image.id, body: { project_id: "" } })}
                      data-testid={`project-image-detach-${image.id}`}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteImageTarget}
        onOpenChange={(open) => !open && setDeleteImageTarget(null)}
        title="Hapus gambar ini?"
        description="Gambar akan dihapus permanen dari galeri."
        onConfirm={() => deleteImageTarget && deleteImage.mutate(deleteImageTarget.id)}
        testId="delete-image"
      />
      <ConfirmDialog
        open={!!deleteUploadTarget}
        onOpenChange={(open) => !open && setDeleteUploadTarget(null)}
        title="Hapus file terunggah?"
        description={deleteUploadTarget ? `"${deleteUploadTarget.filename}" akan dihapus permanen.` : ""}
        onConfirm={() => deleteUploadTarget && deleteUpload.mutate(deleteUploadTarget.id)}
        testId="delete-upload"
      />
      <ConfirmDialog
        open={!!deleteProjectTarget}
        onOpenChange={(open) => !open && setDeleteProjectTarget(null)}
        title="Hapus proyek ini?"
        description={deleteProjectTarget ? `Proyek "${deleteProjectTarget.name}" dihapus; gambar-gambar di dalamnya tetap aman di galeri.` : ""}
        onConfirm={() => deleteProjectTarget && deleteProject.mutate(deleteProjectTarget.id)}
        testId="delete-project"
      />
    </div>
  );
}
