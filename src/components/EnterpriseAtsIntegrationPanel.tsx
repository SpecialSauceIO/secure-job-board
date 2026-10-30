'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getEnterpriseAtsSettings,
  saveEnterpriseAtsSettings,
  fireTestAtsWebhook,
  exportEnterpriseCandidatesCsv,
  EnterpriseAtsConfig,
} from '@/app/dashboard/ats-actions'

export default function EnterpriseAtsIntegrationPanel() {
  const [isLoading, setIsLoading] = useState(true)
  const [isEnterprise, setIsEnterprise] = useState(false)
  const [tierLabel, setTierLabel] = useState('')
  const [config, setConfig] = useState<EnterpriseAtsConfig>({
    webhookUrl: '',
    webhookSecret: '',
    greenhouseApiKey: '',
    greenhouseOnBehalfOf: '',
    autoPushStage2: true,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isTestingWebhook, setIsTestingWebhook] = useState(false)
  const [isExportingCsv, setIsExportingCsv] = useState(false)
  const [showSamplePayload, setShowSamplePayload] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    let mounted = true
    getEnterpriseAtsSettings().then((res) => {
      if (!mounted) return
      if (res && !res.error && res.config) {
        setIsEnterprise(Boolean(res.isEnterprise))
        setTierLabel(res.tierLabel || '')
        setConfig(res.config)
      }
      setIsLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [])

  const handleSave = async (e: React.FormEvent, regenerateSecret = false) => {
    e.preventDefault()
    setIsSaving(true)
    setFeedback(null)

    const formData = new FormData()
    formData.set('webhook_url', config.webhookUrl)
    formData.set('webhook_secret', config.webhookSecret)
    formData.set('greenhouse_api_key', config.greenhouseApiKey)
    formData.set('greenhouse_on_behalf_of', config.greenhouseOnBehalfOf)
    formData.set('auto_push_stage2', config.autoPushStage2 ? 'true' : 'false')
    if (regenerateSecret) {
      formData.set('regenerate_secret', 'true')
    }

    const res = await saveEnterpriseAtsSettings(formData)
    if (res?.error) {
      setFeedback({ type: 'error', text: res.error })
    } else if (res?.config) {
      setConfig(res.config)
      setFeedback({
        type: 'success',
        text: res.message || 'Enterprise ATS settings saved.',
      })
    }
    setIsSaving(false)
  }

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true)
    setFeedback(null)
    const res = await fireTestAtsWebhook()
    if (res?.error) {
      setFeedback({ type: 'error', text: res.error })
    } else {
      setFeedback({
        type: res?.success ? 'success' : 'error',
        text: res?.message || 'Test webhook completed.',
      })
    }
    setIsTestingWebhook(false)
  }

  const handleDownloadCsv = async () => {
    setIsExportingCsv(true)
    setFeedback(null)
    const res = await exportEnterpriseCandidatesCsv()
    if (res?.error) {
      setFeedback({ type: 'error', text: res.error })
    } else if (res?.csvContent) {
      const blob = new Blob([res.csvContent], {
        type: 'text/csv;charset=utf-8;',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.filename || 'specialsauce-ats-export.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setFeedback({
        type: 'success',
        text: `✓ Exported ${res.rowCount} pipeline records to ${res.filename} for Workday / Greenhouse import.`,
      })
    }
    setIsExportingCsv(false)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 text-center shadow-xs border-slate-300">
        <p className="text-xs font-bold text-slate-400">
          Loading HR Software Sync Hub...
        </p>
      </div>
    )
  }

  // UPSELL CARD FOR STARTER / GROWTH / UNSUBSCRIBED TIERS
  if (!isEnterprise) {
    return (
      <div className="bg-slate-900 text-white rounded-2xl border-2 border-slate-300 shadow-sm p-4 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-wider">
              <span className="text-amber-300">
                🔒 Enterprise Tier Exclusive ($1,250/mo Founding ($1,999 Retail))
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">
                Current Plan: {tierLabel || 'Growth / Starter'}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Workday &amp; Greenhouse HR Software Sync
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Upgrade to the{' '}
              <strong className="text-white">Enterprise Tier ($1,250/mo Founding ($1,999 Retail))</strong>{' '}
              to unlock automated <strong className="text-amber-300">unlocked resume exports</strong> directly into{' '}
              <strong className="text-white">Greenhouse HR Software</strong>, real-time{' '}
              <strong className="text-white">HMAC-SHA256 Signed Webhooks</strong> for{' '}
              <strong className="text-white">Workday Integration Studio</strong>, and 1-click{' '}
              <strong className="text-emerald-300">Bulk CSV Professional Exports</strong>, plus 50 active roles, 100 monthly invitation credits, and 10 team/recruiter seats.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href="/dashboard/employer/billing"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-colors shadow-md"
            >
              Upgrade to Enterprise Tier →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // UNLOCKED CONSOLE FOR ENTERPRISE TIER ($1,250/MO FOUNDING · $1,999/MO RETAIL)
  return (
    <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm  overflow-hidden">
      <div className="bg-slate-900 text-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
            <span>✓ Enterprise Tier Active</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-300">
              Workday &amp; Greenhouse HR Software Sync
            </span>
          </div>
          <h3 className="text-xl font-black text-white mt-1">
            HR Software Connection Hub
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Automatically push unlocked candidate resumes and TrueFit Score™ Cards to Greenhouse or your Workday webhook receiver.
          </p>
        </div>

        <button
          type="button"
          disabled={isExportingCsv}
          onClick={handleDownloadCsv}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
        >
          <span>
            {isExportingCsv
              ? 'Generating CSV...'
              : '⬇ Download Professional List (CSV)'}
          </span>
        </button>
      </div>

      <form onSubmit={(e) => handleSave(e, false)} className="p-4 sm:p-6 space-y-6">
        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs font-extrabold border ${
              feedback.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-300'
                : 'bg-emerald-50 text-emerald-900 border-emerald-300'
            }`}
          >
            {feedback.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Workday / Universal Signed Webhook */}
          <div className="p-5 rounded-xl bg-slate-50 border-2 border-slate-300 space-y-4 border-slate-300">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">
                1. Workday &amp; Enterprise Outbound Webhook (HMAC-SHA256)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Fires a signed <code className="font-mono text-slate-700">candidate.vault_released</code> JSON payload whenever a candidate unlocks their Conversation Resume Vault. Compatible with Workday Integration Studio, MuleSoft, Zapier, and Ashby.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Destination Webhook Endpoint URL (HTTPS)
              </label>
              <input
                type="url"
                value={config.webhookUrl}
                onChange={(e) =>
                  setConfig({ ...config, webhookUrl: e.target.value })
                }
                placeholder="https://wd5-impl-services1.workday.com/ccx/service/..."
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none border-slate-300"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  HMAC-SHA256 Signing Secret (<code className="font-mono">X-SpecialSauce-Signature</code>)
                </label>
                <button
                  type="button"
                  onClick={(e) => handleSave(e as any, true)}
                  className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                >
                  Rotate Secret
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={config.webhookSecret}
                className="w-full rounded-xl border-2 border-slate-300 bg-slate-100 px-3.5 py-2 text-xs font-mono font-bold text-slate-700 border-slate-300"
              />
            </div>

            <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                disabled={isTestingWebhook || !config.webhookUrl}
                onClick={handleTestWebhook}
                className="px-3.5 py-2 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50 border-slate-300"
              >
                {isTestingWebhook
                  ? 'Sending Test Payload...'
                  : '⚡ Send Test Webhook Payload'}
              </button>

              <button
                type="button"
                onClick={() => setShowSamplePayload((prev) => !prev)}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                {showSamplePayload ? 'Hide JSON Schema' : 'View JSON Schema'}
              </button>
            </div>
          </div>

          {/* Column 2: Native Greenhouse HR Software Connector */}
          <div className="p-5 rounded-xl bg-slate-50 border-2 border-slate-300 space-y-4 border-slate-300">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">
                2. Native Greenhouse HR Software Connector
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically creates a candidate record in Greenhouse with their released PDF resume and attaches their TrueFit Score™ as an interview note.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Greenhouse HR Software Key
              </label>
              <input
                type="password"
                value={config.greenhouseApiKey}
                onChange={(e) =>
                  setConfig({ ...config, greenhouseApiKey: e.target.value })
                }
                placeholder="Enter Harvest API Key (Configure → Dev Center → API Credentials)..."
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Greenhouse &ldquo;On-Behalf-Of&rdquo; User ID (Optional)
              </label>
              <input
                type="text"
                value={config.greenhouseOnBehalfOf}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    greenhouseOnBehalfOf: e.target.value,
                  })
                }
                placeholder="e.g. 4029184 (Greenhouse Admin User ID for audit logs)"
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none border-slate-300"
              />
            </div>

            <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoPushStage2}
                onChange={(e) =>
                  setConfig({ ...config, autoPushStage2: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-slate-700">
                Auto-send unlocked candidates to HR software immediately when a professional unlocks their resume
              </span>
            </label>
          </div>
        </div>

        {showSamplePayload && (
          <div className="p-4 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto">
            <pre>{`// POST <Your_Webhook_URL>
// Header: X-SpecialSauce-Event: candidate.vault_released
// Header: X-SpecialSauce-Signature: sha256=<HMAC_Signature>
{
  "event": "candidate.vault_released",
  "reference_id": "SS-ENT9824A",
  "job": { "title": "Senior Enterprise Program Manager", "work_model": "remote" },
  "ai_match_evaluation": { "overall_score": 94 },
  "candidate_vault": {
    "full_name": "Alex Rivera",
    "email": "alex.rivera@example.com",
    "identity_verified": true,
    "resume_pdf_url": "https://..."
  }
}`}</pre>
          </div>
        )}

        <div className="pt-3 border-t border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-xs text-slate-500">
            🛡️ <strong>Identity-Protected Privacy Guarantee:</strong> Professional personal contact info never touches your external HR software until the candidate explicitly clicks &ldquo;Release Resume &amp; Contact Vault&rdquo; to start The Conversation.
          </span>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto text-center justify-center shrink-0 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save ATS & Webhook Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}