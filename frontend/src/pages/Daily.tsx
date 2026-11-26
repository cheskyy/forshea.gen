import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Bell, CalendarCheck, NotebookPen, Plus, StickyNote, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog, EmptyState, PageHeader } from "@/components/shared";
import { todayWIB } from "@/lib/format";
import type { DailyNote, Task, TaskPriority } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIORITY_LABEL: Record<TaskPriority, string> = { tinggi: "Tinggi", sedang: "Sedang", rendah: "Rendah" };
const PRIORITY_ORDER: Record<TaskPriority, number> = { tinggi: 0, sedang: 1, rendah: 2 };

export default function Daily() {
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(`${todayWIB()}T00:00:00`));
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("sedang");
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [note, setNote] = useState("");

  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : todayWIB();

  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => apiGet<Task[]>("/tasks") });
  const { data: noteDoc } = useQuery({
    queryKey: ["note", dateStr],
    queryFn: () => apiGet<DailyNote>(`/notes/${dateStr}`),
  });

  const tasksForDay = useMemo(() => tasks.filter((t) => t.due_date === dateStr), [tasks, dateStr]);
  const doneCount = tasksForDay.filter((t) => t.done).length;
  const pct = tasksForDay.length > 0 ? Math.round((doneCount / tasksForDay.length) * 100) : 0;
  const reminders = useMemo(
    () =>
      tasks
        .filter((t) => !t.done && t.due_date <= todayWIB())
        .sort((a, b) => a.due_date.localeCompare(b.due_date) || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
        .slice(0, 5),
    [tasks],
  );

  const invalidateTasks = () => {
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["activities"] });
  };

  const addTask = useMutation({
    mutationFn: () => apiPost<Task>("/tasks", { title: newTitle.trim(), priority: newPriority, due_date: dateStr }),
    onSuccess: () => {
      setNewTitle("");
      toast.success("Tugas ditambahkan.");
      invalidateTasks();
    },
    onError: () => toast.error("Gagal menambah tugas."),
  });

  const toggleTask = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => apiPatch<Task>(`/tasks/${id}`, { done }),
    onSuccess: invalidateTasks,
    onError: () => toast.error("Gagal memperbarui tugas."),
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => apiDelete(`/tasks/${id}`),
    onSuccess: () => {
      toast.success("Tugas dihapus.");
      invalidateTasks();
    },
    onError: () => toast.error("Gagal menghapus tugas."),
  });

  const saveNote = useMutation({
    mutationFn: () => apiPut<DailyNote>(`/notes/${dateStr}`, { content: note }),
    onSuccess: () => toast.success("Catatan harian tersimpan."),
    onError: () => toast.error("Gagal menyimpan catatan."),
  });

  const noteValue = note || noteDoc?.content || "";

  return (
    <div className="space-y-6">
      <PageHeader title="Daily Assistant" description="Kelola tugas harian, prioritas, pengingat, dan catatan produktivitasmu." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <Card data-testid="calendar-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-base">
                <CalendarCheck className="size-4 text-[#9B8264]" /> Kalender
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => {
                  setSelectedDate(d ?? undefined);
                  setNote("");
                }}
                locale={localeId}
                className="mx-auto w-fit"
                data-testid="daily-calendar"
              />
            </CardContent>
          </Card>

          <Card data-testid="daily-note-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-base">
                <StickyNote className="size-4 text-[#9B8264]" /> Catatan Harian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={noteValue}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Tulis catatan, ide cepat, atau hal penting hari ini..."
                data-testid="daily-note-input"
              />
              <Button size="sm" onClick={() => saveNote.mutate()} disabled={saveNote.isPending} data-testid="daily-note-save">
                <NotebookPen className="size-4" /> Simpan Catatan
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-7">
          <Card data-testid="add-task-card">
            <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs font-medium">Tugas baru ({format(selectedDate ?? new Date(), "dd MMM yyyy", { locale: localeId })})</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && newTitle.trim().length >= 2 && addTask.mutate()}
                  placeholder="cth. Upload 5 foto produk ke Shopee"
                  data-testid="task-title-input"
                />
              </div>
              <div className="space-y-1.5 sm:w-36">
                <Label className="text-xs font-medium">Prioritas</Label>
                <Select value={newPriority} onValueChange={(value: string) => setNewPriority(value as TaskPriority)}>
                  <SelectTrigger data-testid="task-priority-select">
                    <SelectValue>{PRIORITY_LABEL[newPriority]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tinggi">Tinggi</SelectItem>
                    <SelectItem value="sedang">Sedang</SelectItem>
                    <SelectItem value="rendah">Rendah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => (newTitle.trim().length >= 2 ? addTask.mutate() : toast.error("Judul tugas minimal 2 karakter."))}
                disabled={addTask.isPending}
                data-testid="task-add-btn"
              >
                <Plus className="size-4" /> Tambah
              </Button>
            </CardContent>
          </Card>

          {reminders.length > 0 ? (
            <Card data-testid="reminders-card" className="border-[#E2D3B8] bg-[#F3EBDD]/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                  <Bell className="size-4 text-[#7A4D14]" /> Pengingat ({reminders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {reminders.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    <span className="size-1.5 shrink-0 rounded-full bg-[#C07616]" />
                    <span className="flex-1 truncate text-foreground">{task.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{task.due_date === todayWIB() ? "Hari ini" : task.due_date}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card data-testid="task-list-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading text-base">Daftar Tugas</CardTitle>
                <span className="text-xs text-muted-foreground" data-testid="task-progress-label">
                  {doneCount}/{tasksForDay.length} selesai
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-[#9B8264] transition-all duration-300" style={{ width: `${pct}%` }} data-testid="task-progress-bar" />
              </div>
            </CardHeader>
            <CardContent>
              {tasksForDay.length === 0 ? (
                <EmptyState icon={CalendarCheck} title="Belum ada tugas" description="Tambahkan tugas pertamamu untuk tanggal yang dipilih." />
              ) : (
                <ul className="space-y-2" data-testid="task-list">
                  {tasksForDay
                    .slice()
                    .sort((a, b) => Number(a.done) - Number(b.done) || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
                    .map((task) => (
                      <li
                        key={task.id}
                        className="flex items-center gap-3 rounded-xl border border-border bg-background px-3.5 py-3"
                        data-testid={`task-item-${task.id}`}
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={(e) => toggleTask.mutate({ id: task.id, done: e.target.checked })}
                          data-testid={`task-check-${task.id}`}
                          className="size-4 cursor-pointer accent-[#9B8264]"
                        />
                        <span className={cn("flex-1 text-sm", task.done ? "text-muted-foreground line-through" : "text-foreground")}>
                          {task.title}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            task.priority === "tinggi"
                              ? "bg-[#FBF0ED] text-[#8A3A28]"
                              : task.priority === "sedang"
                                ? "bg-[#F3EBDD] text-[#7A4D14]"
                                : "bg-secondary text-muted-foreground",
                          )}
                        >
                          {PRIORITY_LABEL[task.priority]}
                        </span>
                        <Button size="icon-xs" variant="ghost" onClick={() => setDeleteTarget(task)} data-testid={`task-delete-${task.id}`}>
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </li>
                    ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus tugas ini?"
        description={deleteTarget ? `"${deleteTarget.title}" akan dihapus permanen.` : ""}
        onConfirm={() => deleteTarget && deleteTask.mutate(deleteTarget.id)}
        testId="delete-task"
      />
    </div>
  );
}
