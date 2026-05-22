# FitMeal AI — Payment Integration Guide

FitMeal AI now supports **four payment paths**, all routed through one
`payment_requests` table:

| Path | When to use | Where the user enters details |
|---|---|---|
| **Google Play Billing** | Android subscriptions | Inside the app via `BillingHelper` |
| **Apple StoreKit 2** | iOS subscriptions | Inside the app via `SubscriptionManager` |
| **KHQR gateway** | Cambodia users w/ a Bakong-compatible bank | KHQR sheet (any bank app scans it) |
| **Manual ABA transfer** | Fallback when nothing else works | ABA payment form (TX ID + screenshot) |

This file documents the **KHQR gateway** option and how to choose between
the three KHQR providers.

---

## KHQR provider abstraction

Every provider implements the `PaymentProvider` interface in
[`admin-web/src/lib/payments/types.ts`](admin-web/src/lib/payments/types.ts).
Routes call `getPaymentProvider(id)` from
[`factory.ts`](admin-web/src/lib/payments/factory.ts) and never know
which gateway is in use.

```
Mobile → POST /api/payments/create-khqr  → factory.ts → ProviderImpl.createSession
       ← qrPayload, providerSessionId, expiresAt
       (every 3s) GET /api/payments/status/{id}  → ProviderImpl.checkStatus
                                                 → DB row updated, trigger upgrades tier

Provider → POST /api/payments/webhooks/{provider}  → ProviderImpl.verifyWebhook
                                                  → DB row updated, trigger upgrades tier
```

### 1. Bakong KHQR direct (recommended default)

The cheapest option: **no per-transaction fees**, you talk straight to
the National Bank of Cambodia.

| Env var | Where to get it |
|---|---|
| `BAKONG_API_TOKEN` | [bakong.nbc.gov.kh](https://bakong.nbc.gov.kh/) → Developer portal |
| `BAKONG_BAKONG_ACCOUNT_ID` | Your Bakong app `username@bank` (e.g. `fitmeal@aclb`) |
| `BAKONG_MERCHANT_NAME` | Your business name (`FitMeal AI`) |
| `BAKONG_MERCHANT_CITY` | Optional; defaults to `Phnom Penh` |
| `BAKONG_API_BASE` | Optional; defaults to `https://api-bakong.nbc.gov.kh/v1` |
| `BAKONG_INTERNAL_WEBHOOK_SECRET` | Random 32+ byte string (used by an internal cron to push "found" events) |

Implementation: [`bakong.ts`](admin-web/src/lib/payments/bakong.ts).
Uses the [`bakong-khqr`](https://www.npmjs.com/package/bakong-khqr) npm
package to generate KHQR EMVCo payloads locally.

Bakong itself doesn't push webhooks — status is poll-only. The
`/api/payments/status/{id}` route polls Bakong on demand whenever a
mobile client checks status.

### 2. ABA PayWay

Cambodia's largest gateway (operated by ABA Bank). Best when you also
want **credit card / WeChat Pay / Alipay** alongside KHQR.

| Env var | Where to get it |
|---|---|
| `PAYWAY_MERCHANT_ID` | From your ABA PayWay merchant account |
| `PAYWAY_API_KEY` | From your ABA PayWay merchant account |
| `PAYWAY_BASE_URL` | `https://checkout-sandbox.payway.com.kh` (sandbox) or `https://checkout.payway.com.kh` (prod) |
| `PAYWAY_RETURN_URL` | `https://your-app.vercel.app/api/payments/webhooks/aba_payway` |

Implementation: [`payway.ts`](admin-web/src/lib/payments/payway.ts).
Signs every request with HMAC-SHA512 over the canonical field order
documented at [developer.payway.com.kh](https://developer.payway.com.kh/).

Sign up by emailing `paywaysales@ababank.com`.

### 3. CamRapidPay

Managed Bakong KHQR gateway with cleaner JSON REST + webhook callbacks.
Useful when you don't want to manage Bakong tokens yourself.

| Env var | Where to get it |
|---|---|
| `CAMRAPIDPAY_API_KEY` | From your CamRapidPay dashboard |
| `CAMRAPIDPAY_BASE_URL` | `https://api.camrapidpay.com` |
| `CAMRAPIDPAY_WEBHOOK_SECRET` | Generated in dashboard; verifies `X-Signature` |

Implementation: [`camrapidpay.ts`](admin-web/src/lib/payments/camrapidpay.ts).
Docs: [docs.camrapidpay.com](https://docs.camrapidpay.com/).

---

## Choosing a provider

Set `PAYMENT_PROVIDER_DEFAULT` to one of:
- `bakong_khqr` (default if unset)
- `aba_payway`
- `camrapidpay`

Mobile clients can override per-request by passing
`{ provider: "aba_payway" }` in the `/api/payments/create-khqr` body.

The Setup health page at `/setup` shows which providers are configured.

---

## Mobile client integration

Both iOS and Android clients call the same two endpoints.

### iOS (Swift)

```swift
struct KhqrSession: Decodable {
    let paymentRequestId: String
    let providerId: String
    let qrPayload: String?
    let qrImageUrl: String?
    let expiresAt: String
}

func createKhqrSession(tier: String) async throws -> KhqrSession {
    var req = URLRequest(url: URL(string: "\(api)/api/payments/create-khqr")!)
    req.httpMethod = "POST"
    req.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
    req.setValue("application/json", forHTTPHeaderField: "Content-Type")
    req.httpBody = try JSONEncoder().encode(["user_id": userId, "tier": tier])
    let (data, _) = try await URLSession.shared.data(for: req)
    return try JSONDecoder().decode(KhqrSession.self, from: data)
}
```

### Android (Kotlin)

```kotlin
val session = paymentRepository.createKhqrSession(
    session = currentAuthSession,
    tier = "Gold",
)
val statusSnapshot = paymentRepository.checkKhqrStatus(
    session = currentAuthSession,
    paymentRequestId = session.paymentRequestId,
)
```

`PaymentRepository.createKhqrSession` and `checkKhqrStatus` are in
[`Services.kt`](android/app/src/main/java/com/fitmealai/data/Services.kt).

---

## Database

Migration [`0012_payment_providers.sql`](supabase/migrations/0012_payment_providers.sql)
extends `payment_requests` with:

- `provider` enum (`manual_aba`, `bakong_khqr`, `aba_payway`, `camrapidpay`)
- `provider_session_id`, `qr_payload`, `qr_image_url`, `md5_hash`,
  `currency`, `amount_minor`, `expires_at`, `last_polled_at`,
  `provider_payload` (jsonb)

It also adds a `confirm_payment_request(id, provider, ref, payload)`
RPC that the API routes call once a transaction is confirmed. The
existing `payment_requests_approval` trigger then upgrades the user's
tier and inserts an `active` `subscriptions` row — so the same flow
works for manual review, KHQR, and Play/StoreKit.
