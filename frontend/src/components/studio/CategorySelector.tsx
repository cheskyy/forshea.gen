import { useState } from "react";
import { Baby, Lamp, Milk, Package, Plus, Shirt, ShoppingBag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "baby-clothing": Baby,
  "womens-fashion": Shirt,
  "baby-essentials": Milk,
  "fashion-accessories": ShoppingBag,
  "home-living": Lamp,
  "other-products": Package,
};

export function CategorySelector({
  categories,
  selectedId,
  onSelect,
  onCreateCustom,
  creating,
}: {
  categories: Category[];
  selectedId: string | null;
  onSelect: (category: Category) => void;
  onCreateCustom: (name: string) => void;
  creating: boolean;
}) {
  const [customName, setCustomName] = useState("");

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" data-testid="category-grid">
        {categories.map((category) => {
          const Icon = CATEGORY_ICONS[category.slug] ?? Package;
          const active = category.id === selectedId;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category)}
              data-testid={`category-card-${category.slug}`}
              className={cn(
                "rounded-2xl border bg-card p-4 text-left shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "border-[#9B8264] ring-2 ring-[#9B8264]/30" : "border-border",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl transition-colors duration-200",
                    active ? "bg-[#9B8264] text-white" : "bg-[#F8F5F0] text-[#9B8264]",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-heading text-sm font-semibold text-foreground">{category.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {category.custom ? "Kategori kustom" : `${category.subcategories.length} jenis produk`}
                  </p>
                </div>
              </div>
              {category.subcategories.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {category.subcategories.slice(0, 3).map((sub) => (
                    <span
                      key={sub}
                      className="rounded-full bg-[#F4EFEA] px-2 py-0.5 text-[11px] font-medium text-[#5A4E3E]"
                    >
                      {sub}
                    </span>
                  ))}
                  {category.subcategories.length > 3 ? (
                    <span className="rounded-full bg-[#F4EFEA] px-2 py-0.5 text-[11px] font-medium text-[#5A4E3E]">
                      +{category.subcategories.length - 3}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-dashed border-border bg-secondary/60 p-4 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground sm:flex-1">
          Butuh kategori lain? Tulis namanya, kami tambahkan tanpa mengatur ulang aplikasi.
        </p>
        <div className="flex gap-2">
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="cth. Elektronik"
            className="h-9 w-40"
            data-testid="custom-category-input"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={customName.trim().length < 2 || creating}
            onClick={() => {
              onCreateCustom(customName.trim());
              setCustomName("");
            }}
            data-testid="custom-category-submit"
          >
            <Plus className="size-4" /> Tambah
          </Button>
        </div>
      </div>
    </div>
  );
}
