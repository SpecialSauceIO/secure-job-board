# Special Sauce (specialsauce.io) — Day-1 Production Launch Cutover Checklist

This checklist covers the exact steps to transition specialsauce.io from Sandbox/Pre-Launch mode to Live Production once the Texas Operating LLC filing, IRS EIN, and business checking account clear.

---

## 1. Corporate & Legal Entity Cutover (src/constants/legal.ts)

- [ ] Open src/constants/legal.ts and verify/update:
  - Operating Entity Legal Name: Confirm the exact approved Texas LLC name (wholly owned by your New Mexico Holding LLC).
  - Registered Agent / Business Mailing Address: Replace any placeholder address with the final registered office address.
  - Effective Date: Set the official production launch date.
- [ ] Run npm run build locally to confirm all legal pages (/terms, /privacy, /security) prerender cleanly.

---

## 2. Stripe Live Mode Activation & Price Catalog Sync

- [ ] Log into the Stripe Dashboard for the Texas Operating LLC (verified with the Texas LLC EIN and linked operating bank account).
- [ ] Confirm Stripe Identity is enabled in Live Mode.
- [ ] Enable the Customer Billing Portal in Live Mode (Settings -> Billing -> Customer portal).
- [ ] Copy your Live Mode API keys (pk_live_... and sk_live_...) from Developers -> API keys.
- [ ] Run the catalog sync script against Live Mode from your terminal to generate all 11 live Price IDs:
  STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY node scripts/sync-stripe-catalog.mjs
- [ ] Copy the 11 output STRIPE_PRICE_* environment variables for Step 3.

---

## 3. Live Stripe Webhook & Vercel Production Environment Variables

- [ ] In Stripe (Live Mode -> Developers -> Webhooks), create a production webhook endpoint:
  - Endpoint URL: https://www.specialsauce.io/api/webhooks/stripe
  - Events to listen for:
    - checkout.session.completed
    - customer.subscription.created
    - customer.subscription.updated
    - customer.subscription.deleted
    - invoice.payment_succeeded
    - invoice.payment_failed
    - identity.verification_session.verified
    - identity.verification_session.requires_input
- [ ] Copy the Live Signing secret (whsec_...).
- [ ] In Vercel -> Project Settings -> Environment Variables (Production), update:
  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_...
  - STRIPE_SECRET_KEY = sk_live_...
  - STRIPE_WEBHOOK_SECRET = whsec_...
  - All 11 STRIPE_PRICE_* variables generated in Step 2.

---

## 4. Final Pre-Flight Gate & Live Smoke Test

- [ ] Run the automated live database schema verifier and production build check:
  npm run verify:schema && npm run build
- [ ] Commit and push any src/constants/legal.ts updates to main (or trigger a Production redeploy in Vercel).
- [ ] Verify the operational health endpoint returns 200 OK:
  https://www.specialsauce.io/api/ops-health
- [ ] Verify social card and icon routes live:
  - https://www.specialsauce.io/icon.png
  - https://www.specialsauce.io/opengraph-image
  - https://www.specialsauce.io/twitter-image
- [ ] Run one live end-to-end checkout test and confirm webhook delivery (200 OK) in the Stripe Live Dashboard.
