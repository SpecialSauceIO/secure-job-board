'use client'

import { useState } from 'react'
import Link from 'next/link'

const DEFAULT_STATE = {
  // Candidate Tier 1: Free Explorer (Passive Career Vault - No upfront ID check or outbound apps)
  c1_members: 600,
  c1_ai_previews: 3,
  c1_pitch_conv_pct: 6,
  c1_promo_prestige_share: 40,

  // Candidate Tier 2: Professional ($9/mo, up to 15 apps/mo)
  c2_price: 9,
  c2_members: 85,
  c2_apps: 12,

  // Candidate Tier 3: Prestige ($15/mo, Unlimited apps/mo)
  c3_price: 15,
  c3_members: 40,
  c3_apps: 30,

  // New Direct Paid Candidate Signups / Mo (triggers gated Stripe Identity check)
  new_direct_paid_cands: 25,
  id_retry_rate_pct: 8,

  // Employer Tiers (Starter $99, Growth $299, Enterprise $899)
  e1_price: 149,
  e1_members: 12,
  e1_jobs: 2,
  e2_price: 499,
  e2_members: 6,
  e2_jobs: 6,
  e3_price: 1250,
  e3_members: 2,
  e3_jobs: 15,

  // Standalone Rollover Pitch Credit Top-Up Packs
  topup_packs_sold: 6,
  topup_pack_avg_price: 265,

  // Unit Economics & Circuit Breakers
  cost_id_verify: 1.50,
  daily_id_cap: 50,
  cost_match_ai: 0.002,
  cost_job_ai: 0.002,
  cost_fixed: 46,
  stripe_pct: 2.9,
}

export default function CalculatorPage() {
  const [inputs, setInputs] = useState(DEFAULT_STATE)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setInputs((prev) => ({
      ...prev,
      [e.target.name]: isNaN(value) ? 0 : value,
    }))
  }

  const resetDefaults = () => setInputs(DEFAULT_STATE)

  const fmtUSD = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(n)

  const fmtUSDFloat = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)

  // --- 1. Candidate Revenue & 50% Pitch-Acceptance Conversion Funnel ---
  const promo_converts_total = Math.round(
    inputs.c1_members * (inputs.c1_pitch_conv_pct / 100)
  )
  const promo_prestige_converts = Math.round(
    promo_converts_total * (inputs.c1_promo_prestige_share / 100)
  )
  const promo_pro_converts = Math.max(0, promo_converts_total - promo_prestige_converts)

  const promo_pro_price = inputs.c2_price * 0.5
  const promo_prestige_price = inputs.c3_price * 0.5
  const promo_mrr =
    promo_pro_converts * promo_pro_price +
    promo_prestige_converts * promo_prestige_price

  const c2_rev = inputs.c2_price * inputs.c2_members
  const c3_rev = inputs.c3_price * inputs.c3_members
  const cand_rev = c2_rev + c3_rev + promo_mrr

  // --- 2. Employer Revenue (Subscriptions + Rollover Credit Top-Ups) ---
  const e1_rev = inputs.e1_price * inputs.e1_members
  const e2_rev = inputs.e2_price * inputs.e2_members
  const e3_rev = inputs.e3_price * inputs.e3_members
  const topup_rev = inputs.topup_packs_sold * inputs.topup_pack_avg_price
  const emp_rev = e1_rev + e2_rev + e3_rev + topup_rev

  // --- 3. Totals & Stripe Processing ---
  const gross_mrr = cand_rev + emp_rev
  const arr = gross_mrr * 12

  const total_paying_cands =
    inputs.c2_members + inputs.c3_members + promo_converts_total
  const total_paying_emps =
    inputs.e1_members + inputs.e2_members + inputs.e3_members
  const total_transactions =
    total_paying_cands + total_paying_emps + inputs.topup_packs_sold

  const stripe_pct_decimal = inputs.stripe_pct / 100
  const stripe_variable_fees =
    gross_mrr * stripe_pct_decimal + total_transactions * 0.30

  // --- 4. Gated Stripe Identity Verification & Circuit Breaker Math ---
  const raw_new_verified_users = promo_converts_total + inputs.new_direct_paid_cands
  const retry_multiplier = 1 + Math.min(100, Math.max(0, inputs.id_retry_rate_pct)) / 100
  const uncapped_id_checks = Math.ceil(raw_new_verified_users * retry_multiplier)
  const monthly_circuit_breaker_cap = Math.round(inputs.daily_id_cap * 30)
  const gated_id_checks = Math.min(uncapped_id_checks, monthly_circuit_breaker_cap)

  const total_id_verification_cost = gated_id_checks * inputs.cost_id_verify
  const ungated_explorer_bleed_avoided = inputs.c1_members * inputs.cost_id_verify

  // --- 5. Day-1 Unit Economics of 50% Promo Conversion ---
  const day1_pro_net =
    promo_pro_price -
    (promo_pro_price * stripe_pct_decimal + 0.30) -
    inputs.cost_id_verify
  const day1_prestige_net =
    promo_prestige_price -
    (promo_prestige_price * stripe_pct_decimal + 0.30) -
    inputs.cost_id_verify

  // --- 6. AI Matching & Parsing Costs ---
  const total_ai_evaluations =
    inputs.c1_members * inputs.c1_ai_previews +
    inputs.c2_members * inputs.c2_apps +
    inputs.c3_members * inputs.c3_apps +
    promo_converts_total * 15
  const total_ai_match_cost = total_ai_evaluations * inputs.cost_match_ai

  const total_jobs_posted =
    inputs.e1_members * inputs.e1_jobs +
    inputs.e2_members * inputs.e2_jobs +
    inputs.e3_members * inputs.e3_jobs
  const total_ai_job_cost = total_jobs_posted * inputs.cost_job_ai

  const total_variable_costs =
    stripe_variable_fees +
    total_ai_match_cost +
    total_ai_job_cost +
    total_id_verification_cost
  const total_all_costs = total_variable_costs + inputs.cost_fixed

  const net_profit = gross_mrr - total_all_costs
  const annual_profit = net_profit * 12
  const gross_margin =
    gross_mrr > 0 ? ((net_profit / gross_mrr) * 100).toFixed(1) : '0.0'

  const total_pitch_credits_issued =
    inputs.e1_members * 10 +
    inputs.e2_members * 35 +
    inputs.e3_members * 120 +
    inputs.topup_packs_sold * 25

  // --- 7. Year 1 Founding Partner vs. Year 2 Retail Step-Up Comparison ---
  const y1_emp_base_mrr =
    inputs.e1_members * 149 +
    inputs.e2_members * 499 +
    inputs.e3_members * 1250
  const y2_emp_base_mrr =
    inputs.e1_members * 299 +
    inputs.e2_members * 799 +
    inputs.e3_members * 1999
  const y1_total_mrr = cand_rev + y1_emp_base_mrr + topup_rev
  const y2_total_mrr = cand_rev + y2_emp_base_mrr + topup_rev
  const y1_total_arr = y1_total_mrr * 12
  const y2_total_arr = y2_total_mrr * 12
  const retail_stepup_mrr_lift = y2_total_mrr - y1_total_mrr
  const retail_stepup_arr_lift = y2_total_arr - y1_total_arr

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-300 pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/"
                className="text-2xl font-black tracking-tight text-slate-900 hover:opacity-80"
              >
                special<span className="text-orange-500">sauce</span>
                <span className="text-xs text-slate-400 font-bold ml-1">™</span>
              </Link>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800">
                Unit Economics v2.0
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                Self-Funding Gated Identity
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Interactive SaaS Revenue, 50% Pitch-Conversion Funnel &amp; Gated Stripe Identity Simulator
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <Link
              href="/pricing"
              className="text-xs font-bold px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:text-slate-900 shadow-2xs transition"
            >
              View Live Pricing Page →
            </Link>
            <button
              onClick={resetDefaults}
              className="text-xs font-bold px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-2xs transition cursor-pointer"
            >
              Reset to Baseline
            </button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-xs">
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Gross MRR
            </p>
            <p className="text-2xl lg:text-3xl font-black text-slate-900 mt-1">
              {fmtUSD(gross_mrr)}
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              ARR: {fmtUSD(arr)}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-xs">
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Variable Costs
            </p>
            <p className="text-2xl lg:text-3xl font-black text-rose-600 mt-1">
              {fmtUSDFloat(total_variable_costs)}
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {gated_id_checks} Gated IDs + AI + Stripe
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-xs">
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Fixed Platform
            </p>
            <p className="text-2xl lg:text-3xl font-black text-slate-700 mt-1">
              {fmtUSD(inputs.cost_fixed)}
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Vercel Pro + Supabase Vault
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-emerald-400 bg-emerald-50/40 shadow-xs">
            <p className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
              Net Monthly Profit
            </p>
            <p className="text-2xl lg:text-3xl font-black text-emerald-600 mt-1">
              {fmtUSD(net_profit)}
            </p>
            <p className="text-xs text-emerald-800 font-bold mt-1">
              Annual: {fmtUSD(annual_profit)}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-xs col-span-2 md:col-span-1">
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Net Margin
            </p>
            <p className="text-2xl lg:text-3xl font-black text-indigo-600 mt-1">
              {gross_margin}%
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {total_paying_cands + total_paying_emps} Paying Accounts
            </p>
          </div>
        </div>

        {/* Self-Funding Onboarding & Circuit Breaker Highlight Banner */}
        <div className="rounded-2xl bg-slate-900 text-white p-6 border-2 border-slate-800 shadow-md grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
              🛡️ Gated Identity Protection
            </span>
            <p className="text-lg font-black text-white">
              {fmtUSD(ungated_explorer_bleed_avoided)}/mo Fraud Bleed Prevented
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              {inputs.c1_members} Explorer candidates join the searchable vault at <strong>$0 ID cost</strong>. Stripe Identity ($1.50) only fires after paid checkout.
            </p>
          </div>
          <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
              ⚡ Day-1 Self-Funding 50% Promo
            </span>
            <p className="text-lg font-black text-white">
              +{fmtUSDFloat(day1_pro_net)} (Pro) / +{fmtUSDFloat(day1_prestige_net)} (Prestige)
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Net Day-1 profit per pitch-accepted Explorer upgrade <strong>after</strong> deducting both Stripe fees and the $1.50 Stripe Identity check.
            </p>
          </div>
          <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400">
              🔒 Hard Circuit Breakers Active
            </span>
            <p className="text-lg font-black text-white">
              1/Day User • 2/Account • {inputs.daily_id_cap}/Day Global
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Current volume uses <strong>{gated_id_checks}</strong> of {monthly_circuit_breaker_cap} max monthly checks ({Math.round((gated_id_checks / Math.max(1, monthly_circuit_breaker_cap)) * 100)}% of global ceiling).
            </p>
          </div>
        </div>

        {/* Main Tier Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CANDIDATE TIERS & ONBOARDING FUNNEL */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-300 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  Candidate Tiers &amp; Onboarding Funnel
                </h2>
                <p className="text-xs text-slate-500">
                  Explorer ($0 Passive Pool) → 50% Pitch-Accept Upgrade → Professional ($9) / Prestige ($15)
                </p>
              </div>
              <span className="text-base font-black text-emerald-600">
                {fmtUSD(cand_rev)}/mo
              </span>
            </div>

            {/* Tier 1: Explorer ($0/Forever) */}
            <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-300 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-black text-slate-900 text-sm">
                    Tier 1: Explorer (Passive Career Vault)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Searchable by Employers • Outbound Apps &amp; Stripe ID Gated Until Upgrade
                  </p>
                </div>
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-slate-200 text-slate-800">
                  $0/Forever
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-slate-600 font-bold">
                    Explorer Pool Size
                  </label>
                  <input
                    type="number"
                    name="c1_members"
                    value={inputs.c1_members}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-bold">
                    AI Fit Previews/Mo
                  </label>
                  <input
                    type="number"
                    name="c1_ai_previews"
                    value={inputs.c1_ai_previews}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-emerald-700 font-bold">
                    Pitch-Accept Conv %
                  </label>
                  <input
                    type="number"
                    name="c1_pitch_conv_pct"
                    value={inputs.c1_pitch_conv_pct}
                    step="0.5"
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-emerald-400 rounded-lg text-sm bg-white font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-indigo-700 font-bold">
                    % Choosing Prestige
                  </label>
                  <input
                    type="number"
                    name="c1_promo_prestige_share"
                    value={inputs.c1_promo_prestige_share}
                    step="5"
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-indigo-300 rounded-lg text-sm bg-white font-bold text-indigo-700"
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600">
                <span>
                  50% Promo Upgrades: <strong>{promo_converts_total}/mo</strong> ({promo_pro_converts} Pro @ {fmtUSDFloat(promo_pro_price)} + {promo_prestige_converts} Prestige @ {fmtUSDFloat(promo_prestige_price)})
                </span>
                <span className="font-extrabold text-emerald-700">
                  +{fmtUSD(promo_mrr)}/mo
                </span>
              </div>
            </div>

            {/* Tier 2: Professional ($9/mo) */}
            <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-300 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-black text-slate-900 text-sm">
                    Tier 2: Professional (Verified Active Jobseeker)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Up to 15 Blind Applications / Mo • Gated Stripe Identity Included
                  </p>
                </div>
                <span className="text-xs font-extrabold text-emerald-700">
                  {fmtUSD(c2_rev)}/mo
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-600 font-bold">
                    Monthly Price ($)
                  </label>
                  <input
                    type="number"
                    name="c2_price"
                    value={inputs.c2_price}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-bold">
                    Full-Price Subscribers
                  </label>
                  <input
                    type="number"
                    name="c2_members"
                    value={inputs.c2_members}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold text-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-bold">
                    Avg Apps / Mo (Max 15)
                  </label>
                  <input
                    type="number"
                    name="c2_apps"
                    value={inputs.c2_apps}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Tier 3: Prestige ($15/mo) */}
            <div className="p-4 rounded-xl bg-amber-50/40 border-2 border-amber-300 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-black text-slate-900 text-sm">
                    Tier 3: Prestige (Unlimited Apps + Top Priority)
                  </span>
                  <p className="text-[11px] text-slate-600">
                    Unlimited Blind Applications • Top Search Placement • Founding Badge
                  </p>
                </div>
                <span className="text-xs font-extrabold text-emerald-700">
                  {fmtUSD(c3_rev)}/mo
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-600 font-bold">
                    Monthly Price ($)
                  </label>
                  <input
                    type="number"
                    name="c3_price"
                    value={inputs.c3_price}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-bold">
                    Full-Price Subscribers
                  </label>
                  <input
                    type="number"
                    name="c3_members"
                    value={inputs.c3_members}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold text-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-bold">
                    Avg Apps / Mo (Unlim.)
                  </label>
                  <input
                    type="number"
                    name="c3_apps"
                    value={inputs.c3_apps}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* EMPLOYER TIERS & PITCH CREDITS */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-300 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span>
                  Employer Subscriptions &amp; Credit Top-Ups
                </h2>
                <p className="text-xs text-slate-500">
                  Starter ($149 Founding / $299 Retail) • Growth ($499 / $799) • Enterprise ($1,250 / $1,999) • 100% Accepted-Only Guarantee
                </p>
              </div>
              <span className="text-base font-black text-indigo-600">
                {fmtUSD(emp_rev)}/mo
              </span>
            </div>

            {/* 1-Click Year 1 Founding vs Year 2 Retail Preset Switcher */}
            <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                  ★ 12-Month Rate Lock → Month 13 Retail Step-Up
                </span>
                <span className="text-[11px] font-black text-emerald-300">
                  Built-In Year 2 Expansion: +{fmtUSD(retail_stepup_mrr_lift)}/mo (+{fmtUSD(retail_stepup_arr_lift)}/yr ARR)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setInputs((prev) => ({
                      ...prev,
                      e1_price: 149,
                      e2_price: 499,
                      e3_price: 1250,
                    }))
                  }
                  className={`py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    inputs.e1_price === 149 && inputs.e2_price === 499 && inputs.e3_price === 1250
                      ? "bg-amber-400 text-slate-950 shadow-xs"
                      : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  }`}
                >
                  ★ Year 1 Founding Rates ($149 / $499 / $1,250) → {fmtUSD(y1_total_arr)} ARR
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setInputs((prev) => ({
                      ...prev,
                      e1_price: 299,
                      e2_price: 799,
                      e3_price: 1999,
                    }))
                  }
                  className={`py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    inputs.e1_price === 299 && inputs.e2_price === 799 && inputs.e3_price === 1999
                      ? "bg-indigo-500 text-white shadow-xs"
                      : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  }`}
                >
                  🚀 Year 2 Retail Step-Up ($299 / $799 / $1,999) → {fmtUSD(y2_total_arr)} ARR
                </button>
              </div>
            </div>

            {/* Tier 1: Starter ($99/mo) */}
            <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-300 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-black text-slate-900 text-sm">
                    Starter Plan (Up to 5 Active Roles • 10 Pitch Credits/Mo)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    2 Team/BPO Seats • 12-Mo Founding Rate ($149 vs $299) • Declined Pitches Auto-Refunded
                  </p>
                </div>
                <span className="text-xs font-extrabold text-indigo-700">
                  {fmtUSD(e1_rev)}/mo
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-600 font-bold">
                    Monthly Price ($)
                  </label>
                  <input
                    type="number"
                    name="e1_price"
                    value={inputs.e1_price}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-bold">
                    Active Orgs
                  </label>
                  <input
                    type="number"
                    name="e1_members"
                    value={inputs.e1_members}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold text-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-bold">
                    Avg Jobs / Org (Max 5)
                  </label>
                  <input
                    type="number"
                    name="e1_jobs"
                    value={inputs.e1_jobs}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Tier 2: Growth ($299/mo) */}
            <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-300 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-black text-slate-900 text-sm">
                    Growth Plan (Up to 15 Active Roles • 35 Pitch Credits/Mo)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Up to 5 Team/BPO Seats • 12-Mo Founding Rate ($499 vs $799) • Declined Pitches Auto-Refunded
                  </p>
                </div>
                <span className="text-xs font-extrabold text-indigo-700">
                  {fmtUSD(e2_rev)}/mo
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-600 font-bold">
                    Monthly Price ($)
                  </label>
                  <input
                    type="number"
                    name="e2_price"
                    value={inputs.e2_price}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-bold">
                    Active Orgs
                  </label>
                  <input
                    type="number"
                    name="e2_members"
                    value={inputs.e2_members}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold text-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-bold">
                    Avg Jobs / Org (Max 15)
                  </label>
                  <input
                    type="number"
                    name="e2_jobs"
                    value={inputs.e2_jobs}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Tier 3: Enterprise ($899/mo) */}
            <div className="p-4 rounded-xl bg-indigo-50/40 border-2 border-indigo-300 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-black text-slate-900 text-sm">
                    Enterprise Plan (Unlimited Roles • 120 Pitch Credits/Mo)
                  </span>
                  <p className="text-[11px] text-slate-600">
                    Unlimited Seats • 12-Mo Founding Rate ($1,250 vs $1,999) • Workday &amp; Greenhouse ATS Sync
                  </p>
                </div>
                <span className="text-xs font-extrabold text-indigo-700">
                  {fmtUSD(e3_rev)}/mo
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-600 font-bold">
                    Monthly Price ($)
                  </label>
                  <input
                    type="number"
                    name="e3_price"
                    value={inputs.e3_price}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-bold">
                    Active Orgs
                  </label>
                  <input
                    type="number"
                    name="e3_members"
                    value={inputs.e3_members}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold text-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-bold">
                    Avg Jobs / Org
                  </label>
                  <input
                    type="number"
                    name="e3_jobs"
                    value={inputs.e3_jobs}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Rollover Pitch Credit Top-Up Packs */}
            <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-300 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-black text-slate-900 text-sm">
                    Rollover Pitch Credit Top-Up Packs ($150 Boost +10 • $325 Surge +25 • $825 Scale +75)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Total Monthly Pitch Credits Issued Across All Employers: <strong>{total_pitch_credits_issued} credits/mo</strong>
                  </p>
                </div>
                <span className="text-xs font-extrabold text-indigo-700">
                  +{fmtUSD(topup_rev)}/mo
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-600 font-bold">
                    Top-Up Packs Sold / Mo
                  </label>
                  <input
                    type="number"
                    name="topup_packs_sold"
                    value={inputs.topup_packs_sold}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-bold">
                    Avg Pack Price ($)
                  </label>
                  <input
                    type="number"
                    name="topup_pack_avg_price"
                    value={inputs.topup_pack_avg_price}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Unit Economic Cost & Circuit Breaker Tuning */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-300 pb-3 gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Unit Economics, Gated Stripe Identity &amp; Circuit Breaker Controls
              </h3>
              <p className="text-xs text-slate-500">
                Stripe Identity ($1.50) only triggers when a candidate upgrades to Professional or Prestige.
              </p>
            </div>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {gated_id_checks} Paid Verifications / Mo ({fmtUSDFloat(total_id_verification_cost)})
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <div>
              <label className="text-[11px] text-slate-600 font-bold">
                ID Verify Cost ($)
              </label>
              <input
                type="number"
                name="cost_id_verify"
                value={inputs.cost_id_verify}
                step="0.10"
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm font-bold bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 font-bold">
                New Direct Paid/Mo
              </label>
              <input
                type="number"
                name="new_direct_paid_cands"
                value={inputs.new_direct_paid_cands}
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm font-bold bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 font-bold">
                ID Retry Rate (%)
              </label>
              <input
                type="number"
                name="id_retry_rate_pct"
                value={inputs.id_retry_rate_pct}
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm font-bold bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-indigo-700 font-bold">
                Global Daily ID Cap
              </label>
              <input
                type="number"
                name="daily_id_cap"
                value={inputs.daily_id_cap}
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-indigo-300 rounded-lg text-sm font-bold bg-white text-indigo-700"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 font-bold">
                AI Fit Cost / Eval
              </label>
              <input
                type="number"
                name="cost_match_ai"
                value={inputs.cost_match_ai}
                step="0.0005"
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm font-bold bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 font-bold">
                AI Job Parse / Job
              </label>
              <input
                type="number"
                name="cost_job_ai"
                value={inputs.cost_job_ai}
                step="0.0005"
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm font-bold bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 font-bold">
                Fixed Infra ($/Mo)
              </label>
              <input
                type="number"
                name="cost_fixed"
                value={inputs.cost_fixed}
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm font-bold bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 font-bold">
                Stripe Fee (%)
              </label>
              <input
                type="number"
                name="stripe_pct"
                value={inputs.stripe_pct}
                step="0.1"
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm font-bold bg-white"
              />
            </div>
          </div>
        </div>

        {/* Detailed Ledger Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">
              Monthly Revenue Ledger
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-600">
                  Candidate Professional ({inputs.c2_members} @ ${inputs.c2_price}/mo)
                </span>
                <span className="font-bold text-slate-900">{fmtUSD(c2_rev)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-600">
                  Candidate Prestige ({inputs.c3_members} @ ${inputs.c3_price}/mo)
                </span>
                <span className="font-bold text-slate-900">{fmtUSD(c3_rev)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-emerald-700 font-medium">
                  Explorer 50% Pitch-Accept Upgrades ({promo_converts_total}/mo)
                </span>
                <span className="font-bold text-emerald-700">{fmtUSD(promo_mrr)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-600">
                  Employer Subscriptions ({total_paying_emps} Active Orgs)
                </span>
                <span className="font-bold text-slate-900">
                  {fmtUSD(e1_rev + e2_rev + e3_rev)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-600">
                  Rollover Pitch Credit Top-Up Packs ({inputs.topup_packs_sold}/mo)
                </span>
                <span className="font-bold text-slate-900">{fmtUSD(topup_rev)}</span>
              </div>
              <div className="flex justify-between py-2 text-base font-black text-slate-900">
                <span>Total Monthly Gross Revenue (MRR)</span>
                <span className="text-emerald-600">{fmtUSD(gross_mrr)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">
              Monthly Cost &amp; Protection Ledger
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-600">
                  Gated Stripe Identity Checks ({gated_id_checks} checks @ {fmtUSDFloat(inputs.cost_id_verify)})
                </span>
                <span className="font-bold text-rose-600">
                  {fmtUSDFloat(total_id_verification_cost)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-600">
                  5-Pillar AI Match &amp; PDF Parsing ({total_ai_evaluations.toLocaleString()} evals)
                </span>
                <span className="font-bold text-rose-600">
                  {fmtUSDFloat(total_ai_match_cost + total_ai_job_cost)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-600">
                  Stripe Processing ({inputs.stripe_pct}% + $0.30 × {total_transactions} txns)
                </span>
                <span className="font-bold text-rose-600">
                  {fmtUSDFloat(stripe_variable_fees)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-600">
                  Fixed Cloud Infrastructure (Vercel + Supabase Pro)
                </span>
                <span className="font-bold text-slate-900">
                  {fmtUSD(inputs.cost_fixed)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 text-xs text-emerald-700 bg-emerald-50/60 px-2 rounded">
                <span>
                  Explorer Unverified Pool Savings ({inputs.c1_members} × $1.50 avoided)
                </span>
                <span className="font-extrabold">
                  +{fmtUSD(ungated_explorer_bleed_avoided)} Saved
                </span>
              </div>
              <div className="flex justify-between py-2 text-base font-black text-slate-900">
                <span>Total Monthly Operating Outbound</span>
                <span className="text-rose-600">{fmtUSDFloat(total_all_costs)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
