import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lightbulb, Plus, Sparkles, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog, DemoChip, EmptyState, PageHeader } from "@/components/shared";
import { timeAgo } from "@/lib/format";
import type { CaptionResult, Idea, IdeaKind } from "@/lib/types";

const KIND_LABEL: Record<IdeaKind, string> = { brainstorm: "Brainstorm", caption: "Caption", konten: "Rencana Konten" };
const TONES = ["ramah", "profesional", "playful", "elegan", "lucu"];

export default function Creative() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Idea | null>(null);
  const [kind, setKind] = useState<IdeaKind>("brainstorm");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("ramah");
  const [caption, setCaption] = useState<CaptionResult | null>(null);
  const [generating, setGenerating] = useState(false);

  const { data: ideas = [] } = useQuery({ queryKey: ["ideas"], queryFn: () => apiGet<Idea[]>("/ideas") });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["ideas"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["activities"] });
  };

  const addIdea = useMutation({
    mutationFn: (body: { kind: IdeaKind; title: string; content: string }) => apiPost<Idea>("/ideas", body),
    onSuccess: () => {
      toast.success("Ide tersimpan.");
      invalidate();
    },
    onError: () => toast.error("Gagal menyimpan ide."),
  });

  const deleteIdea = useMutation({
    mutationFn: (id: string) => apiDelete(`/ideas/${id}`),
    onSuccess: () => {
      toast.success("Ide dihapus.");
      invalidate();
    },
    onError: () => toast.error("Gagal menghapus ide."),
  });

  const generateCaption = async () => {
    if (topic.trim().length < 2) return toast.error("Tulis topik produknya dulu.");
    setGenerating(true);
    setCaption(null);
    try {
      const result = await apiPost<CaptionResult>("/ai/caption", { topic: topic.trim(), tone });
      setCaption(result);
    } catch {
      toast.error("Gagal membuat caption. Coba lagi.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Creative Assistant" description="Bank ide, brainstorm, dan generator caption produk dengan AI.">
        <Button
          size="sm"
          onClick={() => {
            setKind("brainstorm");
            setTitle("");
            setContent("");
            setDialogOpen(true);
          }}
          data-testid="add-idea-btn"
        >
          <Plus className="size-4" /> Ide Baru
        </Button>
      </PageHeader>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm" data-testid="caption-card">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[#9B8264]" strokeWidth={1.8} />
          <h2 className="font-heading text-lg font-semibold">Generator Caption Produk</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Tulis produk atau tema, pilih nuansa, dan dapatkan caption siap pakai untuk Shopee.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="cth. Gamis katun premium warna hitam"
            data-testid="caption-topic-input"
          />
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="sm:w-40" data-testid="caption-tone-select">
              <SelectValue>{tone}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TONES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={generateCaption} disabled={generating} data-testid="caption-submit">
            {generating ? "Menulis..." : "Buat Caption"}
          </Button>
        </div>
        {caption ? (
          <div className="mt-4 rounded-xl border border-border bg-secondary p-4" data-testid="caption-result">
            <div className="mb-2 flex items-center gap-2">
              <DemoChip isMock={caption.is_mock} />
              <span className="text-[11px] text-muted-foreground">{caption.is_mock ? "hasil demo" : "hasil AI nyata"}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{caption.text}</p>
            {caption.hashtags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {caption.hashtags.map((tag) => (
                  <span key={tag} className="rounded-full bg-[#F4EFEA] px-2 py-0.5 text-[11px] font-medium text-[#5A4E3E]">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => addIdea.mutate({ kind: "caption", title: topic.trim(), content: `${caption.text}\n\n${caption.hashtags.join(" ")}` })}
              data-testid="caption-save-idea"
            >
              Simpan sebagai Ide
            </Button>
          </div>
        ) : null}
      </section>

      <section data-testid="idea-list">
        <h2 className="mb-3 font-heading text-lg font-semibold">Bank Ide ({ideas.length})</h2>
        {ideas.length === 0 ? (
          <EmptyState
            icon={Lightbulb}
            title="Belum ada ide"
            description="Simpan ide brainstorm, caption, atau rencana konten agar tidak hilang."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ideas.map((idea) => (
              <article
                key={idea.id}
                data-testid={`idea-card-${idea.id}`}
                className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-[#F4EFEA] px-2.5 py-0.5 text-[11px] font-medium text-[#5A4E3E]">
                    {KIND_LABEL[idea.kind] ?? idea.kind}
                  </span>
                  <Button size="icon-xs" variant="ghost" onClick={() => setDeleteTarget(idea)} data-testid={`idea-delete-${idea.id}`}>
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
                <h3 className="mt-3 font-heading text-base font-semibold text-foreground">{idea.title}</h3>
                <p className="mt-1 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{idea.content}</p>
                <p className="mt-3 text-[11px] text-muted-foreground">{timeAgo(idea.created_at)}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ide Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Jenis</Label>
              <Select value={kind} onValueChange={(value: string) => setKind(value as IdeaKind)}>
                <SelectTrigger data-testid="idea-kind-select">
                  <SelectValue>{KIND_LABEL[kind]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brainstorm">Brainstorm</SelectItem>
                  <SelectItem value="caption">Caption</SelectItem>
                  <SelectItem value="konten">Rencana Konten</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Judul</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="cth. Ide konten promo gajian" data-testid="idea-title-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Isi</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="Tulis idemu..." data-testid="idea-content-input" />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (title.trim().length < 2) return toast.error("Judul minimal 2 karakter.");
                addIdea.mutate({ kind, title: title.trim(), content });
                setDialogOpen(false);
              }}
              disabled={addIdea.isPending}
              data-testid="idea-submit"
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus ide ini?"
        description={deleteTarget ? `"${deleteTarget.title}" akan dihapus permanen.` : ""}
        onConfirm={() => deleteTarget && deleteIdea.mutate(deleteTarget.id)}
        testId="delete-idea"
      />
    </div>
  );
}
