import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Cell, Pie, PieChart, ResponsiveContainer, Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { Plus, TrendingDown, TrendingUp, Trash2, Wallet } from "lucide-react";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog, EmptyState, PageHeader, StatCard } from "@/components/shared";
import { formatIDR, todayWIB } from "@/lib/format";
import type { FinanceSummary, Transaction, TxnType, UserSettings } from "@/lib/types";

const INCOME_CATEGORIES = ["Penjualan Produk", "Lainnya"];
const EXPENSE_CATEGORIES = ["Bahan Baku", "Iklan & Promosi", "Pengiriman", "Peralatan", "Lainnya"];
const PIE_COLORS = ["#9B8264", "#C9A87C", "#7C6348", "#5A4E3E", "#D0654D", "#D9CEBF"];

export default function Finance() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [type, setType] = useState<TxnType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayWIB());

  const { data: summary } = useQuery({ queryKey: ["finance-summary"], queryFn: () => apiGet<FinanceSummary>("/finance/summary") });
  const { data: transactions = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => apiGet<Transaction[]>("/transactions") });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => apiGet<UserSettings>("/settings") });

  const savings = (summary?.income_month ?? 0) - (summary?.expense_month ?? 0);
  const budget = settings?.monthly_budget ?? 0;
  const budgetPct = budget > 0 ? Math.min(100, Math.round(((summary?.expense_month ?? 0) / budget) * 100)) : 0;

  const expensePie = useMemo(() => summary?.by_category.filter((c) => c.type === "expense").slice(0, 6) ?? [], [summary]);

  const addTxn = useMutation({
    mutationFn: () =>
      apiPost<Transaction>("/transactions", {
        type,
        amount: Number(amount),
        category,
        note,
        occurred_date: date,
      }),
    onSuccess: () => {
      toast.success("Transaksi tercatat.");
      setDialogOpen(false);
      setAmount("");
      setNote("");
      qc.invalidateQueries({ queryKey: ["finance-summary"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: () => toast.error("Gagal menyimpan transaksi."),
  });

  const deleteTxn = useMutation({
    mutationFn: (id: string) => apiDelete(`/transactions/${id}`),
    onSuccess: () => {
      toast.success("Transaksi dihapus.");
      qc.invalidateQueries({ queryKey: ["finance-summary"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: () => toast.error("Gagal menghapus transaksi."),
  });

  const openDialog = (t: TxnType) => {
    setType(t);
    setCategory(t === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    setDate(todayWIB());
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Finance Assistant" description="Catat pemasukan & pengeluaran, pantau anggaran, dan lihat ringkasan visual.">
        <Button variant="outline" size="sm" onClick={() => openDialog("income")} data-testid="add-income-btn">
          <TrendingUpIcon /> Pemasukan
        </Button>
        <Button size="sm" onClick={() => openDialog("expense")} data-testid="add-expense-btn">
          <TrendingDown className="size-4" /> Pengeluaran
        </Button>
      </PageHeader>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="finance-stats">
        <StatCard icon={TrendingUp} label="Pemasukan Bulan Ini" value={formatIDR(summary?.income_month ?? 0)} />
        <StatCard icon={TrendingDown} label="Pengeluaran Bulan Ini" value={formatIDR(summary?.expense_month ?? 0)} />
        <StatCard icon={Wallet} label="Selisih (Tabungan)" value={formatIDR(savings)} sub="Pemasukan - pengeluaran bulan ini" />
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm" data-testid="budget-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="size-4 text-[#9B8264]" strokeWidth={1.8} />
            <span className="text-xs font-medium uppercase tracking-[0.14em]">Anggaran Bulanan</span>
          </div>
          <p className="mt-3 font-heading text-2xl font-semibold tracking-tight">{formatIDR(budget)}</p>
          {budget > 0 ? (
            <>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${budgetPct >= 100 ? "bg-[#D0654D]" : "bg-[#9B8264]"}`}
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{budgetPct}% terpakai</p>
            </>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Atur anggaran di halaman Pengaturan.</p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm xl:col-span-7" data-testid="weekly-chart-card">
          <h2 className="font-heading text-lg font-semibold">Ringkasan Mingguan</h2>
          <p className="text-xs text-muted-foreground">7 hari terakhir</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.weekly ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E5E0" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} width={40} />
                <Tooltip
                  formatter={(value: number) => formatIDR(value)}
                  cursor={{ fill: "rgba(155,130,100,0.08)" }}
                />
                <Bar dataKey="income" name="Pemasukan" fill="#9B8264" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#D0654D" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm xl:col-span-5" data-testid="category-chart-card">
          <h2 className="font-heading text-lg font-semibold">Pengeluaran per Kategori</h2>
          <p className="text-xs text-muted-foreground">Bulan ini</p>
          {expensePie.length > 0 ? (
            <>
              <div className="mx-auto mt-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expensePie} dataKey="total" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                      {expensePie.map((entry, i) => (
                        <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatIDR(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1.5">
                {expensePie.map((cat, i) => (
                  <li key={cat.name} className="flex items-center gap-2 text-sm">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="flex-1 text-muted-foreground">{cat.name}</span>
                    <span className="font-medium">{formatIDR(cat.total)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyState icon={Wallet} title="Belum ada pengeluaran" description="Catat pengeluaran pertamamu untuk melihat grafik kategori." />
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm" data-testid="transactions-card">
        <h2 className="font-heading text-lg font-semibold">Riwayat Transaksi</h2>
        {transactions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Belum ada transaksi. Klik "Pemasukan" atau "Pengeluaran" untuk mulai mencatat.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 12).map((txn) => (
                <TableRow key={txn.id} data-testid={`transaction-row-${txn.id}`}>
                  <TableCell className="text-muted-foreground">{txn.occurred_date}</TableCell>
                  <TableCell>{txn.category}</TableCell>
                  <TableCell className="max-w-40 truncate text-muted-foreground">{txn.note || "-"}</TableCell>
                  <TableCell className={`text-right font-medium ${txn.type === "income" ? "text-[#1C5B32]" : "text-[#8A3A28]"}`}>
                    {txn.type === "income" ? "+" : "-"}
                    {formatIDR(txn.amount)}
                  </TableCell>
                  <TableCell>
                    <Button size="icon-xs" variant="ghost" onClick={() => setDeleteTarget(txn)} data-testid={`transaction-delete-${txn.id}`}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{type === "income" ? "Catat Pemasukan" : "Catat Pengeluaran"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Jenis</Label>
                <Select value={type} onValueChange={(value: string) => setType(value as TxnType)}>
                  <SelectTrigger data-testid="txn-type-select">
                    <SelectValue>{type === "income" ? "Pemasukan" : "Pengeluaran"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Pemasukan</SelectItem>
                    <SelectItem value="expense">Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Jumlah (Rp)</Label>
                <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="150000" data-testid="txn-amount-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Kategori</Label>
                <Select value={category} onValueChange={(value: string) => setCategory(value)}>
                  <SelectTrigger data-testid="txn-category-select">
                    <SelectValue>{category}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tanggal</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="txn-date-input" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Catatan (opsional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="cth. Order Shopee #123" data-testid="txn-note-input" />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!(Number(amount) > 0)) return toast.error("Jumlah harus lebih dari 0.");
                addTxn.mutate();
              }}
              disabled={addTxn.isPending}
              data-testid="txn-submit"
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus transaksi ini?"
        description={deleteTarget ? `${deleteTarget.category} - ${formatIDR(deleteTarget.amount)} akan dihapus permanen.` : ""}
        onConfirm={() => deleteTarget && deleteTxn.mutate(deleteTarget.id)}
        testId="delete-transaction"
      />
    </div>
  );
}

function TrendingUpIcon() {
  return <TrendingUp className="size-4" />;
}
