'use client'

import { useState, useEffect } from 'react'
import { parseJobAutoFill } from '@/app/dashboard/actions'

export default function AiJobScanner({ onDataExtracted }: { onDataExtracted: (data: any) => void }) {
  const [isScanning, setIsScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [lastFileName, setLastFileName] = useState<string | null>(null)
  const [scanComplete, setScanComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isScanning) {
      setProgress(0)
      return
    }
    setProgress(18)
    const timer = setInterval(() => {
      setProgress((prev) => (prev < 92 ? prev + 6 : prev))
    }, 200)
    return () => clearInterval(timer)
  }, [isScanning])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLastFileName(file.name)
    setScanComplete(false)
    setIsScanning(true)
    setError(null)

    const formData = new FormData()
    formData.append('job_description', file)

    const result = await parseJobAutoFill(formData)

    if (result?.error) {
      setError(result.error)
    } else if (result?.data) {
      onDataExtracted(result.data)
      setScanComplete(true)
    }

    setIsScanning(false)
    e.target.value = ''
  }

  return (
    <div className="bg-[#0f172a] text-white p-6 rounded-2xl border-2 border-slate-800 shadow-sm relative overflow-hidden">
      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider mb-2">
            One-Click Role Generator™ • Integrated Employer Tools
          </div>
          <h3 className="text-base font-extrabold text-white">
            Have an Existing PDF Job Description?
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Upload your PDF job description and let our One-Click Role Generator™ automatically populate required skills, role tenure, certifications, language fluency, US metro location, and upfront compensation bands below.
          </p>
          {error && (
            <p className="text-xs text-rose-400 font-bold mt-2 bg-rose-950/50 border border-rose-800 px-3 py-1.5 rounded-lg inline-block">
              {error}
            </p>
          )}
          {scanComplete && !isScanning && !error && (
            <p className="text-xs text-emerald-400 font-bold mt-2 flex items-center gap-1.5">
              <span>✓</span> Extracted structured requirements from <span className="underline">{lastFileName}</span> into the form below.
            </p>
          )}
        </div>

        <div className="shrink-0 w-full md:w-auto">
          <label
            className={`cursor-pointer inline-flex items-center justify-center w-full md:w-auto px-6 py-3 text-sm font-extrabold rounded-xl shadow-sm transition-all ${
              isScanning
                ? 'bg-indigo-500/80 text-white cursor-wait'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isScanning ? (
              <>
                <svg className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Extracting Role Criteria ({progress}%)...
              </>
            ) : (
              'Upload Job Description PDF'
            )}
            <input
              type="file"
              className="hidden"
              accept="application/pdf"
              onChange={handleUpload}
              disabled={isScanning}
            />
          </label>
        </div>
      </div>

      {isScanning && (
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Parsing core skills, experience tenure, credentials, and pay band from {lastFileName}...</span>
            <span className="text-sky-400 font-bold">≥40% TrueFit Score™ Gate Active</span>
          </div>
        </div>
      )}
    </div>
  )
}
