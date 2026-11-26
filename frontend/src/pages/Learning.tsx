import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, Plus, Sparkles, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog, DemoChip, EmptyState, PageHeader } from "@/components/shared";
import type { ExplainResult, LearningGoal } from "@/lib/types";

export default function Learning() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LearningGoal | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");
  const [progressEdits, setProgressEdits] = useState<Record<string, number>>({});
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("pemula");
  const [explanation, setExplanation] = useState<ExplainResult | null>(null);
  const [explaining, setExplaining] = useState(false);

  const { data: goals = [] } = useQuery({ queryKey: ["goals"], queryFn: () => apiGet<LearningGoal[]>("/learning-goals") });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["goals"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["activities"] });
  };

  const addGoal = useMutation({
    mutationFn: () => apiPost<LearningGoal>("/learning-goals", { title: title.trim(), subject, target_date: targetDate, notes }),
    onSuccess: () => {
      toast.success("Tujuan belajar dibuat.");
      setDialogOpen(false);
      setTitle("");
      setSubject("");
      setTargetDate("");
      setNotes("");
      invalidate();
    },
    onError: () => toast.error("Gagal membuat tujuan."),
  });

  const patchGoal = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { progress?: number } }) => apiPatch<LearningGoal>(`/learning-goals/${id}`, body),
    onSuccess: invalidate,
    onError: () => toast.error("Gagal memperbarui progres."),
  });

  const deleteGoal = useMutation({
    mutationFn: (id: string) => apiDelete(`/learning-goals/${id}`),
    onSuccess: () => {
      toast.success("Tujuan dihapus.");
      invalidate();
    },
    onError: () => toast.error("Gagal menghapus tujuan."),
  });

  const explain = async () => {
    if (topic.trim().length < 2) return toast.error("Tulis topiknya dulu.");
    setExplaining(true);
    setExplanation(null);
    try {
      const result = await apiPost<ExplainResult>("/ai/explain", { topic: topic.trim(), level });
      setExplanation(result);
    } catch {
      toast.error("Gagal meminta penjelasan. Coba lagi.");
    } finally {
      setExplaining(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Learning Assistant" description="Tetapkan tujuan belajar, pantau progres, dan minta penjelasan AI.">
        <Button size="sm" onClick={() => setDialogOpen(true)} data-testid="add-goal-btn">
          <Plus className="size-4" /> Tujuan Baru
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-7" data-testid="goal-list">
          {goals.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Belum ada tujuan belajar"
              description="Buat tujuan pertamamu - misalnya 'Belajar foto produk Flat Lay' - lalu pantau progresnya di sini."
            >
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="size-4" /> Buat Tujuan
              </Button>
            </EmptyState>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {goals.map((goal) => {
                const progress = progressEdits[goal.id] ?? goal.progress;
                return (
                  <Card key={goal.id} data-testid={`goal-card-${goal.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="font-heading text-base">{goal.title}</CardTitle>
                        <Button size="icon-xs" variant="ghost" onClick={() => setDeleteTarget(goal)} data-testid={`goal-delete-${goal.id}`}>
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        {goal.subject ? <span className="rounded-full bg-[#F4EFEA] px-2 py-0.5 text-[#5A4E3E]">{goal.subject}</span> : null}
                        {goal.target_date ? <span>Target: {goal.target_date}</span> : null}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progres</span>
                        <span className="font-semibold text-foreground" data-testid={`goal-progress-label-${goal.id}`}>
                          {progress}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={progress}
                        onChange={(e) => setProgressEdits((prev) => ({ ...prev, [goal.id]: Number(e.target.value) }))}
                        onPointerUp={() => patchGoal.mutate({ id: goal.id, body: { progress } })}
                        onBlur={() => progress !== goal.progress && patchGoal.mutate({ id: goal.id, body: { progress } })}
                        data-testid={`goal-progress-slider-${goal.id}`}
                        className="mt-2 w-full accent-[#9B8264]"
                      />
                      {goal.notes ? <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{goal.notes}</p> : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-5 h-fit" data-testid="ai-explain-card">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#9B8264]" strokeWidth={1.8} />
            <h2 className="font-heading text-lg font-semibold">Penjelasan & Rangkuman AI</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Minta AI menjelaskan topik belajar dengan bahasa sederhana.</p>
          <div className="mt-3 space-y-3">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="cth. Cara komposisi flat lay yang bagus"
              data-testid="explain-topic-input"
            />
            <div className="flex gap-2">
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="w-40" data-testid="explain-level-select">
                  <SelectValue>{level === "pemula" ? "Pemula" : level === "menengah" ? "Menengah" : "Lanjutan"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pemula">Pemula</SelectItem>
                  <SelectItem value="menengah">Menengah</SelectItem>
                  <SelectItem value="lanjutan">Lanjutan</SelectItem>
                </SelectContent>
              </Select>
              <Button className="flex-1" onClick={explain} disabled={explaining} data-testid="explain-submit">
                {explaining ? "Memproses..." : "Jelaskan"}
              </Button>
            </div>
            {explanation ? (
              <div className="rounded-xl border border-border bg-secondary p-4" data-testid="explain-result">
                <div className="mb-2 flex items-center gap-2">
                  <DemoChip isMock={explanation.is_mock} />
                  <span className="text-[11px] text-muted-foreground">{explanation.is_mock ? "hasil demo" : "hasil AI nyata"}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{explanation.text}</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tujuan Belajar Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Judul</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="cth. Kuasai Flat Lay Photography" data-testid="goal-title-input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Subjek</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="cth. Fotografi" data-testid="goal-subject-input" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Target</Label>
                <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} data-testid="goal-target-input" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Catatan (opsional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Rencana belajar, sumber, dsb." data-testid="goal-notes-input" />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => (title.trim().length >= 2 ? addGoal.mutate() : toast.error("Judul minimal 2 karakter."))}
              disabled={addGoal.isPending}
              data-testid="goal-submit"
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus tujuan belajar ini?"
        description={deleteTarget ? `"${deleteTarget.title}" akan dihapus permanen.` : ""}
        onConfirm={() => deleteTarget && deleteGoal.mutate(deleteTarget.id)}
        testId="delete-goal"
      />
    </div>
  );
}
