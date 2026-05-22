# Admin Web (Next.js CMS)

Lives at `admin-web/`. Internal-only web app for users, payments, and subscriptions. **Not** distributed via the App Store.

Always:
- Next.js 15 App Router with TypeScript strict mode
- TailwindCSS for styling, no CSS-in-JS
- Server components by default; client components only when needed (forms, charts, interactive review panels)
- Reuse the small UI primitives in `src/components/ui/` (Button, Badge, GlassCard, DataTable, StatTile, Avatar, EmptyState)
- Reuse domain components in `src/components/domain/` (TierBadge, PaymentStatusBadge, UserStatusBadge)
- Mirror iOS `AppTheme` colors via `tailwind.config.ts`

Never:
- Add backend keys to the client bundle
- Render real user PII (we use mock data fixtures during Phase 3)
- Treat the admin password as real auth - it's a Phase-3 stub
- Build admin features for the iOS app itself (admin is web-only, ever)

Routing:
- `/login` is public
- Everything under `(admin)` route group is protected by `middleware.ts` + `isAuthenticated()`
- Logout via `/api/logout`

Data:
- All data lives in `src/data/mock-*.ts` and is typed in `src/data/types.ts`
- Types are shaped to match what a future backend should return - they intentionally extend the iOS `Core/Models/` shapes

Reviewing payments:
- Approve/reject decisions in `payments/[id]/review-panel.tsx` are local-state only until the backend lands
- Always disable Approve when no screenshot is attached
