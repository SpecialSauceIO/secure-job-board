'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  STANDARD_CERTIFICATIONS,
  getCertificationsForIndustry,
  parseAndNormalizeCertifications,
  normalizeSingleCertification,
} from '@/constants/certifications'

interface StructuredCertificationSelectorProps {
  name: string
  initialValue?: string
  value?: string
  industryVertical?: string
  industrySelectName?: string
  onChange?: (serializedCsv: string) => void
  placeholder?: string
}

export default function StructuredCertificationSelector({
  name,
  initialValue = '',
  value,
  industryVertical = '',
  industrySelectName = 'industry_vertical',
  onChange,
  placeholder = 'Search certifications or licenses (e.g. CompTIA A+, PMP, RN, EPA 608, CDL)...',
}: StructuredCertificationSelectorProps) {
  const isControlled = typeof value === 'string'
  const [selectedCerts, setSelectedCerts] = useState<string[]>(() =>
    parseAndNormalizeCertifications(isControlled ? value : initialValue)
  )
  const [activeIndustry, setActiveIndustry] = useState<string>(industryVertical || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllVerticals, setShowAllVerticals] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Sync controlled value OR updated server initialValue (e.g. AI Resume/Job Parser auto-fill)
  useEffect(() => {
    if (isControlled) {
      setSelectedCerts(parseAndNormalizeCertifications(value))
    } else {
      setSelectedCerts(parseAndNormalizeCertifications(initialValue))
    }
  }, [isControlled, value, initialValue])

  // Sync prop industryVertical changes
  useEffect(() => {
    if (industryVertical) {
      setActiveIndustry(industryVertical)
    }
  }, [industryVertical])

  // Automatically listen to changes on the page's <select name="industry_vertical"> if uncontrolled
  useEffect(() => {
    if (!industrySelectName || typeof document === 'undefined') return
    const selectEl = document.querySelector(
      `select[name="${industrySelectName}"]`
    ) as HTMLSelectElement | null
    if (!selectEl) return

    if (selectEl.value) {
      setActiveIndustry(selectEl.value)
    }

    const handleSelectChange = (e: Event) => {
      const target = e.target as HTMLSelectElement
      setActiveIndustry(target.value)
    }

    selectEl.addEventListener('change', handleSelectChange)
    return () => selectEl.removeEventListener('change', handleSelectChange)
  }, [industrySelectName])

  const updateCerts = (nextList: string[]) => {
    setSelectedCerts(nextList)
    if (onChange) {
      onChange(nextList.join(', '))
    }
  }

  const addCertification = (rawLabel: string) => {
    const normalized = normalizeSingleCertification(rawLabel)
    if (!normalized) return
    const exists = selectedCerts.some(
      (c) => c.toLowerCase() === normalized.toLowerCase()
    )
    if (!exists) {
      updateCerts([...selectedCerts, normalized])
    }
    setSearchQuery('')
  }

  const removeCertification = (certToRemove: string) => {
    updateCerts(selectedCerts.filter((c) => c !== certToRemove))
  }

  const { domainRecommended, crossIndustry, otherVerticals } = useMemo(
    () => getCertificationsForIndustry(activeIndustry),
    [activeIndustry]
  )

  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const selectedSet = new Set(selectedCerts.map((c) => c.toLowerCase()))

    const matchesQuery = (cert: (typeof STANDARD_CERTIFICATIONS)[number]) => {
      if (selectedSet.has(cert.canonical.toLowerCase())) return false
      if (!q) return true
      if (cert.canonical.toLowerCase().includes(q)) return true
      if (cert.category.toLowerCase().includes(q)) return true
      return cert.aliases.some((a) => a.toLowerCase().includes(q))
    }

    return {
      domain: domainRecommended.filter(matchesQuery),
      cross: crossIndustry.filter(matchesQuery),
      other: (showAllVerticals || q.length > 0) ? otherVerticals.filter(matchesQuery) : [],
    }
  }, [searchQuery, selectedCerts, domainRecommended, crossIndustry, otherVerticals, showAllVerticals])

  const serializedValue = selectedCerts.join(', ')

  return (
    <div className="space-y-2.5">
      {/* Hidden input ensures standard FormData submission works seamlessly */}
      <input type="hidden" name={name} value={serializedValue} />

      {/* Selected Certification Pills */}
      {selectedCerts.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          {selectedCerts.map((cert) => (
            <span
              key={cert}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-2xs"
            >
              <span>🏅 {cert}</span>
              <button
                type="button"
                onClick={() => removeCertification(cert)}
                className="text-indigo-500 hover:text-rose-600 font-extrabold px-1 rounded transition-colors"
                title={`Remove ${cert}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div className="text-[11px] font-medium text-slate-400 italic">
          No certifications or licenses selected yet. Choose from your industry vertical below or search by keyword.
        </div>
      )}

      {/* Search & Combobox Input */}
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setDropdownOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setDropdownOpen(true)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                e.preventDefault()
                const topMatch =
                  filteredResults.domain[0] ||
                  filteredResults.cross[0] ||
                  filteredResults.other[0]
                if (topMatch) {
                  addCertification(topMatch.canonical)
                } else {
                  addCertification(searchQuery.trim())
                }
              }
            }}
            placeholder={placeholder}
            className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-xs sm:text-sm font-medium"
          />
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold whitespace-nowrap transition-colors"
          >
            {dropdownOpen ? 'Hide List ▲' : 'Browse List ▼'}
          </button>
        </div>

        {/* Categorized Dropdown Menu */}
        {dropdownOpen && (
          <div className="mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-slate-300 bg-white shadow-lg p-3 space-y-3 z-30">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                {activeIndustry
                  ? `Filtered for: ${activeIndustry}`
                  : 'Standardized Certification & License Directory'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAllVerticals((prev) => !prev)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                >
                  {showAllVerticals ? 'Show My Industry Only' : 'Show All 28 Industries'}
                </button>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(false)}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-700 px-1.5"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* 1. Industry-Specific Recommendations */}
            {filteredResults.domain.length > 0 && (
              <div>
                <p className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider mb-1.5">
                  ★ Top Credentials for {activeIndustry || 'Selected Vertical'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {filteredResults.domain.map((cert) => (
                    <button
                      key={cert.canonical}
                      type="button"
                      onClick={() => addCertification(cert.canonical)}
                      className="text-left px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors"
                    >
                      + {cert.canonical}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Cross-Industry PM, Agile & Operations */}
            {filteredResults.cross.length > 0 && (
              <div>
                <p className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider mb-1.5">
                  ⚡ Cross-Industry Project Mgmt, Agile &amp; Operations
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {filteredResults.cross.map((cert) => (
                    <button
                      key={cert.canonical}
                      type="button"
                      onClick={() => addCertification(cert.canonical)}
                      className="text-left px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 transition-colors"
                    >
                      + {cert.canonical}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Other Industry Verticals (when searching or toggled) */}
            {filteredResults.other.length > 0 && (
              <div>
                <p className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                  🌐 Other Industry Licenses &amp; Certifications
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {filteredResults.other.map((cert) => (
                    <button
                      key={cert.canonical}
                      type="button"
                      onClick={() => addCertification(cert.canonical)}
                      className="text-left px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors"
                    >
                      + {cert.canonical}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Escape Hatch for Custom / Niche Credential */}
            {searchQuery.trim().length > 1 && (
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  Don&apos;t see an exact match for <strong>&ldquo;{searchQuery.trim()}&rdquo;</strong>?
                </span>
                <button
                  type="button"
                  onClick={() => addCertification(searchQuery.trim())}
                  className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-indigo-600 transition-colors"
                >
                  + Add Custom Credential
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
