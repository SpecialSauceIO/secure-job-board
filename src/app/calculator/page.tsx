'use client'

import { useState } from 'react'
import Link from 'next/link'

const DEFAULT_STATE = {
  c1_members: 500, c1_apps: 4,
  c2_price: 9, c2_members: 75, c2_apps: 15,
  c3_price: 19, c3_members: 25, c3_apps: 30,
  
  e1_price: 99, e1_members: 10, e1_jobs: 1,
  e2_price: 299, e2_members: 5, e2_jobs: 5,
  e3_price: 899, e3_members: 2, e3_jobs: 15,
  
  cost_id_verify: 1.50, new_verifications: 30,
  cost_match_ai: 0.002, cost_job_ai: 0.001,
  cost_fixed: 46, stripe_pct: 2.9
}

export default function CalculatorPage() {
  const [inputs, setInputs] = useState(DEFAULT_STATE)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setInputs(prev => ({
      ...prev,
      [e.target.name]: isNaN(value) ? 0 : value
    }))
  }

  const resetDefaults = () => setInputs(DEFAULT_STATE)

  // Formatter helpers
  const fmtUSD = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  const fmtUSDFloat = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

  // --- Calculations ---
  const c2_rev = inputs.c2_price * inputs.c2_members
  const c3_rev = inputs.c3_price * inputs.c3_members
  const cand_rev = c2_rev + c3_rev

  const e1_rev = inputs.e1_price * inputs.e1_members
  const e2_rev = inputs.e2_price * inputs.e2_members
  const e3_rev = inputs.e3_price * inputs.e3_members
  const emp_rev = e1_rev + e2_rev + e3_rev

  const gross_mrr = cand_rev + emp_rev
  const arr = gross_mrr * 12
  const total_paying_subs = inputs.c2_members + inputs.c3_members + inputs.e1_members + inputs.e2_members + inputs.e3_members

  const stripe_pct_decimal = inputs.stripe_pct / 100
  const stripe_variable_fees = (gross_mrr * stripe_pct_decimal) + (total_paying_subs * 0.30)

  const total_applications = (inputs.c1_members * inputs.c1_apps) + (inputs.c2_members * inputs.c2_apps) + (inputs.c3_members * inputs.c3_apps)
  const total_ai_match_cost = total_applications * inputs.cost_match_ai

  const total_jobs_posted = (inputs.e1_members * inputs.e1_jobs) + (inputs.e2_members * inputs.e2_jobs) + (inputs.e3_members * inputs.e3_jobs)
  const total_ai_job_cost = total_jobs_posted * inputs.cost_job_ai

  const total_id_verification_cost = inputs.new_verifications * inputs.cost_id_verify

  const total_variable_costs = stripe_variable_fees + total_ai_match_cost + total_ai_job_cost + total_id_verification_cost
  const total_all_costs = total_variable_costs + inputs.cost_fixed

  const net_profit = gross_mrr - total_all_costs
  const annual_profit = net_profit * 12
  const gross_margin = gross_mrr > 0 ? ((net_profit / gross_mrr) * 100).toFixed(1) : "0.0"

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-300 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/" className="text-2xl font-black tracking-tight text-slate-900 hover:opacity-80">
                special<span className="text-orange-500">sauce</span><span className="text-xs text-slate-400 font-bold ml-1">™</span>
              </Link>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">Financial Model</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">Interactive SaaS Cost vs. Revenue Scaling Simulator</p>
          </div>
          <button onClick={resetDefaults} className="self-start md:self-auto text-xs font-semibold px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-white hover:text-slate-900 shadow-sm transition">
            Reset to Baseline
          </button>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-sm border-slate-300">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross MRR</p>
            <p className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-1">{fmtUSD(gross_mrr)}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">ARR: {fmtUSD(arr)}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-sm border-slate-300">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Variable Costs</p>
            <p className="text-2xl lg:text-3xl font-extrabold text-rose-600 mt-1">{fmtUSDFloat(total_variable_costs)}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">AI + Stripe ID + Fees</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-sm border-slate-300">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fixed Platform</p>
            <p className="text-2xl lg:text-3xl font-extrabold text-slate-700 mt-1">{fmtUSD(inputs.cost_fixed)}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Vercel & Supabase</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-emerald-300 bg-emerald-50/30 shadow-sm">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Net Monthly Profit</p>
            <p className="text-2xl lg:text-3xl font-extrabold text-emerald-600 mt-1">{fmtUSD(net_profit)}</p>
            <p className="text-xs text-emerald-700 font-medium mt-1">Annual: {fmtUSD(annual_profit)}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-sm col-span-2 md:col-span-1 border-slate-300">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Margin</p>
            <p className="text-2xl lg:text-3xl font-extrabold text-indigo-600 mt-1">{gross_margin}%</p>
            <p className="text-xs text-slate-500 font-medium mt-1">{total_paying_subs} Paying Subs</p>
          </div>
        </div>

        {/* Main Tier Sliders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* CANDIDATE TIERS */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-sm space-y-6 border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-300 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                Candidate Tiers
              </h2>
              <span className="text-sm font-bold text-emerald-600">{fmtUSD(cand_rev)}/mo</span>
            </div>

            {/* Tier 1 */}
            <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-300 space-y-3 border-slate-300">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">Tier 1: Free Candidate</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">$0/mo</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 font-medium">Active Members</label>
                  <input type="number" name="c1_members" value={inputs.c1_members} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Apps / Mo / Candidate</label>
                  <input type="number" name="c1_apps" value={inputs.c1_apps} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white" />
                </div>
              </div>
            </div>

            {/* Tier 2 */}
            <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-300 space-y-3 border-slate-300">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">Tier 2: Verified Professional</span>
                <span className="text-xs font-bold text-emerald-700">{fmtUSD(c2_rev)}/mo</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-medium">Monthly Price ($)</label>
                  <input type="number" name="c2_price" value={inputs.c2_price} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Active Members</label>
                  <input type="number" name="c2_members" value={inputs.c2_members} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold text-indigo-600" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Apps / Candidate</label>
                  <input type="number" name="c2_apps" value={inputs.c2_apps} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white" />
                </div>
              </div>
            </div>

            {/* Tier 3 */}
            <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-300 space-y-3 border-slate-300">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">Tier 3: Spotlight Candidate</span>
                <span className="text-xs font-bold text-emerald-700">{fmtUSD(c3_rev)}/mo</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-medium">Monthly Price ($)</label>
                  <input type="number" name="c3_price" value={inputs.c3_price} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Active Members</label>
                  <input type="number" name="c3_members" value={inputs.c3_members} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold text-indigo-600" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Apps / Candidate</label>
                  <input type="number" name="c3_apps" value={inputs.c3_apps} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white" />
                </div>
              </div>
            </div>
          </div>

          {/* EMPLOYER TIERS */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-sm space-y-6 border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-300 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span>
                Employer Tiers
              </h2>
              <span className="text-sm font-bold text-indigo-600">{fmtUSD(emp_rev)}/mo</span>
            </div>

            {/* Tier 1 */}
            <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-300 space-y-3 border-slate-300">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">Tier 1: Single Role</span>
                <span className="text-xs font-bold text-indigo-700">{fmtUSD(e1_rev)}/mo</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-medium">Monthly Price ($)</label>
                  <input type="number" name="e1_price" value={inputs.e1_price} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Active Employers</label>
                  <input type="number" name="e1_members" value={inputs.e1_members} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold text-indigo-600" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Jobs Active</label>
                  <input type="number" name="e1_jobs" value={inputs.e1_jobs} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white" />
                </div>
              </div>
            </div>

            {/* Tier 2 */}
            <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-300 space-y-3 border-slate-300">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">Tier 2: Growth (Up to 5)</span>
                <span className="text-xs font-bold text-indigo-700">{fmtUSD(e2_rev)}/mo</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-medium">Monthly Price ($)</label>
                  <input type="number" name="e2_price" value={inputs.e2_price} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Active Employers</label>
                  <input type="number" name="e2_members" value={inputs.e2_members} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold text-indigo-600" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Jobs Active</label>
                  <input type="number" name="e2_jobs" value={inputs.e2_jobs} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white" />
                </div>
              </div>
            </div>

            {/* Tier 3 */}
            <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-300 space-y-3 border-slate-300">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">Tier 3: Enterprise</span>
                <span className="text-xs font-bold text-indigo-700">{fmtUSD(e3_rev)}/mo</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-medium">Monthly Price ($)</label>
                  <input type="number" name="e3_price" value={inputs.e3_price} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Active Employers</label>
                  <input type="number" name="e3_members" value={inputs.e3_members} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold text-indigo-600" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Jobs Active</label>
                  <input type="number" name="e3_jobs" value={inputs.e3_jobs} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm bg-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Unit Economic Cost Variables Tuning */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-sm space-y-4 border-slate-300">
          <div className="flex justify-between items-center border-b border-slate-300 pb-3">
            <h3 className="text-base font-bold text-slate-900">Unit Economics & Infrastructure Cost Engine</h3>
            <span className="text-xs font-semibold text-slate-400">Underlying Cost Drivers</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div>
              <label className="text-xs text-slate-500 font-medium">ID Verify / User</label>
              <div className="mt-1 flex items-center">
                <span className="text-sm font-bold text-slate-400 mr-1">$</span>
                <input type="number" name="cost_id_verify" value={inputs.cost_id_verify} step="0.10" onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold bg-white" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">New Verifications/Mo</label>
              <input type="number" name="new_verifications" value={inputs.new_verifications} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm font-bold bg-white" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">AI Match Cost/App</label>
              <div className="mt-1 flex items-center">
                <span className="text-sm font-bold text-slate-400 mr-1">$</span>
                <input type="number" name="cost_match_ai" value={inputs.cost_match_ai} step="0.0005" onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold bg-white" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">AI Job Parse/Job</label>
              <div className="mt-1 flex items-center">
                <span className="text-sm font-bold text-slate-400 mr-1">$</span>
                <input type="number" name="cost_job_ai" value={inputs.cost_job_ai} step="0.0005" onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold bg-white" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Fixed Server Baseline</label>
              <div className="mt-1 flex items-center">
                <span className="text-sm font-bold text-slate-400 mr-1">$</span>
                <input type="number" name="cost_fixed" value={inputs.cost_fixed} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold bg-white" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Stripe Payment Fee %</label>
              <div className="mt-1 flex items-center">
                <input type="number" name="stripe_pct" value={inputs.stripe_pct} step="0.1" onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold bg-white" />
                <span className="text-sm font-bold text-slate-400 ml-1">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Ledger Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
          
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-sm border-slate-300">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Revenue Breakdown</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-300">
                <span className="text-slate-600">Candidate Tiers Total</span>
                <span className="font-bold text-slate-900">{fmtUSD(cand_rev)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-300">
                <span className="text-slate-600">Employer Tiers Total</span>
                <span className="font-bold text-slate-900">{fmtUSD(emp_rev)}</span>
              </div>
              <div className="flex justify-between py-1 text-base font-extrabold text-slate-900 pt-2">
                <span>Total Monthly Inbound</span>
                <span>{fmtUSD(gross_mrr)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-sm border-slate-300">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Cost Breakdown</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-300">
                <span className="text-slate-600">Stripe Identity Verifications</span>
                <span className="font-bold text-rose-600">{fmtUSDFloat(total_id_verification_cost)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-300">
                <span className="text-slate-600">AI Match Scoring API Calls</span>
                <span className="font-bold text-rose-600">{fmtUSDFloat(total_ai_match_cost + total_ai_job_cost)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-300">
                <span className="text-slate-600">Stripe 2.9% + $0.30 Processing Fees</span>
                <span className="font-bold text-rose-600">{fmtUSDFloat(stripe_variable_fees)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-300">
                <span className="text-slate-600">Fixed Baseline (Vercel + Supabase)</span>
                <span className="font-bold text-slate-900">{fmtUSD(inputs.cost_fixed)}</span>
              </div>
              <div className="flex justify-between py-1 text-base font-extrabold text-slate-900 pt-2">
                <span>Total Monthly Outbound</span>
                <span className="text-rose-600">{fmtUSDFloat(total_all_costs)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}