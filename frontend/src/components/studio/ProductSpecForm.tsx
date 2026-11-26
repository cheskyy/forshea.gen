import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/lib/types";

export interface SpecForm {
  name: string;
  product_type: string;
  material: string;
  main_color: string;
  secondary_color: string;
  pattern: string;
  dimensions: string;
  description: string;
  characteristics: string;
}

export const EMPTY_SPEC: SpecForm = {
  name: "",
  product_type: "",
  material: "",
  main_color: "",
  secondary_color: "",
  pattern: "",
  dimensions: "",
  description: "",
  characteristics: "",
};

function Field({
  label,
  hint,
  children,
  testId,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={testId} className="text-xs font-medium text-foreground">
        {label}
        {hint ? <span className="ml-1 font-normal text-muted-foreground">- {hint}</span> : null}
      </Label>
      {children}
    </div>
  );
}

export function ProductSpecForm({
  spec,
  onChange,
  category,
}: {
  spec: SpecForm;
  onChange: (patch: Partial<SpecForm>) => void;
  category: Category | null;
}) {
  const subcategories = category?.subcategories ?? [];
  const isCustom = category?.custom ?? false;

  return (
    <div className="space-y-4">
      <div
        data-testid="source-of-truth-card"
        className="rounded-2xl border border-[#E8E3DC] bg-[#F8F5F0] p-4"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#E9E1D5]">
            <Info className="size-4 text-[#9B8264]" />
          </span>
          <div>
            <p className="font-heading text-sm font-semibold text-foreground">SOURCE OF TRUTH</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Foto produk asli yang kamu unggah dan spesifikasi di bawah ini adalah <strong>referensi utama</strong>{" "}
              pembuatan gambar. AI akan mempertahankan warna, motif, tekstur, bentuk, proporsi, dan detail cetak produk
              sedetail mungkin - tidak mengarang fitur baru atau mengubah desain asli.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nama Produk" testId="spec-product-name-input">
          <Input
            id="spec-product-name-input"
            value={spec.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="cth. Romper Katun Bayi - Krem"
            data-testid="spec-product-name-input"
          />
        </Field>

        <Field label="Jenis Produk" hint={isCustom ? "kategori kustom - bebas" : undefined} testId="spec-product-type">
          {subcategories.length > 0 ? (
            <Select value={spec.product_type} onValueChange={(value: string) => onChange({ product_type: value })}>
              <SelectTrigger id="spec-product-type" data-testid="spec-product-type">
                <SelectValue>{spec.product_type || "Pilih jenis produk"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {subcategories.map((sub) => (
                  <SelectItem key={sub} value={sub}>
                    {sub}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="spec-product-type"
              value={spec.product_type}
              onChange={(e) => onChange({ product_type: e.target.value })}
              placeholder="cth. Sesuidi produkmu"
              data-testid="spec-product-type"
            />
          )}
        </Field>

        <Field label="Bahan / Material" testId="spec-material-input">
          <Input
            id="spec-material-input"
            value={spec.material}
            onChange={(e) => onChange({ material: e.target.value })}
            placeholder="cth. Katun premium"
            data-testid="spec-material-input"
          />
        </Field>

        <Field label="Warna Utama" testId="spec-main-color-input">
          <Input
            id="spec-main-color-input"
            value={spec.main_color}
            onChange={(e) => onChange({ main_color: e.target.value })}
            placeholder="cth. Krem"
            data-testid="spec-main-color-input"
          />
        </Field>

        <Field label="Warna Sekunder" testId="spec-secondary-color-input">
          <Input
            id="spec-secondary-color-input"
            value={spec.secondary_color}
            onChange={(e) => onChange({ secondary_color: e.target.value })}
            placeholder="cth. Coklat muda (opsional)"
            data-testid="spec-secondary-color-input"
          />
        </Field>

        <Field label="Motif / Pola" testId="spec-pattern-input">
          <Input
            id="spec-pattern-input"
            value={spec.pattern}
            onChange={(e) => onChange({ pattern: e.target.value })}
            placeholder="cth. Polos, bunga kecil"
            data-testid="spec-pattern-input"
          />
        </Field>

        <Field label="Dimensi" testId="spec-dimensions-input">
          <Input
            id="spec-dimensions-input"
            value={spec.dimensions}
            onChange={(e) => onChange({ dimensions: e.target.value })}
            placeholder="cth. 60 x 40 cm"
            data-testid="spec-dimensions-input"
          />
        </Field>
      </div>

      <Field label="Deskripsi Produk" testId="spec-description-input">
        <Textarea
          id="spec-description-input"
          value={spec.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Ceritakan produkmu sebagaimana akan kamu tampilkan di toko..."
          rows={3}
          data-testid="spec-description-input"
        />
      </Field>

      <Field label="Karakteristik Khusus" testId="spec-characteristics-input">
        <Textarea
          id="spec-characteristics-input"
          value={spec.characteristics}
          onChange={(e) => onChange({ characteristics: e.target.value })}
          placeholder="cth. Ada label bordir di kerah, kancing kayu 3 buah, jahitan ganda"
          rows={2}
          data-testid="spec-characteristics-input"
        />
      </Field>
    </div>
  );
}
