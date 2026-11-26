import { useRef, useState } from "react";
import { ImagePlus, RefreshCw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CORE_SLOTS, REF_SLOTS } from "@/lib/studioMeta";
import type { SlotDef } from "@/lib/studioMeta";
import { cn } from "@/lib/utils";
import type { Category, UploadMeta } from "@/lib/types";

const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
const MAX_MB = 6;

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("gagal membaca file"));
    reader.readAsDataURL(file);
  });
}

function SlotCard({
  slot,
  required,
  upload,
  uploading,
  onPick,
  onRemove,
}: {
  slot: SlotDef;
  required: boolean;
  upload: UploadMeta | null;
  uploading: boolean;
  onPick: (slotKey: string, file: File) => void;
  onRemove: (slotKey: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      data-testid={`upload-slot-${slot.key}`}
      className={cn(
        "rounded-2xl border bg-card p-3 shadow-sm transition-colors duration-200",
        dragOver ? "border-[#9B8264] bg-[#F8F5F0]" : "border-border",
        required && !upload ? "ring-1 ring-[#C07616]/30" : "",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onPick(slot.key, file);
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold text-foreground">{slot.label}</p>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            required ? "bg-[#F3EBDD] text-[#7A4D14]" : "bg-secondary text-muted-foreground",
          )}
        >
          {required ? "Wajib" : "Opsional"}
        </span>
      </div>

      {upload ? (
        <div className="mt-3">
          <div className="overflow-hidden rounded-xl border border-border bg-secondary">
            <img
              src={`/api/uploads/${upload.id}/file`}
              alt={slot.label}
              className="aspect-square w-full object-cover"
              data-testid={`upload-preview-${slot.key}`}
            />
          </div>
          <p className="mt-2 truncate text-xs text-muted-foreground">{upload.filename}</p>
          <div className="mt-2 flex gap-2">
            <Button
              size="xs"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              data-testid={`upload-replace-${slot.key}`}
            >
              <RefreshCw className="size-3.5" /> Ganti
            </Button>
            <Button size="xs" variant="ghost" onClick={() => onRemove(slot.key)} data-testid={`upload-remove-${slot.key}`}>
              <Trash2 className="size-3.5 text-destructive" /> Hapus
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          data-testid={`upload-trigger-${slot.key}`}
          className="mt-3 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/60 px-3 py-6 transition-colors duration-200 hover:border-[#9B8264] hover:bg-[#F8F5F0]"
        >
          {uploading ? (
            <span className="size-5 animate-spin rounded-full border-2 border-[#9B8264] border-t-transparent" />
          ) : (
            <ImagePlus className="size-5 text-[#9B8264]" strokeWidth={1.8} />
          )}
          <span className="text-xs font-medium text-foreground">Seret foto ke sini</span>
          <span className="text-[11px] text-muted-foreground">atau pilih file - {slot.hint}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        data-testid={`upload-input-${slot.key}`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(slot.key, file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function StructuredUploadGrid({
  category,
  uploads,
  uploadingSlot,
  onPick,
  onRemove,
}: {
  category: Category;
  uploads: Record<string, UploadMeta | null>;
  uploadingSlot: string | null;
  onPick: (slotKey: string, file: File) => void;
  onRemove: (slotKey: string) => void;
}) {
  const validateAndPick = (slotKey: string, file: File) => {
    if (!ALLOWED.includes(file.type)) {
      toast.error("Format harus PNG, JPG, atau WebP.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Ukuran gambar maksimal ${MAX_MB}MB.`);
      return;
    }
    onPick(slotKey, file);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {CORE_SLOTS.map((slot) => (
          <SlotCard
            key={slot.key}
            slot={slot}
            required={category.required_slots.includes(slot.key)}
            upload={uploads[slot.key] ?? null}
            uploading={uploadingSlot === slot.key}
            onPick={validateAndPick}
            onRemove={onRemove}
          />
        ))}
      </div>

      <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-[#9B8264]">
        Referensi tambahan (opsional)
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {REF_SLOTS.map((slot) => (
          <SlotCard
            key={slot.key}
            slot={slot}
            required={false}
            upload={uploads[slot.key] ?? null}
            uploading={uploadingSlot === slot.key}
            onPick={validateAndPick}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
