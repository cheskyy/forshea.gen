import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  to,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  to?: string;
}) {
  const inner = (
    <div
      data-testid={`stat-card-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4 text-[#9B8264]" strokeWidth={1.8} />
        <span className="text-xs font-medium uppercase tracking-[0.14em]">{label}</span>
      </div>
      <p className="mt-3 font-heading text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
  return to ? (
    <Link to={to} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/50 px-6 py-12 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-accent">
        <Icon className="size-5 text-[#9B8264]" strokeWidth={1.8} />
      </div>
      <h3 className="mt-4 font-heading text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

// "DEMO" chip (amber, per guidelines mock_badge) vs "AI" chip (green, status_success).
export function DemoChip({ isMock, className }: { isMock: boolean; className?: string }) {
  return isMock ? (
    <span
      data-testid="demo-chip"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[#E2D3B8] bg-[#F3EBDD] px-2 py-0.5 text-[11px] font-semibold text-[#7A4D14]",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-[#C07616]" />
      DEMO
    </span>
  ) : (
    <span
      data-testid="ai-chip"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[#D2E8D8] bg-[#EEF5F0] px-2 py-0.5 text-[11px] font-semibold text-[#1C5B32]",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-[#2F7347]" />
      AI
    </span>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  testId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  testId: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} data-testid={`${testId}-cancel`}>
            Batal
          </Button>
          <Button
            variant="destructive"
            size="sm"
            data-testid={`${testId}-confirm`}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Ya, hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
