import { Check, Mountain, Package, Shirt, ShoppingBag, Sun, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { STYLE_GROUPS } from "@/lib/studioMeta";
import type { StyleKind, StyleOption } from "@/lib/studioMeta";

function StyleThumb({ kind }: { kind: StyleKind }) {
  const base = "relative flex h-20 w-full items-center justify-center overflow-hidden rounded-xl border border-[#E8E3DC]";
  switch (kind) {
    case "model":
      return (
        <div className={cn(base, "bg-gradient-to-b from-[#F1E9DC] to-[#E3D5C2]")}>
          <User className="size-8 text-[#7C6348]" strokeWidth={1.5} />
          <span className="absolute bottom-1.5 h-1 w-10 rounded-full bg-[#9B8264]/40" />
        </div>
      );
    case "mannequin":
      return (
        <div className={cn(base, "bg-[#F8F5F0]")}>
          <Shirt className="size-8 text-[#9B8264]" strokeWidth={1.5} />
          <span className="absolute bottom-1.5 h-2.5 w-6 rounded-sm bg-[#D9CEBF]" />
        </div>
      );
    case "flatlay":
      return (
        <div className={cn(base, "bg-[#FCFBF9]")}>
          <div className="size-10 rotate-6 rounded-md bg-[#E9E1D5] shadow-sm" />
          <div className="absolute left-2 top-2 size-3 rounded-full bg-[#9B8264]/50" />
          <div className="absolute bottom-2 right-2 size-2.5 rounded-full bg-[#C9A87C]/60" />
        </div>
      );
    case "ghost":
      return (
        <div className={cn(base, "bg-white")}>
          <Shirt className="size-8 text-[#D9CEBF]" strokeWidth={1.5} />
          <Shirt className="absolute size-8 text-[#9B8264]/30" strokeWidth={1.5} style={{ transform: "translate(2px,-2px)" }} />
        </div>
      );
    case "studio":
      return (
        <div className={cn(base, "bg-[#F1EDE6]")}>
          <div className="absolute inset-x-6 top-1 h-8 rounded-[100%] bg-white/80 blur-[6px]" />
          <Package className="size-8 text-[#7C6348]" strokeWidth={1.5} />
        </div>
      );
    case "lifestyle":
      return (
        <div className={cn(base, "bg-gradient-to-b from-[#F6E3DC] to-[#E9E1D5]")}>
          <Sun className="absolute right-2.5 top-2 size-4 text-[#C9A87C]" strokeWidth={1.8} />
          <Mountain className="size-8 text-[#7C6348]" strokeWidth={1.5} />
        </div>
      );
    case "luxury":
      return (
        <div className={cn(base, "bg-[#3A2C1E]")}>
          <div className="flex size-9 items-center justify-center rounded-full border border-[#C9A87C]">
            <ShoppingBag className="size-4 text-[#C9A87C]" strokeWidth={1.5} />
          </div>
        </div>
      );
    case "commercial":
      return (
        <div className={cn(base, "bg-white")}>
          <div className="absolute left-2 top-2 h-10 w-5 rounded-sm bg-[#E9E1D5]" />
          <div className="absolute bottom-2 right-3 h-8 w-5 rounded-sm bg-[#D9CEBF]" />
          <Package className="size-8 text-[#9B8264]" strokeWidth={1.5} />
        </div>
      );
  }
}

export function StyleSelector({
  group,
  selected,
  onSelect,
}: {
  group: string;
  selected: string;
  onSelect: (styleId: string) => void;
}) {
  const styles: StyleOption[] = STYLE_GROUPS[group] ?? STYLE_GROUPS.general;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="style-grid">
      {styles.map((style) => {
        const active = style.id === selected;
        return (
          <button
            key={style.id}
            type="button"
            onClick={() => onSelect(style.id)}
            data-testid={`style-card-${style.kind}-${style.name.toLowerCase().replace(/\s+/g, "-")}`}
            className={cn(
              "rounded-2xl border bg-card p-3 text-left shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "border-[#9B8264] ring-2 ring-[#9B8264]/30" : "border-border",
            )}
          >
            <StyleThumb kind={style.kind} />
            <div className="mt-2.5 flex items-start justify-between gap-1">
              <div>
                <p className="font-heading text-sm font-semibold text-foreground">{style.name}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{style.desc}</p>
              </div>
              {active ? (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#9B8264] text-white">
                  <Check className="size-3" />
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
