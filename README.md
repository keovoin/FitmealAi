# FitMeal AI

iOS-first wellness app combining AI meal planning, AI workout planning, habit tracking, and progress dashboards. Free / Silver / Gold tiers, with both StoreKit and manual ABA payment paths.

## Repo layout

This is a **monorepo** with three loosely-coupled folders:

| Folder | What it is | How to run |
|---|---|---|
| [`FitMealAI/`](./FitMealAI/) | iOS SwiftUI app (the production product) | Xcode 15+, iOS 17+. See [FitMealAI/README.md](./FitMealAI/README.md). |
| [`android/`](./android/) | Android A1 foundation (Kotlin + Jetpack Compose) | Open in Android Studio. See [android/README.md](./android/README.md). |
| [`admin-web/`](./admin-web/) | Next.js 15 admin CMS (internal-only web UI) | `cd admin-web && npm install && npm run dev`. See [admin-web/README.md](./admin-web/README.md). |
| [`supabase/`](./supabase/) | SQL migrations for Postgres + Storage policies | Apply via Supabase SQL Editor. See [supabase/README.md](./supabase/README.md). |
| `src/` (legacy) | React/Vite Figma Make export. Visual reference only. | `npm install && npm run dev`. Frozen — not the production app. |

## Folder ownership

To keep the iOS work safe from accidental overwrites, these paths are owned by specific workstreams:

- `FitMealAI/` and `.kiro/` — iOS workstream (Swift, MVVM, iOS 17+)
- `android/` — Android workstream (Kotlin, Jetpack Compose)
- `admin-web/` — admin CMS workstream (Next.js, Tailwind, TypeScript)
- `src/` — paused Figma Make export, design reference only

## Where to look first

- Want to see the iOS code? Start at [`FitMealAI/App/RootView.swift`](./FitMealAI/App/RootView.swift) — it now routes the real app flow.
- Want to run the admin? `cd admin-web && yarn install && yarn dev`. Local fallback password is `dev-only-password-please-change`; hosted admin uses `ADMIN_PASSWORD`.
- **Want to deploy the admin to Vercel without installing anything locally?** See [`admin-web/DEPLOY.md`](./admin-web/DEPLOY.md). The key step is setting the **Root Directory** to `admin-web` during import — without that, Vercel will try to build the legacy Vite project at the repo root.
- Want to read the spec? See [`.kiro/specs/figma-to-swiftui/requirements.md`](./.kiro/specs/figma-to-swiftui/requirements.md) and [`tasks.md`](./.kiro/specs/figma-to-swiftui/tasks.md).

## Roadmap

- **Phase 1** — Foundation (design system, models, mocks). Done.
- **Phase 2** — All 17 iOS screens with MVVM and previews. Done.
- **Phase 3a** — Admin CMS scaffold. Done.
- **Phase 4a** — Supabase schema + admin wiring (this PR). Done.
- **Phase 4b** — AI meal generation endpoint with rate limits + image caching. Done.
- **Phase 4c** — iOS auth (Supabase) + AI service integration. Done.
- **Phase 4d** — Real iOS navigation shell and app flow. Done.
- **Phase 4e** — Animation/layout polish. In progress: global premium emerald theme + screen entrance polish done.
- **Phase 5** — Preview and QA, then Android planning/port (Jetpack Compose, reusing the same domain shapes).
- **Android A1** — Compose project shell, theme, models, mock data, and starter flow. Done.
