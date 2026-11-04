#!/usr/bin/env node
/**
 * Special Sauce (specialsauce.io) — Idempotent Stripe Catalog Provisioning Script
 *
 * Usage:
 *   1. Test against current .env.local (Sandbox / Test Mode):
 *      node scripts/sync-stripe-catalog.mjs
 *
 *   2. Provision Live Mode catalog with your Live key:
 *      STRIPE_SECRET_KEY=rk_live_... node scripts/sync-stripe-catalog.mjs
 */

import fs from "fs"
import path from "path"
import Stripe from "stripe"

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local")
  if (!fs.existsSync(envPath)) return
  const rawLines = fs.readFileSync(envPath, "utf8").split(/\r?\n/)
  for (const line of rawLines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("\x27") && val.endsWith("\x27"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) {
      process.env[key] = val
    }
  }
}

loadEnvLocal()

const stripeKey = process.env.STRIPE_SECRET_KEY || ""
if (!stripeKey) {
  console.error("Error: STRIPE_SECRET_KEY not found in environment or .env.local")
  process.exit(1)
}

const isLiveMode = stripeKey.startsWith("sk_live_") || stripeKey.startsWith("rk_live_")
const stripe = new Stripe(stripeKey, {
  apiVersion: "2026-09-30.endive",
})

const CATALOG_ITEMS = [
  // ==========================================================================
  // 1. PROFESSIONAL PLANS ($5 One-Time Explorer, $12/mo Professional, $19/mo Prestige)
  // ==========================================================================
  {
    catalogKey: "professional_explorer_5_onetime",
    envVar: "STRIPE_PRICE_CANDIDATE_EXPLORER_5_ONETIME",
    productName: "Special Sauce - Explorer Plan ($5 One-Time Verification · $0/mo Forever)",
    description: "One-Time Real-Person ID Verification ($0/mo forever after): Includes Verified Professional Shield, live profile in Employer Search, unlimited employer invitations, and Weekly 1-Year Prestige Drawing entry.",
    unitAmount: 500,
    recurringInterval: null,
    metadata: { audience: "candidate", tierId: "explorer" },
  },
  {
    catalogKey: "professional_plan_12",
    envVar: "STRIPE_PRICE_CANDIDATE_PROFESSIONAL_12",
    productName: "Special Sauce - Professional Plan ($12/mo)",
    description: "Includes Real-Person ID Verification, unlimited employer invitations, and 15 outbound protected applications per month (40%+ TrueFit). Downgrade to $0/mo Explorer anytime.",
    unitAmount: 1200,
    recurringInterval: "month",
    metadata: { audience: "candidate", tierId: "professional" },
  },
  {
    catalogKey: "professional_prestige_19",
    envVar: "STRIPE_PRICE_CANDIDATE_PRESTIGE_19",
    productName: "Special Sauce - Prestige Plan ($19/mo)",
    description: "Includes Real-Person ID Verification, unlimited outbound protected applications (40%+ TrueFit), and top-priority placement in Employer Search. Downgrade to Professional ($12/mo) or Explorer ($0/mo) anytime.",
    unitAmount: 1900,
    recurringInterval: "month",
    metadata: { audience: "candidate", tierId: "prestige" },
  },

  // ==========================================================================
  // 2. EMPLOYER VERIFICATION PASS ($25 One-Time Sandbox)
  // ==========================================================================
  {
    catalogKey: "employer_verify_25_onetime",
    envVar: "STRIPE_PRICE_EMPLOYER_VERIFY_25_ONETIME",
    productName: "Special Sauce - Employer Organization Verification Pass ($25 One-Time)",
    description: "One-Time Organization Verification Pass ($0/mo Sandbox): Covers corporate domain verification, EIN/entity check, and admin Stripe ID verification to draft roles and preview verified talent matches.",
    unitAmount: 2500,
    recurringInterval: null,
    metadata: { audience: "employer", tierId: "employer_verify" },
  },

  // ==========================================================================
  // 3. EMPLOYER SUBSCRIPTIONS — FOUNDING PARTNER RATES (12-Month Rate Lock)
  // ==========================================================================
  {
    catalogKey: "employer_starter_founding",
    envVar: "STRIPE_PRICE_EMPLOYER_STARTER_FOUNDING",
    productName: "Special Sauce - Employer Starter Plan (Founding Partner Rate)",
    description: "Locked at $149/mo for your first 12 months ($299/mo Month 13+). Up to 5 active protected roles, 10 monthly Invitation Credits, Accepted-Only Guarantee, and 2 team seats.",
    unitAmount: 14900,
    recurringInterval: "month",
    metadata: { audience: "employer", tierId: "starter", rateType: "founding" },
  },
  {
    catalogKey: "employer_growth_founding",
    envVar: "STRIPE_PRICE_EMPLOYER_GROWTH_FOUNDING",
    productName: "Special Sauce - Employer Growth Plan (Founding Partner Rate)",
    description: "Locked at $499/mo for your first 12 months ($799/mo Month 13+). Up to 15 active protected roles, 35 monthly Invitation Credits, Accepted-Only Guarantee, and up to 5 team seats.",
    unitAmount: 49900,
    recurringInterval: "month",
    metadata: { audience: "employer", tierId: "growth", rateType: "founding" },
  },
  {
    catalogKey: "employer_enterprise_founding",
    envVar: "STRIPE_PRICE_EMPLOYER_ENTERPRISE_FOUNDING",
    productName: "Special Sauce - Employer Enterprise Plan (Founding Partner Rate)",
    description: "Locked at $1,250/mo for your first 12 months ($1,999/mo Month 13+). Unlimited active protected roles, 120 monthly Invitation Credits, unlimited seats, and Workday/Greenhouse sync.",
    unitAmount: 125000,
    recurringInterval: "month",
    metadata: { audience: "employer", tierId: "enterprise", rateType: "founding" },
  },

  // ==========================================================================
  // 4. EMPLOYER SUBSCRIPTIONS — STANDARD RETAIL RATES
  // ==========================================================================
  {
    catalogKey: "employer_starter_retail",
    envVar: "STRIPE_PRICE_EMPLOYER_STARTER_RETAIL",
    productName: "Special Sauce - Employer Starter Plan (Standard Retail Rate)",
    description: "Up to 5 simultaneous active protected roles, 10 monthly Invitation Credits, Accepted-Only Guarantee, and 2 team seats.",
    unitAmount: 29900,
    recurringInterval: "month",
    metadata: { audience: "employer", tierId: "starter", rateType: "retail" },
  },
  {
    catalogKey: "employer_growth_retail",
    envVar: "STRIPE_PRICE_EMPLOYER_GROWTH_RETAIL",
    productName: "Special Sauce - Employer Growth Plan (Standard Retail Rate)",
    description: "Up to 15 simultaneous active protected roles, 35 monthly Invitation Credits, Accepted-Only Guarantee, and up to 5 team seats.",
    unitAmount: 79900,
    recurringInterval: "month",
    metadata: { audience: "employer", tierId: "growth", rateType: "retail" },
  },
  {
    catalogKey: "employer_enterprise_retail",
    envVar: "STRIPE_PRICE_EMPLOYER_ENTERPRISE_RETAIL",
    productName: "Special Sauce - Employer Enterprise Plan (Standard Retail Rate)",
    description: "Unlimited simultaneous active protected roles, 120 monthly Invitation Credits, unlimited seats, and Workday/Greenhouse sync.",
    unitAmount: 199900,
    recurringInterval: "month",
    metadata: { audience: "employer", tierId: "enterprise", rateType: "retail" },
  },

  // ==========================================================================
  // 5. EMPLOYER ROLLOVER INVITATION CREDIT TOP-UP PACKS (ONE-TIME)
  // ==========================================================================
  {
    catalogKey: "employer_topup_boost",
    envVar: "STRIPE_PRICE_TOPUP_BOOST",
    productName: "Boost Invitation Credit Pack (+10 Rollover Credits)",
    description: "+10 non-expiring Rollover Invitation Credits ($15/invite) protected by our Accepted-Only Guarantee (declined invitations auto-refunded).",
    unitAmount: 15000,
    recurringInterval: null,
    metadata: { audience: "employer_topup", packId: "boost", credits: "10" },
  },
  {
    catalogKey: "employer_topup_surge_350",
    envVar: "STRIPE_PRICE_TOPUP_SURGE",
    productName: "Surge Invitation Credit Pack (+25 Rollover Credits)",
    description: "+25 non-expiring Rollover Invitation Credits ($14/invite) protected by our Accepted-Only Guarantee (declined invitations auto-refunded).",
    unitAmount: 35000,
    recurringInterval: null,
    metadata: { audience: "employer_topup", packId: "surge", credits: "25" },
  },
  {
    catalogKey: "employer_topup_scale_900",
    envVar: "STRIPE_PRICE_TOPUP_SCALE",
    productName: "Scale Invitation Credit Pack (+75 Rollover Credits)",
    description: "+75 non-expiring Rollover Invitation Credits ($12/invite) protected by our Accepted-Only Guarantee (declined invitations auto-refunded).",
    unitAmount: 90000,
    recurringInterval: null,
    metadata: { audience: "employer_topup", packId: "scale", credits: "75" },
  },
]

async function main() {
  console.log("====================================================================")
  console.log("Syncing Special Sauce Catalog to Stripe [" + (isLiveMode ? "LIVE MODE" : "TEST SANDBOX") + "]")
  console.log("====================================================================\n")

  const existingProducts = await stripe.products.list({ active: true, limit: 100 })
  const existingPrices = await stripe.prices.list({ active: true, limit: 100 })

  const envOutput = []

  for (const item of CATALOG_ITEMS) {
    let product = existingProducts.data.find(
      (p) => p.metadata?.ss_catalog_key === item.catalogKey || p.name === item.productName
    )

    if (!product) {
      product = await stripe.products.create({
        name: item.productName,
        description: item.description,
        tax_code: "txcd_10103001",
        metadata: {
          ss_catalog_key: item.catalogKey,
          ...item.metadata,
        },
      })
      console.log("Created Product: " + item.productName + " (" + product.id + ")")
    } else {
      console.log("Found Existing Product: " + item.productName + " (" + product.id + ")")
    }

    let price = existingPrices.data.find((pr) => {
      if (pr.product !== product.id) return false
      if (pr.unit_amount !== item.unitAmount) return false
      if (pr.currency !== "usd") return false
      if (item.recurringInterval) {
        return pr.type === "recurring" && pr.recurring?.interval === item.recurringInterval
      }
      return pr.type === "one_time"
    })

    if (!price) {
      const pricePayload = {
        product: product.id,
        currency: "usd",
        unit_amount: item.unitAmount,
        nickname: item.productName,
        metadata: {
          ss_catalog_key: item.catalogKey,
          env_var: item.envVar,
        },
      }
      if (item.recurringInterval) {
        pricePayload.recurring = { interval: item.recurringInterval }
      }
      price = await stripe.prices.create(pricePayload)
      console.log("   + Created Price: $" + (item.unitAmount / 100).toFixed(2) + (item.recurringInterval ? "/" + item.recurringInterval : "") + " -> " + price.id)
    } else {
      console.log("   v Verified Price: $" + (item.unitAmount / 100).toFixed(2) + (item.recurringInterval ? "/" + item.recurringInterval : "") + " -> " + price.id)
    }

    envOutput.push(item.envVar + "=" + price.id)
  }

  console.log("\n====================================================================")
  console.log("Stripe Catalog Sync Complete. Copy these into .env.local / Vercel:")
  console.log("====================================================================\n")
  console.log(envOutput.join("\n"))
  console.log("\n====================================================================")
}

main().catch((err) => {
  console.error("Stripe Catalog Sync Failed:", err.message)
  process.exit(1)
})
