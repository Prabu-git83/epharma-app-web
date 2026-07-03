# ePharma App — Web (epharma-app-web)

Grace Pharma Co. full-stack pharma delivery web application.
Companion repo: `Prabu-git83/epharma-app-mobile`

---

## Project Overview

A BlinkRx-style pharma delivery platform targeting US, India, UK, UAE
(Dubai, Bahrain, Abu Dhabi), Singapore, and Malaysia. Solo developer
project built with Next.js, Supabase, and TypeScript.

**Live URL:** https://epharma.vercel.app  
**GitHub:** https://github.com/Prabu-git83/epharma-app-web  
**Supabase project:** (set NEXT_PUBLIC_SUPABASE_URL in .env.local)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth — email OTP only |
| Storage | Supabase Storage (prescription images, private bucket) |
| Email | Resend (order confirmations, OTP relay) |
| Push notifications | Expo Push Notifications API (called from API routes) |
| Payments | Stripe — deferred to Stage 9 |
| Deployment | Vercel |
| CI | GitHub Actions |

---

## Repository Structure

```
epharma-app-web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (shop)/
│   │   ├── catalog/page.tsx
│   │   ├── drug/[id]/page.tsx
│   │   ├── cart/page.tsx
│   │   └── checkout/page.tsx
│   ├── orders/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── prescriptions/
│   │   ├── page.tsx
│   │   └── upload/page.tsx
│   ├── admin/
│   │   ├── dashboard/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── prescriptions/page.tsx
│   │   └── drugs/page.tsx
│   └── api/
│       ├── auth/verify-otp/route.ts
│       ├── prescriptions/upload/route.ts
│       ├── prescriptions/[id]/route.ts
│       ├── orders/route.ts
│       ├── orders/[id]/route.ts
│       ├── orders/[id]/tracking/route.ts
│       ├── notifications/push/route.ts
│       └── admin/stats/route.ts
├── components/
│   ├── ui/              ← shadcn/ui primitives
│   ├── catalog/
│   ├── cart/
│   ├── orders/
│   ├── prescriptions/
│   └── admin/
├── lib/
│   ├── supabase/
│   │   ├── client.ts    ← browser client
│   │   └── server.ts    ← server client (cookies)
│   ├── types/           ← all TypeScript interfaces
│   ├── utils/           ← formatters, validators, currency
│   └── constants/       ← regions, drug schedules, config
├── middleware.ts         ← auth session refresh + route protection
├── CLAUDE.md
├── .env.local            ← never commit
├── .env.example          ← commit this
└── package.json
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values.

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server only — never expose client-side

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Dev Commands

```bash
npm run dev          # start dev server at localhost:3000
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
```

---

## Database Schema

All tables live in Supabase. RLS is enforced on every table.
See the full schema in `/lib/supabase/schema.sql` (not auto-applied — run in Supabase SQL editor).

Key tables:
- `profiles` — extends auth.users; holds role, region, phone
- `regions` — US | IN | GB | AE | BH | AD | SG | MY with currency + tax config
- `drugs` — catalog with `base_price_usd`
- `drug_region_rules` — per-region Rx requirement, schedule class, availability
- `prescriptions` — uploaded images, verification status
- `carts` + `cart_items` — active cart per user
- `orders` + `order_items` + `order_events` — full order lifecycle
- `notifications` — in-app notification inbox
- `admin_users` — role-gated admin access

---

## Auth Flow

Email → Supabase sends OTP → user enters 6-digit code → JWT issued →
stored in httpOnly cookie → `middleware.ts` refreshes on every request.

Route protection:
- `/admin/*` — requires `profiles.role IN ('pharmacist', 'admin')`
- `/(shop)/*`, `/orders/*`, `/prescriptions/*` — requires authenticated session
- `/(auth)/*` — redirects to catalog if already logged in

---

## Multi-Region Rules

Region is set on user profile at signup (not auto-detected by IP).
The `regions` table drives:
- Currency display (`currency_code`, `currency_symbol`)
- Tax label + rate (`tax_label`, `tax_rate`)
- RTL layout (`rtl: true` for AE, BH, AD — Arabic)
- `drug_region_rules` drives per-drug availability and Rx requirement

All prices stored in USD (`base_price_usd`). Converted at display time
using `price_local` override in `drug_region_rules` or live rate fallback.

---

## API Route Conventions

- All routes in `app/api/` use Next.js Route Handlers
- Server-side Supabase client used in all API routes (never anon key server-side with sensitive ops)
- Return shape: `{ data, error }` — never throw raw errors to client
- Auth check at top of every protected route handler:
  ```ts
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  ```

---

## Component Conventions

- shadcn/ui primitives in `components/ui/` — never modify directly
- Feature components in `components/<feature>/` — colocated with their page
- No default exports for components — named exports only
- Props interfaces named `<ComponentName>Props`

---

## Stage Plan

| Stage | Description | Status |
|---|---|---|
| Stage 0 | Repo scaffold, Supabase, CI, env setup | ✅ In Progress |
| Stage 1 | Auth — email OTP, session, protected routes, profile + region | ⏳ |
| Stage 2 | Drug catalog — browse, search, filter, detail + region-aware pricing | ⏳ |
| Stage 3 | Prescription upload — image upload, status tracking, admin queue | ⏳ |
| Stage 4 | Cart & Checkout — cart CRUD, Rx validation, COD order, confirm email | ⏳ |
| Stage 5 | Order tracking — status timeline, push + email notifications | ⏳ |
| Stage 6 | Admin dashboard — orders, Rx queue, drug/stock management | ⏳ |
| Stage 7 | Multi-region — currency, RTL, tax, regulatory labels | ⏳ |
| Stage 8 | Polish — RLS audit, error boundaries, a11y, loading states | ⏳ |
| Stage 9 | Stripe payments — Payment Intents, webhooks, receipts | ⏳ |
| Stage 10 | Deployment — Vercel prod, env secrets, monitoring | ⏳ |

---

## Coding Conventions

- TypeScript strict mode — no `any`
- No comments unless the WHY is non-obvious
- No unused variables or imports
- Supabase direct client calls (with RLS) for reads and simple writes
- API routes only for: file uploads, order creation, push notifications, admin mutations
- Tailwind only — no CSS modules or inline styles
- `cn()` utility for conditional class merging
