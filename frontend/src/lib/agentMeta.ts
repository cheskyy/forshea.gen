import { BookOpen, Camera, CalendarCheck, Lightbulb, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AgentMeta {
  id: string;
  name: string;
  tagline: string;
  path: string;
  icon: LucideIcon;
  features: string[];
}

export const AGENTS: AgentMeta[] = [
  {
    id: "studio",
    name: "AI Product Studio",
    tagline: "Generator foto produk profesional untuk katalog Shopee dari foto asli kamu",
    path: "/studio",
    icon: Camera,
    features: ["6 kategori produk", "Upload multi-sudut", "Gaya foto & preset latar", "Galeri hasil + proyek"],
  },
  {
    id: "daily",
    name: "Daily Assistant",
    tagline: "Kelola tugas harian, pengingat, dan catatan produktivitas",
    path: "/agents/daily",
    icon: CalendarCheck,
    features: ["Daftar tugas", "Prioritas", "Kalender & catatan harian"],
  },
  {
    id: "finance",
    name: "Finance Assistant",
    tagline: "Catat pemasukan, pengeluaran, dan pantau anggaran bulanan",
    path: "/agents/finance",
    icon: Wallet,
    features: ["Transaksi (Rp)", "Anggaran bulanan", "Grafik mingguan"],
  },
  {
    id: "learning",
    name: "Learning Assistant",
    tagline: "Tetapkan tujuan belajar, pantau progres, dan minta penjelasan AI",
    path: "/agents/learning",
    icon: BookOpen,
    features: ["Tujuan belajar", "Progres %", "Penjelasan AI"],
  },
  {
    id: "creative",
    name: "Creative Assistant",
    tagline: "Simpan ide, brainstorm, dan buat caption produk dengan AI",
    path: "/agents/creative",
    icon: Lightbulb,
    features: ["Bank ide", "Caption AI", "Rencana konten"],
  },
];
