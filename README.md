# forshea.gen — Your Personal AI Agent

Platform asisten AI personal. Fitur utama: **AI Product Studio**, generator foto produk
profesional (untuk katalog Shopee) dari foto produk asli, ditambah Daily, Finance,
Learning, dan Creative Assistant.

## Stack
- **Backend:** FastAPI + MongoDB (motor) + Pydantic v2, di folder `backend/`
- **Frontend:** Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui, di folder `frontend/`
- **AI:** abstraksi provider di `backend/lib/ai.py`. Pakai Gemini Image kalau `EMERGENT_LLM_KEY`
  terisi; kalau kosong, otomatis **Mode Demo** (hasil berlabel DEMO, bukan gambar AI).

## Menjalankan secara lokal
Butuh: Python 3.11+, Node 20+, Yarn, dan MongoDB yang sedang berjalan.

```bash
# 1. Backend
cd backend
cp .env.example .env              # isi nilai sesuai kebutuhan
pip install -r requirements.txt
python seed.py                    # isi 6 kategori produk + pengaturan awal
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# 2. Frontend (terminal lain)
cd frontend
yarn install
yarn dev                          # buka http://localhost:3000
```

Frontend memanggil `/api/...` secara relatif; Vite meneruskannya ke backend di port 8001
(lihat `frontend/vite.config.ts`).

> Catatan: paket `emergentintegrations` dipasang dari
> `pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/`.

## Struktur
```
backend/
  server.py          # app FastAPI, semua router di bawah /api
  lib/ai.py          # provider AI (Gemini / Demo), prompt fidelity produk
  lib/db.py          # koneksi Mongo + index
  models/            # model Pydantic
  routers/           # studio, media, categories, workspace, tasks, finance, learning, creative, system
  seed.py            # data awal
frontend/src/
  pages/             # Dashboard, Studio, AgentsDirectory, Daily, Finance, Learning, Creative, Workspace, Settings
  components/studio/ # komponen AI Product Studio
  components/layout/ # AppShell (sidebar, header, navigasi mobile)
  lib/               # api.ts, types.ts, studioMeta.ts, agentMeta.ts, format.ts
memory/SPEC.md       # spesifikasi aplikasi lengkap
```

## Keamanan
- API key hanya dibaca di server lewat environment variable; tidak pernah dikirim ke browser.
- File `.env` tidak ikut disimpan ke repository; gunakan `.env.example` sebagai contoh.
