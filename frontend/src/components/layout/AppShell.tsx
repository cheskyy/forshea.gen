import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Camera, Home, Layers, LayoutGrid, Menu, Settings, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { AiStatus, UserSettings } from "@/lib/types";
import { formatClockWIB } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  primary?: boolean;
}

const NAV: NavItem[] = [
  { to: "/", label: "Ringkasan", icon: Home, end: true },
  { to: "/agents", label: "AI Agen", icon: LayoutGrid },
  { to: "/studio", label: "Studio Produk AI", icon: Camera, primary: true },
  { to: "/workspace", label: "Ruang Kerja Saya", icon: Layers },
  { to: "/settings", label: "Pengaturan", icon: Settings },
];

const MOBILE_NAV: NavItem[] = [NAV[0], NAV[2], NAV[1], NAV[3]];

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl bg-[#9B8264] text-white shadow-sm">
        <Sparkles className="size-5" strokeWidth={1.8} />
      </div>
      <div>
        <p className="font-heading text-lg font-semibold tracking-tight text-foreground">forshea.gen</p>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#9B8264]">Your Personal AI Agent</p>
      </div>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" data-testid="sidebar-nav">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-200 ease-out",
              isActive
                ? "bg-[#E9E1D5] text-[#1F1D1A] shadow-sm"
                : "text-[#756F67] hover:bg-[#EDE7DE] hover:text-foreground",
            )
          }
        >
          <item.icon className="size-4" strokeWidth={1.8} />
          <span>{item.label}</span>
          {item.primary ? (
            <span className="ml-auto rounded-full bg-[#9B8264] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Utama
            </span>
          ) : null}
        </NavLink>
      ))}
    </nav>
  );
}

function ModeChip() {
  const { data } = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => apiGet<AiStatus>("/ai/status"),
    retry: false,
    staleTime: 60_000,
  });
  const active = data?.provider === "gemini";
  return (
    <span
      data-testid="mode-chip"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        active
          ? "border-[#D2E8D8] bg-[#EEF5F0] text-[#1C5B32]"
          : "border-[#E2D3B8] bg-[#F3EBDD] text-[#7A4D14]",
      )}
    >
      <span className={cn("size-1.5 rounded-full", active ? "bg-[#2F7347]" : "bg-[#C07616]")} />
      {active ? "AI Aktif" : "Mode Demo"}
    </span>
  );
}

export default function AppShell() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiGet<UserSettings>("/settings"),
    retry: false,
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings?.theme === "dark");
  }, [settings?.theme]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const current = NAV.find(
    (item) => item.to === location.pathname || (item.end !== true && location.pathname.startsWith(item.to)),
  );
  const title = current?.label ?? "forshea.gen";

  return (
    <div className="min-h-svh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[#E5DFD6] bg-[#F5F1EB] px-5 py-6 xl:w-72 lg:flex">
        <BrandMark />
        <div className="mt-8 flex-1">
          <NavLinks />
        </div>
        <div className="rounded-xl border border-[#E5DFD6] bg-[#FCFBF9] p-4">
          <p className="text-xs font-semibold text-foreground">Mode Personal</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Data tersimpan aman di database pribadimu.
          </p>
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-64 xl:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" className="lg:hidden" data-testid="mobile-nav-trigger" />
                }
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-[#F5F1EB] p-5">
                <SheetHeader>
                  <SheetTitle className="sr-only">Navigasi</SheetTitle>
                </SheetHeader>
                <div className="mt-2">
                  <BrandMark />
                  <div className="mt-8">
                    <NavLinks onNavigate={() => setOpen(false)} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <h2 className="font-heading text-base font-semibold text-foreground sm:text-lg">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span
              data-testid="wib-clock"
              className="hidden rounded-lg border border-border bg-card px-2.5 py-1 font-mono text-xs tabular-nums text-muted-foreground sm:inline-block"
            >
              {now ? formatClockWIB(now) : "--:--:--"} WIB
            </span>
            <ModeChip />
            <div
              data-testid="owner-avatar"
              className="flex size-9 items-center justify-center rounded-full bg-[#E9E1D5] font-heading text-sm font-semibold text-[#2D261E]"
            >
              {(settings?.owner_name ?? "F").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-card/95 backdrop-blur-md lg:hidden"
        data-testid="mobile-bottom-nav"
      >
        {MOBILE_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors duration-200",
                isActive ? "text-[#9B8264]" : "text-muted-foreground",
              )
            }
          >
            <item.icon className="size-5" strokeWidth={1.8} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Toaster />
    </div>
  );
}
