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
        text: res.message || 'HR sync settings saved.',
      })
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
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
        text: `✓ Exported ${res.rowCount} records to ${res.filename}.`,
      })
    }
    setIsExportingCsv(false)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 text-center shadow-xs">
        <p className="text-xs font-bold text-slate-400">
          Loading HR Software Sync...
        </p>
      </div>
    )
  }

  // UPSELL CARD FOR STARTER / GROWTH / SANDBOX TIERS
  if (!isEnterprise) {
    return (
      <div className="bg-slate-900 text-white rounded-2xl border-2 border-slate-300 shadow-sm p-4 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-wider">
              <span className="text-amber-300">
                🔒 Enterprise Plan Feature ($1,250/mo Founding Rate)
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">
                Current Plan: {tierLabel || 'Starter / Growth'}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Workday &amp; Greenhouse HR Software Auto-Sync
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Upgrade to <strong className="text-white">Enterprise ($1,250/mo Locked 12 Mos)</strong> to automatically sync released PDF resumes and TrueFit Score™ summaries to <strong className="text-white">Greenhouse</strong> and <strong className="text-white">Workday</strong>, export professional lists via CSV, and unlock <strong className="text-emerald-300">unlimited active roles, 120 monthly invitation credits, and unlimited team seats</strong>.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href="/dashboard/employer/billing"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-colors shadow-md"
            >
              Upgrade to Enterprise →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // UNLOCKED CONSOLE FOR ENTERPRISE TIER
  return (
    <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden">
      <div className="bg-slate-900 text-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
            <span>✓ Enterprise Plan Active</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-300">
              Workday &amp; Greenhouse Auto-Sync
            </span>
          </div>
          <h3 className="text-xl font-black text-white mt-1">
            HR Software Sync Settings
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Automatically send released resumes and TrueFit Score™ summaries to Greenhouse or Workday.
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
          {/* Column 1: Workday / Webhook */}
          <div className="p-5 rounded-xl bg-slate-50 border-2 border-slate-300 space-y-4">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">
                1. Workday &amp; Enterprise Webhook
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Sends a real-time notification whenever a professional shares their full resume. Compatible with Workday, Zapier, MuleSoft, and custom HR systems.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Webhook URL (HTTPS)
              </label>
              <input
                type="url"
                value={config.webhookUrl}
                onChange={(e) =>
                  setConfig({ ...config, webhookUrl: e.target.value })
                }
                placeholder="https://your-hr-endpoint.com/webhook"
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Signing Secret (<code className="font-mono">X-SpecialSauce-Signature</code>)
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
                className="w-full rounded-xl border-2 border-slate-300 bg-slate-100 px-3.5 py-2 text-xs font-mono font-bold text-slate-700"
              />
            </div>

            <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                disabled={isTestingWebhook || !config.webhookUrl}
                onClick={handleTestWebhook}
                className="px-3.5 py-2 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isTestingWebhook
                  ? 'Sending Test...'
                  : '⚡ Send Test Webhook'}
              </button>

              <button
                type="button"
                onClick={() => setShowSamplePayload((prev) => !prev)}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                {showSamplePayload ? 'Hide Sample Data' : 'View Sample Data'}
              </button>
            </div>
          </div>

          {/* Column 2: Greenhouse */}
          <div className="p-5 rounded-xl bg-slate-50 border-2 border-slate-300 space-y-4">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">
                2. Greenhouse HR Connector
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically adds the professional, their released PDF resume, and their TrueFit Score™ summary to Greenhouse.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Greenhouse Harvest API Key
              </label>
              <input
                type="password"
                value={config.greenhouseApiKey}
                onChange={(e) =>
                  setConfig({ ...config, greenhouseApiKey: e.target.value })
                }
                placeholder="Enter Harvest API Key..."
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
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
                placeholder="e.g. 4029184 (Greenhouse Admin User ID)"
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
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
                Automatically sync when a professional releases their resume
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
            🛡️ <strong>Privacy First:</strong> Personal contact details are only synced after the professional clicks &ldquo;Release Resume &amp; Contact Vault.&rdquo;
          </span>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto text-center justify-center shrink-0 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save HR Sync Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
