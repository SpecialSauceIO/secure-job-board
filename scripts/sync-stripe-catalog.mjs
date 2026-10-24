#!/usr/bin/env node
/**
 * Special Sauce (specialsauce.io) — Idempotent Stripe Catalog Provisioning Script
 *
 * Usage:
 *   1. Test against current .env.local (Sandbox / Test Mode):
 *      node scripts/sync-stripe-catalog.mjs
 *
 *   2. Provision Live Mode catalog when your LLC Stripe account is activated:
 *      STRIPE_SECRET_KEY=sk_live_... node scripts/sync-stripe-catalog.mjs
 */

import fs from 'fs'
import path from 'path'
import Stripe from 'stripe'

// Load .env.local fallback if STRIPE_SECRET_KEY is not passed inline
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) {
      process.env[key] = val
    }
  }
}

loadEnvLocal()

const stripeKey = process.env.STRIPE_SECRET_KEY || ''
if (!stripeKey) {
  console.error('❌ Error: STRIPE_SECRET_KEY not found in environment or .env.local')
  process.exit(1)
}

const isLiveMode = stripeKey.startsWith('sk_live_')
const stripe = new Stripe(stripeKey, {
  apiVersion: '2026-09-30.endive',
})

const CATALOG_ITEMS = [
  // ==========================================================================
  // 1. CANDIDATE SUBSCRIPTIONS ($3/mo, $9/mo & $15/mo)
  // ==========================================================================
  {
    catalogKey: 'candidate_explorer',
    envVar: 'STRIPE_PRICE_CANDIDATE_EXPLORER',
    productName: 'Special Sauce - Candidate Explorer Plan ($3/mo)',
    description:
      'ID-Verified Passive & Inbound Tier: Includes 1-time Biometric ID Verification, live placement in Employer Talent Search, and unlimited inbound employer pitch unlocks.',
    unitAmount: 300,
    recurringInterval: 'month',
    metadata: { audience: 'candidate', tierId: 'explorer' },
  },
  {
    catalogKey: 'candidate_professional',
    envVar: 'STRIPE_PRICE_CANDIDATE_PROFESSIONAL',
    productName: 'Special Sauce - Candidate Professional Plan ($9/mo)',
    description:
      'ID-Verified Active Tier: Unlock and accept unlimited inbound employer pitches, plus 15 outbound blind applications/month (70%+ AI Fit).',
    unitAmount: 900,
    recurringInterval: 'month',
    metadata: { audience: 'candidate', tierId: 'professional' },
  },
  {
    catalogKey: 'candidate_prestige',
    envVar: 'STRIPE_PRICE_CANDIDATE_PRESTIGE',
    productName: 'Special Sauce - Candidate Prestige Plan ($15/mo)',
    description:
      'Priority Spotlight & Unlimited: Unlimited outbound blind applications (70%+ AI Fit), top-priority placement in Employer Talent Search, and priority shortlist placement.',
    unitAmount: 1500,
    recurringInterval: 'month',
    metadata: { audience: 'candidate', tierId: 'prestige' },
  },

  // ==========================================================================
  // 2. EMPLOYER SUBSCRIPTIONS — FOUNDING PARTNER RATES
  // ==========================================================================
  {
    catalogKey: 'employer_starter_founding',
    envVar: 'STRIPE_PRICE_EMPLOYER_STARTER_FOUNDING',
    productName: 'Special Sauce - Employer Starter Plan (Founding Partner Rate)',
    description:
      'Up to 5 simultaneous active blind job postings, 10 monthly passive candidate pitch credits, and 2 team seats.',
    unitAmount: 14900,
    recurringInterval: 'month',
    metadata: { audience: 'employer', tierId: 'starter', rateType: 'founding' },
  },
  {
    catalogKey: 'employer_growth_founding',
    envVar: 'STRIPE_PRICE_EMPLOYER_GROWTH_FOUNDING',
    productName: 'Special Sauce - Employer Growth Plan (Founding Partner Rate)',
    description:
      'Up to 15 simultaneous active blind job postings, 35 monthly passive candidate pitch credits, and 5 team/BPO seats.',
    unitAmount: 49900,
    recurringInterval: 'month',
    metadata: { audience: 'employer', tierId: 'growth', rateType: 'founding' },
  },
  {
    catalogKey: 'employer_enterprise_founding',
    envVar: 'STRIPE_PRICE_EMPLOYER_ENTERPRISE_FOUNDING',
    productName: 'Special Sauce - Employer Enterprise Plan (Founding Partner Rate)',
    description:
      'Unlimited simultaneous active blind job postings, 120 monthly pitch credits, unlimited seats, and Workday/Greenhouse ATS webhook integration.',
    unitAmount: 125000,
    recurringInterval: 'month',
    metadata: { audience: 'employer', tierId: 'enterprise', rateType: 'founding' },
  },

  // ==========================================================================
  // 3. EMPLOYER SUBSCRIPTIONS — STANDARD RETAIL RATES
  // ==========================================================================
  {
    catalogKey: 'employer_starter_retail',
    envVar: 'STRIPE_PRICE_EMPLOYER_STARTER_RETAIL',
    productName: 'Special Sauce - Employer Starter Plan (Standard Retail Rate)',
    description:
      'Up to 5 simultaneous active blind job postings, 10 monthly passive candidate pitch credits, and 2 team seats.',
    unitAmount: 29900,
    recurringInterval: 'month',
    metadata: { audience: 'employer', tierId: 'starter', rateType: 'retail' },
  },
  {
    catalogKey: 'employer_growth_retail',
    envVar: 'STRIPE_PRICE_EMPLOYER_GROWTH_RETAIL',
    productName: 'Special Sauce - Employer Growth Plan (Standard Retail Rate)',
    description:
      'Up to 15 simultaneous active blind job postings, 35 monthly passive candidate pitch credits, and 5 team/BPO seats.',
    unitAmount: 79900,
    recurringInterval: 'month',
    metadata: { audience: 'employer', tierId: 'growth', rateType: 'retail' },
  },
  {
    catalogKey: 'employer_enterprise_retail',
    envVar: 'STRIPE_PRICE_EMPLOYER_ENTERPRISE_RETAIL',
    productName: 'Special Sauce - Employer Enterprise Plan (Standard Retail Rate)',
    description:
      'Unlimited simultaneous active blind job postings, 120 monthly pitch credits, unlimited seats, and Workday/Greenhouse ATS webhook integration.',
    unitAmount: 199900,
    recurringInterval: 'month',
    metadata: { audience: 'employer', tierId: 'enterprise', rateType: 'retail' },
  },

  // ==========================================================================
  // 4. EMPLOYER ROLLOVER PITCH CREDIT TOP-UP PACKS (ONE-TIME)
  // ==========================================================================
  {
    catalogKey: 'employer_topup_boost',
    envVar: 'STRIPE_PRICE_TOPUP_BOOST',
    productName: 'Boost Pitch Credit Top-Up (+10 Rollover Credits)',
    description:
      '+10 non-expiring Rollover Pitch Credits ($15.00/pitch) protected by our 100% Accepted-Only Credit Guarantee.',
    unitAmount: 15000,
    recurringInterval: null,
    metadata: { audience: 'employer_topup', packId: 'boost', credits: '10' },
  },
  {
    catalogKey: 'employer_topup_surge',
    envVar: 'STRIPE_PRICE_TOPUP_SURGE',
    productName: 'Surge Pitch Credit Top-Up (+25 Rollover Credits)',
    description:
      '+25 non-expiring Rollover Pitch Credits ($13.00/pitch - Save 13%) protected by our 100% Accepted-Only Credit Guarantee.',
    unitAmount: 32500,
    recurringInterval: null,
    metadata: { audience: 'employer_topup', packId: 'surge', credits: '25' },
  },
  {
    catalogKey: 'employer_topup_scale',
    envVar: 'STRIPE_PRICE_TOPUP_SCALE',
    productName: 'Scale Pitch Credit Top-Up (+75 Rollover Credits)',
    description:
      '+75 non-expiring Rollover Pitch Credits ($11.00/pitch - Save 27%) protected by our 100% Accepted-Only Credit Guarantee.',
    unitAmount: 82500,
    recurringInterval: null,
    metadata: { audience: 'employer_topup', packId: 'scale', credits: '75' },
  },
]

async function main() {
  console.log('====================================================================')
  console.log(
    `🚀 Syncing Special Sauce Catalog to Stripe [${isLiveMode ? 'LIVE MODE (sk_live)' : 'TEST SANDBOX (sk_test)'}]`
  )
  console.log('====================================================================\n')

  const existingProducts = await stripe.products.list({ active: true, limit: 100 })
  const existingPrices = await stripe.prices.list({ active: true, limit: 100 })

  const envOutput = []

  for (const item of CATALOG_ITEMS) {
    // 1. Find or create Product by metadata.ss_catalog_key or exact name
    let product = existingProducts.data.find(
      (p) =>
        p.metadata?.ss_catalog_key === item.catalogKey || p.name === item.productName
    )

    if (!product) {
      product = await stripe.products.create({
        name: item.productName,
        description: item.description,
        metadata: {
          ss_catalog_key: item.catalogKey,
          ...item.metadata,
        },
      })
      console.log(`✅ Created Product: ${item.productName} (${product.id})`)
    } else {
      console.log(`ℹ️  Found Existing Product: ${item.productName} (${product.id})`)
    }

    // 2. Find or create matching Price on this Product
    let price = existingPrices.data.find((pr) => {
      if (pr.product !== product.id) return false
      if (pr.unit_amount !== item.unitAmount) return false
      if (pr.currency !== 'usd') return false
      if (item.recurringInterval) {
        return pr.type === 'recurring' && pr.recurring?.interval === item.recurringInterval
      }
      return pr.type === 'one_time'
    })

    if (!price) {
      const pricePayload = {
        product: product.id,
        currency: 'usd',
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
      console.log(
        `   ➕ Created Price: $${(item.unitAmount / 100).toFixed(2)}${item.recurringInterval ? '/' + item.recurringInterval : ''} → ${price.id}`
      )
    } else {
      console.log(
        `   ✓ Verified Price: $${(item.unitAmount / 100).toFixed(2)}${item.recurringInterval ? '/' + item.recurringInterval : ''} → ${price.id}`
      )
    }

    envOutput.push(`${item.envVar}=${price.id}`)
  }

  console.log('\n====================================================================')
  console.log(
    `🎉 Stripe Catalog Sync Complete! Copy these into .env.local / Vercel:`
  )
  console.log('====================================================================\n')
  console.log(envOutput.join('\n'))
  console.log('\n====================================================================')
}

main().catch((err) => {
  console.error('❌ Stripe Catalog Sync Failed:', err.message || err)
  process.exit(1)
})
