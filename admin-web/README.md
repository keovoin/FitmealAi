# FitMeal Admin (Web)

Next.js 15 admin CMS for FitMeal AI. Same dark glassmorphism as the iOS app.

## Run locally

Requires Node 20+.

```bash
cd admin-web
npm install
cp .env.example .env.local        # set ADMIN_PASSWORD if you want a custom one
npm run dev
```

Open http://localhost:3000. Default password is `fitmeal-admin`.

## What it does today

- **Dashboard** — KPIs (users, active subs, pending payments, MRR), weekly signups chart, plan-mix breakdown, top of the pending-payments queue.
- **Payments** — Pending/Approved/Rejected/All tabs, search by user or transaction ID, detail page with approve/reject actions and reviewer notes.
- **Users** — Filter by tier and status, search by name/email/phone, detail page with payment history and subscription list.
- **Subscriptions** — All active/past-due/canceled subs, MRR rollup, source (StoreKit vs ABA manual).
- **Settings** — Auth status, data-source notes, planned features.

## What it does NOT do yet

- No real backend. Everything reads from `src/data/mock-*.ts`. Approve/reject decisions in the Payments review panel only update local state.
- No real auth. One shared password gates the whole app via cookie + middleware.
- No content library, no analytics deep dive, no push notifications.

These all show up after the shared backend lands (next phase).

## File map

```
admin-web/
  src/
    app/
      layout.tsx                 # html shell
      globals.css                # tailwind + glass utilities
      login/                     # public login screen
      api/                       # login + logout routes
      (admin)/                   # protected route group
        layout.tsx               # sidebar shell, redirects to /login
        page.tsx                 # dashboard
        payments/
          page.tsx               # queue
          [id]/page.tsx          # review screen + decision
        users/
          page.tsx               # list + filters
          [id]/page.tsx          # profile
        subscriptions/page.tsx
        settings/page.tsx
    components/
      layout/                    # PageShell, TopBar, Sidebar
      ui/                        # GlassCard, Button, Badge, DataTable, ...
      domain/                    # TierBadge, PaymentStatusBadge, ...
    data/                        # mock fixtures + types
    lib/                         # cn(), format(), auth()
    middleware.ts                # auth gate
  tailwind.config.ts             # mirrors iOS AppTheme tokens
  package.json
```

## Brand alignment

The Tailwind theme in `tailwind.config.ts` mirrors the iOS `AppTheme`
(same gradient stops, accent colors, glass treatment) so screenshots
of the admin and the app look like one product.
