# forshea.gen — App Spec

## Identity
- **forshea.gen** — "Your Personal AI Agent". Personal AI assistant platform (NOT a shop/brand).
- Owner use-case: generate professional product photos from real product photos, for Shopee listings.
- UI language: Indonesian (+ English tech terms). Timezone: Asia/Jakarta (WIB) via `APP_TZ` env.
- No login (single-user personal mode). All docs carry `owner_id: "local"` — auth can slot in later without rebuild.

## Stack (template)
- Backend: FastAPI + motor (MongoDB) on :8001, all routes on `api_router` under `/api` (see backend/server.py).
- Frontend: Vite + React 19 + TS strict + Tailwind v4 + shadcn/ui (base-nova) on :3000, relative `/api` calls via `src/lib/api.ts`, TanStack Query.
- Fonts: Outfit (headings), Plus Jakarta Sans (body), IBM Plex Mono (clock/mono). Warm palette: beige #E9E1D5 / cream #F8F5F0 / brown #9B8264 / charcoal #252525 / off-white #FCFBF9.

## AI provider architecture (backend/lib/ai.py)
- Real provider: Gemini image model `gemini-3.1-flash-image-preview` via `emergentintegrations` LlmChat, key = `EMERGENT_LLM_KEY` in backend/.env (Emergent universal key, server-side only).
- `provider_name()` → "gemini" when key present, else "demo".
- Demo/mock mode: elegant SVG placeholders clearly labeled "HASIL DEMO — BUKAN GAMBAR AI" (demo_product_svg). Chat AI (caption/explain) falls back to labeled demo text.
- Prompt builder enforces product-fidelity rules per category group (clothing/baby/general): preserve colors, pattern, texture, shape, proportions, logos; never invent features.

## Pages (frontend/src/pages)
- `/` Dashboard: greeting (by hour, owner name from settings), WIB clock, stat cards, quick agent grid, recent creations (real generated images), recent activities, assistant shortcut input (routes by keyword).
- `/agents` directory of 5 agents → `/studio`, `/agents/daily`, `/agents/finance`, `/agents/learning`, `/agents/creative`.
- `/studio` AI Product Studio: 5-step wizard (Kategori → Upload Foto → Spesifikasi → Gaya Foto → Latar & Scene) + sticky Generation Inspector (quantity 1/2/4/8 + Generate). Upload slots: front/side/top/bottom/detail + 4 optional refs (lighting/background/props/composition); drag&drop or browse; per-slot replace/remove; PNG/JPG/WebP ≤ 6MB; required slots configurable per category (`required_slots`). SOURCE OF TRUTH card on spec step. Generation = background job (POST /api/generate → poll GET /api/generate/{id}); result gallery with fullscreen zoom, download, favorite, delete, save-to-project, compare originals vs results, view settings, regenerate.
- `/agents/daily`: calendar (react-day-picker), per-day task CRUD with priority, reminders (due ≤ today), progress bar, daily notes.
- `/agents/finance`: transaction CRUD (income/expense, IDR), monthly budget progress, weekly bar chart + category pie (recharts), transaction table.
- `/agents/learning`: goal CRUD with progress slider, AI explain dialog (labeled demo when mock).
- `/agents/creative`: idea CRUD (brainstorm/caption/konten), AI caption generator with hashtags (labeled demo when mock), save caption as idea.
- `/workspace`: tabs — Galeri Hasil, Favorit, Proyek (create/assign/detach/delete), File Terunggah, Riwayat.
- `/settings`: profile name, light/dark theme, defaults (quantity/aspect/budget), AI provider status + API connection status, account info.

## Data (Mongo, db "app", all ids = uuid4 strings)
Collections: categories (seeded 6: Baby Clothing, Women's Fashion, Baby Essentials, Fashion Accessories, Home & Living, Other Products; custom categories appendable via UI/API), uploads (base64 image bytes), products, generation_jobs, images (base64 bytes, favorite, project_id, is_mock, created_date), projects, activities (feed), tasks, daily_notes, transactions, learning_goals, ideas, settings (singleton id "local": owner_name/theme/default_quantity/default_aspect/monthly_budget).
Images served as binary: `/api/uploads/{id}/file`, `/api/images/{id}/file` (immutable cache header).

## Seed facts (after `cd /app/backend && python seed.py`)
- 6 product categories as above (upsert by slug — idempotent).
- Settings singleton: owner_name "Forshea", theme light, default_quantity 2, default_aspect "1:1", monthly_budget 0.
- One welcome activity + three REAL Gemini-generated samples ("Romper Katun Bayi" + "Romper Katun Bayi Premium",
  Baby Clothing, Flat Lay / Beige Minimalist) from pipeline verification — safe to keep as example data.

## Credentials
None — the app has no login. Backend key `EMERGENT_LLM_KEY` lives only in backend/.env (server-side).
