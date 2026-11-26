import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Moon, Plug, ShieldCheck, Sun, UserRound } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared";
import { ASPECT_RATIOS } from "@/lib/studioMeta";
import { formatIDR } from "@/lib/format";
import type { AiStatus, UserSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => apiGet<UserSettings>("/settings") });
  const { data: aiStatus } = useQuery({ queryKey: ["ai-status"], queryFn: () => apiGet<AiStatus>("/ai/status"), staleTime: 30_000 });
  const { isSuccess: apiConnected } = useQuery({ queryKey: ["ping"], queryFn: () => apiGet<{ message: string }>("/"), retry: false });

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("2");
  const [aspect, setAspect] = useState("1:1");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    if (!settings) return;
    setName((current) => current || settings.owner_name);
    setQuantity(String(settings.default_quantity));
    setAspect(settings.default_aspect);
    setBudget(String(settings.monthly_budget));
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: (body: Partial<UserSettings>) => apiPut<UserSettings>("/settings", body),
    onSuccess: () => {
      toast.success("Pengaturan tersimpan.");
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("Gagal menyimpan pengaturan."),
  });

  const applyTheme = (theme: "light" | "dark") => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    updateSettings.mutate({ theme });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" description="Profil, tampilan, preferensi, dan konfigurasi AI provider." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card data-testid="profile-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <UserRound className="size-4 text-[#9B8264]" /> Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nama pemilik</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Namamu" data-testid="settings-owner-name-input" />
              <p className="text-[11px] text-muted-foreground">Dipakai untuk sapaan personal di Dashboard.</p>
            </div>
            <Button
              size="sm"
              onClick={() => (name.trim().length >= 1 ? updateSettings.mutate({ owner_name: name.trim() }) : toast.error("Nama tidak boleh kosong."))}
              disabled={updateSettings.isPending}
              data-testid="settings-profile-save"
            >
              Simpan Profil
            </Button>
          </CardContent>
        </Card>

        <Card data-testid="theme-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">Tampilan</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            {(
              [
                { value: "light", label: "Terang", icon: Sun },
                { value: "dark", label: "Gelap", icon: Moon },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => applyTheme(option.value)}
                data-testid={`theme-option-${option.value}`}
                className={cn(
                  "flex flex-1 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors duration-200",
                  settings?.theme === option.value ? "border-[#9B8264] bg-[#E9E1D5] text-[#2D261E]" : "border-border bg-card hover:bg-secondary",
                )}
              >
                <option.icon className="size-4" /> {option.label}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card data-testid="preferences-card">
          <CardHeader>
            <CardTitle className="font-heading text-base">Preferensi Aplikasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Jumlah default generate</Label>
                <Select value={quantity} onValueChange={setQuantity}>
                  <SelectTrigger data-testid="settings-quantity-select">
                    <SelectValue>{quantity} gambar</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {["1", "2", "4", "8"].map((q) => (
                      <SelectItem key={q} value={q}>
                        {q} gambar
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Rasio default</Label>
                <Select value={aspect} onValueChange={setAspect}>
                  <SelectTrigger data-testid="settings-aspect-select">
                    <SelectValue>{aspect}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Anggaran pengeluaran bulanan (Rp)</Label>
              <Input type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="cth. 2000000" data-testid="settings-budget-input" />
              {Number(budget) > 0 ? <p className="text-[11px] text-muted-foreground">Setara {formatIDR(Number(budget))}</p> : null}
            </div>
            <Button
              size="sm"
              onClick={() =>
                updateSettings.mutate({
                  default_quantity: Number(quantity) || 2,
                  default_aspect: aspect,
                  monthly_budget: Number(budget) || 0,
                })
              }
              disabled={updateSettings.isPending}
              data-testid="settings-preferences-save"
            >
              Simpan Preferensi
            </Button>
          </CardContent>
        </Card>

        <Card data-testid="ai-provider-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <ShieldCheck className="size-4 text-[#9B8264]" /> AI Provider & Status Koneksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <dt className="text-muted-foreground">Provider gambar</dt>
                <dd className="font-medium" data-testid="provider-value">
                  {aiStatus?.provider === "gemini" ? "Gemini Image (nyata)" : "Mode Demo (mock)"}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <dt className="text-muted-foreground">Model</dt>
                <dd className="font-mono text-xs" data-testid="provider-model-value">
                  {aiStatus?.image_model ?? "-"}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <dt className="text-muted-foreground">API key</dt>
                <dd className="font-medium" data-testid="provider-key-value">
                  {aiStatus?.key_configured ? "Terpasang" : "Belum dipasang"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Koneksi API backend</dt>
                <dd
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                    apiConnected ? "bg-[#EEF5F0] text-[#1C5B32]" : "bg-[#FBF0ED] text-[#8A3A28]",
                  )}
                  data-testid="api-connection-value"
                >
                  <Plug className="size-3" /> {apiConnected ? "Terhubung" : "Terputus"}
                </dd>
              </div>
            </dl>
            <p className="mt-3 rounded-xl bg-secondary p-3 text-[11px] leading-relaxed text-muted-foreground">
              {aiStatus?.provider === "gemini"
                ? "Generasi gambar memakai Gemini Image via server (kunci tidak pernah ada di browser). Hasil tanpa label DEMO."
                : "Belum ada kunci AI: aplikasi berjalan dalam Mode Demo. Hasil tetap bisa dibuat dan diberi label DEMO. Kunci diatur lewat environment variable EMERGENT_LLM_KEY di server - tidak pernah lewat browser."}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="account-card" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base">Akun</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              forshea.gen berjalan dalam <strong>mode personal tunggal</strong> - tanpa login, semua data milikmu dan
              tersimpan di database pribadi. Struktur data sudah memakai <span className="font-mono text-xs">owner_id</span>,
              sehingga login multi-akun bisa ditambahkan tanpa membangun ulang aplikasi.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
