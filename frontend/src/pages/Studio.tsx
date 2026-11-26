import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { StudioStepper } from "@/components/studio/StudioStepper";
import { CategorySelector } from "@/components/studio/CategorySelector";
import { StructuredUploadGrid, fileToDataUrl } from "@/components/studio/StructuredUploadGrid";
import { EMPTY_SPEC, ProductSpecForm } from "@/components/studio/ProductSpecForm";
import type { SpecForm } from "@/components/studio/ProductSpecForm";
import { StyleSelector } from "@/components/studio/StyleSelector";
import { SceneCustomizer } from "@/components/studio/SceneCustomizer";
import { GenerationInspector } from "@/components/studio/GenerationInspector";
import { ResultGallery } from "@/components/studio/ResultGallery";
import { CORE_SLOTS, REF_SLOTS } from "@/lib/studioMeta";
import type {
  Category,
  ImageMeta,
  Job,
  JobDetail,
  Product,
  Project,
  SceneSettings,
  UploadMeta,
  UserSettings,
} from "@/lib/types";

const DEFAULT_SCENE: SceneSettings = {
  background_color: "#F8F5F0",
  background_type: "",
  lighting: "",
  camera_angle: "",
  composition: "",
  props: "",
  mood: "",
  aspect_ratio: "1:1",
  custom_prompt: "",
  preset: "",
};

function describeError(err: unknown): string {
  if (err && typeof err === "object" && "body" in err) {
    const body = (err as { body?: { detail?: unknown } }).body;
    if (typeof body?.detail === "string") return body.detail;
  }
  return "Terjadi kesalahan. Coba lagi.";
}

export default function Studio() {
  const qc = useQueryClient();

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => apiGet<Category[]>("/categories") });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => apiGet<UserSettings>("/settings") });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => apiGet<Project[]>("/projects") });

  const [step, setStep] = useState(1);
  const [farthest, setFarthest] = useState(1);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Record<string, UploadMeta | null>>({});
  const [spec, setSpec] = useState<SpecForm>(EMPTY_SPEC);
  const [style, setStyle] = useState("");
  const [scene, setScene] = useState<SceneSettings>(DEFAULT_SCENE);
  const sceneTouched = useRef(false);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [savedProductId, setSavedProductId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!sceneTouched.current && settings?.default_aspect) {
      setScene((s) => ({ ...s, aspect_ratio: settings.default_aspect }));
    }
  }, [settings?.default_aspect]);

  const category = categories.find((c) => c.id === categoryId) ?? null;
  const effQuantity = quantity ?? settings?.default_quantity ?? 2;

  // Poll the active job until it finishes.
  const { data: job } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => apiGet<JobDetail>(`/generate/${jobId}`),
    enabled: !!jobId,
    refetchInterval: (query) => (query.state.data?.status === "processing" ? 1500 : false),
  });

  const jobDoneRef = useRef<string | null>(null);
  useEffect(() => {
    if (!job || jobDoneRef.current === job.id) return;
    if (job.status === "done") {
      jobDoneRef.current = job.id;
      toast.success(`${job.images.length} foto produk siap!`);
      qc.invalidateQueries({ queryKey: ["images"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    } else if (job.status === "error") {
      jobDoneRef.current = job.id;
      toast.error("Generasi gagal. Coba lagi sebentar.");
    }
  }, [job, qc]);

  const uploadMutation = useMutation({
    mutationFn: async ({ slot, file }: { slot: string; file: File }) => {
      const dataUrl = await fileToDataUrl(file);
      return apiPost<UploadMeta>("/uploads", { data_url: dataUrl, filename: file.name, slot });
    },
    onMutate: ({ slot }) => setUploadingSlot(slot),
    onSuccess: (meta) => {
      setUploads((prev) => ({ ...prev, [meta.slot]: meta }));
      toast.success("Foto terunggah.");
    },
    onError: (err) => toast.error(describeError(err)),
    onSettled: () => setUploadingSlot(null),
  });

  const removeUploadMutation = useMutation({
    mutationFn: (slot: string) => {
      const upload = uploads[slot];
      setUploads((prev) => ({ ...prev, [slot]: null }));
      return upload ? apiDelete(`/uploads/${upload.id}`) : Promise.resolve();
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/images/${id}`),
    onSuccess: () => {
      toast.success("Gambar dihapus.");
      qc.invalidateQueries({ queryKey: ["job", jobId] });
      qc.invalidateQueries({ queryKey: ["images"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("Gagal menghapus gambar."),
  });

  const patchImageMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { favorite?: boolean; project_id?: string } }) =>
      fetch(`/api/images/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => {
        if (!r.ok) throw new Error("patch failed");
        return r.json() as Promise<ImageMeta>;
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job", jobId] });
      qc.invalidateQueries({ queryKey: ["images"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => toast.error("Gagal memperbarui gambar."),
  });

  const createProjectMutation = useMutation({
    mutationFn: (name: string) => apiPost<Project>("/projects", { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => apiPost<Category>("/categories", { name }),
    onSuccess: (cat) => {
      toast.success(`Kategori "${cat.name}" ditambahkan.`);
      qc.invalidateQueries({ queryKey: ["categories"] });
      setCategoryId(cat.id);
    },
    onError: () => toast.error("Gagal menambah kategori."),
  });

  const requiredSlots = category?.required_slots ?? ["front"];
  const uploadsOk = requiredSlots.every((slot) => uploads[slot]);
  const specOk = spec.name.trim().length >= 2;
  const isGenerating = !!jobId && job?.status === "processing";
  const canGenerate = !!category && uploadsOk && specOk && !!style && !isGenerating;
  const disabledReason = !category
    ? "Pilih kategori produk dulu."
    : !uploadsOk
      ? "Unggah foto wajib dulu (Tampak Depan)."
      : !specOk
        ? "Isi nama produk dulu."
        : !style
          ? "Pilih gaya foto dulu."
          : null;

  const goTo = (next: number) => {
    setStep(next);
    setFarthest((f) => Math.max(f, next));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextStep = () => {
    if (step === 1 && !category) return toast.error("Pilih kategori produk dulu.");
    if (step === 2 && !uploadsOk) return toast.error("Unggah foto untuk slot wajib dulu.");
    if (step === 3 && !specOk) return toast.error("Nama produk minimal 2 karakter.");
    if (step === 4 && !style) return toast.error("Pilih gaya foto dulu.");
    goTo(step + 1);
  };

  const handleGenerate = async () => {
    if (!category || !canGenerate) return;
    try {
      const uploadIds = [...CORE_SLOTS, ...REF_SLOTS]
        .map((slot) => uploads[slot.key])
        .filter((u): u is UploadMeta => !!u)
        .map((u) => u.id);
      const payload = {
        name: spec.name.trim(),
        product_type: spec.product_type,
        material: spec.material,
        main_color: spec.main_color,
        secondary_color: spec.secondary_color,
        pattern: spec.pattern,
        dimensions: spec.dimensions,
        description: spec.description,
        characteristics: spec.characteristics,
        upload_ids: uploadIds,
      };
      let productId = savedProductId;
      if (productId) {
        await apiPut<Product>(`/products/${productId}`, payload);
      } else {
        const product = await apiPost<Product>("/products", { ...payload, category_id: category.id });
        productId = product.id;
        setSavedProductId(product.id);
        qc.invalidateQueries({ queryKey: ["activities"] });
      }
      const newJob = await apiPost<Job>("/generate", {
        product_id: productId,
        quantity: effQuantity,
        style,
        scene,
      });
      jobDoneRef.current = null;
      setJobId(newJob.id);
    } catch (err) {
      toast.error(describeError(err));
    }
  };

  const resetStudio = () => {
    setStep(1);
    setFarthest(1);
    setCategoryId(null);
    setUploads({});
    setSpec(EMPTY_SPEC);
    setStyle("");
    setScene(DEFAULT_SCENE);
    sceneTouched.current = false;
    setSavedProductId(null);
    setJobId(null);
  };

  const stepTitles = ["Pilih Kategori Produk", "Unggah Foto Asli", "Spesifikasi Produk", "Gaya Fotografi", "Latar & Suasana"];
  const stepHints = [
    "Pilih kategori agar gaya foto dan slot upload yang muncul relevan.",
    "Seret & letakkan foto asli produkmu. Foto asli adalah sumber kebenaran - AI menjaga produk tetap identik.",
    "Lengkapi detail produk. Semakin jelas spesifikasinya, semakin akhir hasilnya.",
    "Gaya foto disesuaikan dengan kategori produk yang kamu pilih.",
    "Atur latar, cahaya, dan suasana. Preset tersedia agar cepat - lalu buat foto dari panel Ringkasan.",
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="AI Product Studio" description="Generator foto produk profesional untuk katalog Shopee - dari foto asli ke foto jualan.">
        <Button variant="ghost" size="sm" onClick={resetStudio} data-testid="studio-reset-btn">
          <RotateCcw className="size-4" /> Mulai Baru
        </Button>
      </PageHeader>

      <StudioStepper current={step} farthest={farthest} onSelect={goTo} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">{stepTitles[step - 1]}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{stepHints[step - 1]}</p>
          </div>

          {step === 1 ? (
            <CategorySelector
              categories={categories}
              selectedId={categoryId}
              onSelect={(c) => setCategoryId(c.id)}
              onCreateCustom={(name) => createCategoryMutation.mutate(name)}
              creating={createCategoryMutation.isPending}
            />
          ) : null}

          {step === 2 && category ? (
            <StructuredUploadGrid
              category={category}
              uploads={uploads}
              uploadingSlot={uploadingSlot}
              onPick={(slot, file) => uploadMutation.mutate({ slot, file })}
              onRemove={(slot) => removeUploadMutation.mutate(slot)}
            />
          ) : null}

          {step === 3 ? <ProductSpecForm spec={spec} onChange={(patch) => setSpec((s) => ({ ...s, ...patch }))} category={category} /> : null}

          {step === 4 ? <StyleSelector group={category?.group ?? "general"} selected={style} onSelect={setStyle} /> : null}

          {step === 5 ? (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <SceneCustomizer
                scene={scene}
                onChange={(patch) => {
                  sceneTouched.current = true;
                  setScene((s) => ({ ...s, ...patch }));
                }}
              />
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <Button variant="outline" disabled={step === 1} onClick={() => goTo(step - 1)} data-testid="step-back-btn">
              <ChevronLeft className="size-4" /> Kembali
            </Button>
            <Button onClick={nextStep} disabled={step === 5} data-testid="step-next-btn">
              {step === 5 ? "Selesai" : "Lanjut"} <ChevronRight className="size-4" />
            </Button>
          </div>

          {job && job.status !== "processing" ? (
            <ResultGallery
              job={job}
              projects={projects}
              onRegenerate={handleGenerate}
              onDeleteImage={(id) => deleteImageMutation.mutate(id)}
              onToggleFavorite={(image) => patchImageMutation.mutate({ id: image.id, body: { favorite: !image.favorite } })}
              onAssignProject={(imageId, projectId) => patchImageMutation.mutate({ id: imageId, body: { project_id: projectId } })}
              onCreateProject={(name) => createProjectMutation.mutateAsync(name)}
            />
          ) : null}
        </div>

        <div className="lg:col-span-4">
          <GenerationInspector
            category={category}
            productName={spec.name}
            style={style}
            scene={scene}
            quantity={effQuantity}
            onQuantity={setQuantity}
            canGenerate={canGenerate}
            disabledReason={disabledReason}
            onGenerate={handleGenerate}
            job={job ?? null}
            isGenerating={!!isGenerating || (!job && !!jobId)}
          />
        </div>
      </div>
    </div>
  );
}
