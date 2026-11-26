import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity as ActivityIcon,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Camera,
  FolderPlus,
  Images,
  LayoutGrid,
  Lightbulb,
  Package,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { DashboardSummary } from "@/lib/types";
import { formatClockWIB, formatDateID, formatIDR, greeting, timeAgo } from "@/lib/format";
import { AGENTS } from "@/lib/agentMeta";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, StatCard } from "@/components/shared";
import { cn } from "@/lib/utils";

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  generation: Camera,
  product: Package,
  task: CalendarCheck,
  transaction: Wallet,
  goal: BookOpen,
  idea: Lightbulb,
  project: FolderPlus,
  category: LayoutGrid,
  system: Sparkles,
  gallery: Images,
};

const SHORTCUT_ROUTES: [RegExp, string][] = [
  [/foto|produk|generate|shopee|katalog/i, "/studio"],
  [/tugas|jadwal|ingat|reminder|agenda/i, "/agents/daily"],
  [/uang|keuangan|pengeluaran|pemasukan|harga|modal/i, "/agents/finance"],
  [/belajar|kursus|pelajaran|ujian/i, "/agents/learning"],
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [now, setNow] = useState<Date | null>(null);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiGet<DashboardSummary>("/dashboard"),
    retry: false,
  });

  const hour = (now?.getHours() ?? 9) % 24;
  const tasksPct = data && data.tasks_today > 0 ? Math.round((data.tasks_done_today / data.tasks_today) * 100) : 0;

  const runShortcut = () => {
    const target = SHORTCUT_ROUTES.find(([re]) => re.test(prompt))?.[1] ?? "/agents/creative";
    navigate(target);
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <section
        data-testid="welcome-banner"
        className="rounded-2xl border border-[#E8E3DC] bg-[#F8F5F0] p-6 shadow-sm lg:p-8"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9B8264]">
              {data?.today ? formatDateID(`${data.today}T00:00:00+07:00`) : formatDateID(new Date())}
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {greeting(hour)}, {data?.owner_name ?? "Forshea"}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              forshea.gen siap membantumu hari ini - buat foto produk, kelola tugas, catat keuangan, dan kembangkan
              idemu dari satu tempat.
            </p>
            <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground" data-testid="welcome-clock">
              {now ? formatClockWIB(now) : "--:--"} WIB
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/studio" className={buttonVariants({})} data-testid="cta-create-photo">
              <Camera className="size-4" /> Buat Foto Produk
            </Link>
            <Link to="/agents/daily" className={buttonVariants({ variant: "outline" })} data-testid="cta-manage-tasks">
              <CalendarCheck className="size-4" /> Kelola Tugas
            </Link>
          </div>
        </div>
      </section>

      {/* Productivity summary */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="dashboard-stats">
        <StatCard icon={Images} label="Foto Produk" value={String(data?.images_total ?? 0)} sub={`${data?.images_today ?? 0} dibuat hari ini`} to="/workspace" />
        <StatCard icon={CalendarCheck} label="Tugas Hari Ini" value={`${data?.tasks_done_today ?? 0}/${data?.tasks_today ?? 0}`} sub={data && data.tasks_today > 0 ? `${tasksPct}% selesai` : "Belum ada tugas"} to="/agents/daily" />
        <StatCard icon={TrendingUp} label="Pemasukan Bulan Ini" value={formatIDR(data?.income_month ?? 0)} to="/agents/finance" />
        <StatCard icon={TrendingDown} label="Pengeluaran Bulan Ini" value={formatIDR(data?.expense_month ?? 0)} to="/agents/finance" />
      </section>

      {isError ? (
        <p className="rounded-xl border border-[#E2D3B8] bg-[#F3EBDD] p-3 text-xs text-[#7A4D14]">
          Backend tidak terjangkau saat ini - sebagian data terbaru mungkin tidak tampil.
        </p>
      ) : null}

      {/* Quick access to agents */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-foreground">Akses Cepat AI Agen</h2>
          <Link to="/agents" className="text-xs font-medium text-[#7C6348] hover:underline">
            Lihat semua
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5" data-testid="quick-agent-grid">
          {AGENTS.map((agent) => (
            <Link
              key={agent.id}
              to={agent.path}
              data-testid={`quick-agent-${agent.id}`}
              className="group rounded-xl border border-border bg-background p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#D5CCA6] hover:shadow-md"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-[#E9E1D5] text-[#9B8264]">
                <agent.icon className="size-4.5" strokeWidth={1.8} />
              </span>
              <p className="mt-3 font-heading text-sm font-semibold text-foreground">{agent.name}</p>
              <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">{agent.tagline}</p>
              <ArrowRight className="mt-2 size-3.5 text-[#9B8264] transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Recent creations */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">Foto Produk Terbaru</h2>
            <Link to="/workspace" className="text-xs font-medium text-[#7C6348] hover:underline">
              Ruang Kerja
            </Link>
          </div>
          {data && data.recent_images.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="recent-creations">
              {data.recent_images.map((img) => (
                <Link key={img.id} to="/workspace" className="group block">
                  <div className="overflow-hidden rounded-xl border border-border bg-secondary">
                    <img
                      src={`/api/images/${img.id}/file`}
                      alt={img.product_name}
                      className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                    />
                  </div>
                  <p className="mt-1.5 truncate text-xs font-medium text-foreground">{img.product_name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{img.style}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={Camera}
                title="Belum ada foto produk"
                description="Buat foto produk pertamamu di AI Product Studio - cukup unggah foto asli, pilih gaya, dan generate."
              >
                <Link to="/studio" className={buttonVariants({ size: "sm" })} data-testid="empty-creations-cta">
                  Buka AI Product Studio
                </Link>
              </EmptyState>
            </div>
          )}
        </section>

        {/* Recent activities + assistant entry */}
        <div className="space-y-6 lg:col-span-5">
          <section className="rounded-2xl border border-[#E5DFD6] bg-[#F5F1EB] p-6 shadow-sm" data-testid="assistant-entry">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#9B8264]" strokeWidth={1.8} />
              <h2 className="font-heading text-lg font-semibold text-foreground">Tanya forshea.gen</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Tulis kebutuhanmu, kami antar ke agen yang tepat.</p>
            <div className="mt-3 flex gap-2">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && prompt.trim() && runShortcut()}
                placeholder="cth. buat foto romper untuk shopee"
                data-testid="assistant-entry-input"
              />
              <button
                type="button"
                onClick={runShortcut}
                className={buttonVariants({ size: "icon" })}
                disabled={!prompt.trim()}
                data-testid="assistant-entry-submit"
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-foreground">Aktivitas Terbaru</h2>
            {data && data.recent_activities.length > 0 ? (
              <ul className="mt-4 space-y-3" data-testid="recent-activities">
                {data.recent_activities.map((item) => {
                  const Icon = ACTIVITY_ICONS[item.type] ?? ActivityIcon;
                  return (
                    <li key={item.id} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F8F5F0]">
                        <Icon className="size-4 text-[#9B8264]" strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                        {item.detail ? <p className="truncate text-xs text-muted-foreground">{item.detail}</p> : null}
                      </div>
                      <span className={cn("shrink-0 text-[11px] text-muted-foreground")}>{timeAgo(item.created_at)}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Belum ada aktivitas - mulai dari Studio Produk AI.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
