import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Kategori", "Upload Foto", "Spesifikasi", "Gaya Foto", "Latar & Scene"];

export function StudioStepper({
  current,
  farthest,
  onSelect,
}: {
  current: number;
  farthest: number;
  onSelect: (step: number) => void;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-y-3" data-testid="studio-stepper">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const reachable = step <= farthest;
        const isCurrent = step === current;
        const isDone = step < current || (step <= farthest && step < farthest);
        return (
          <li key={label} className="flex items-center">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onSelect(step)}
              data-testid={`stepper-step-${step}`}
              className={cn(
                "flex items-center gap-2 rounded-full px-2 py-1 transition-colors duration-200 ease-out",
                reachable ? "cursor-pointer" : "cursor-not-allowed opacity-50",
              )}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-200",
                  isCurrent
                    ? "border-[#9B8264] bg-[#9B8264] text-white"
                    : isDone
                      ? "border-[#9B8264] bg-[#E9E1D5] text-[#5A4E3E]"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                {isDone && !isCurrent ? <Check className="size-3.5" /> : step}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:inline",
                  isCurrent ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </button>
            {step < STEPS.length ? <span className="mx-1 h-px w-4 bg-border sm:w-6" /> : null}
          </li>
        );
      })}
    </ol>
  );
}
