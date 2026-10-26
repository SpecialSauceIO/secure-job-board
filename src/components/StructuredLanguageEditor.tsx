'use client'

import { useState, useEffect } from 'react'
import {
  LanguageEntry,
  LanguageModality,
  LanguageProficiency,
  STANDARD_LANGUAGES,
  LANGUAGE_MODALITIES,
  LANGUAGE_PROFICIENCIES,
  normalizeLanguageList,
} from '@/constants/languages'

export function StructuredLanguageEditor({
  name = 'languages',
  initialLanguages,
  title = '🌐 Language Proficiency Matrix',
  subtitle = 'Specify each language, whether your capability is Written, Verbal, or Both, and your proficiency level. Adding a 2nd language at Advanced or Fluent unlocks the Multilingual Specialist distinction.',
  onChange,
}: {
  name?: string
  initialLanguages?: any
  title?: string
  subtitle?: string
  onChange?: (updated: LanguageEntry[]) => void
}) {
  const [entries, setEntries] = useState<LanguageEntry[]>(() =>
    normalizeLanguageList(initialLanguages, true)
  )

  const [selectedLang, setSelectedLang] = useState<string>('Spanish')
  const [customLang, setCustomLang] = useState<string>('')
  const [selectedModality, setSelectedModality] = useState<LanguageModality>(
    'Both (Written & Verbal)'
  )
  const [selectedProficiency, setSelectedProficiency] =
    useState<LanguageProficiency>('Fluent / Native')

  useEffect(() => {
    if (initialLanguages !== undefined) {
      setEntries(normalizeLanguageList(initialLanguages, true))
    }
  }, [initialLanguages])

  const syncEntries = (next: LanguageEntry[]) => {
    const safe =
      next.length > 0 ? next : normalizeLanguageList([], true)
    setEntries(safe)
    onChange?.(safe)
  }

  const handleAddLanguage = () => {
    const targetName =
      selectedLang === 'OTHER_CUSTOM'
        ? customLang.trim()
        : selectedLang.trim()

    if (!targetName) return

    const updated = [...entries]
    const existingIdx = updated.findIndex(
      (item) => item.language.toLowerCase() === targetName.toLowerCase()
    )

    const newEntry: LanguageEntry = {
      language: targetName,
      modality: selectedModality,
      proficiency: selectedProficiency,
    }

    if (existingIdx !== -1) {
      updated[existingIdx] = newEntry
    } else {
      updated.push(newEntry)
    }

    syncEntries(updated)
    if (selectedLang === 'OTHER_CUSTOM') {
      setCustomLang('')
    }
  }

  const handleRemoveLanguage = (langToRemove: string) => {
    const filtered = entries.filter(
      (item) => item.language.toLowerCase() !== langToRemove.toLowerCase()
    )
    syncEntries(filtered)
  }

  const handleUpdateRow = (
    idx: number,
    field: 'modality' | 'proficiency',
    value: string
  ) => {
    const updated = entries.map((item, i) => {
      if (i !== idx) return item
      return {
        ...item,
        [field]: value,
      }
    })
    syncEntries(updated)
  }

  return (
    <div className="space-y-4 pt-4 border-t border-slate-300">
      <input type="hidden" name={name} value={JSON.stringify(entries)} />

      <div>
        <label className="block text-sm font-bold text-slate-800">
          {title}
        </label>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Active Languages List */}
      <div className="space-y-2.5">
        {entries.map((entry, idx) => (
          <div
            key={`${entry.language}-${idx}`}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white border-2 border-slate-300 shadow-2xs border-slate-300"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center text-xs font-extrabold shrink-0">
                🌐
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                {entry.language}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={entry.modality}
                onChange={(e) =>
                  handleUpdateRow(idx, 'modality', e.target.value)
                }
                className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                {LANGUAGE_MODALITIES.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </select>

              <select
                value={entry.proficiency}
                onChange={(e) =>
                  handleUpdateRow(idx, 'proficiency', e.target.value)
                }
                className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-extrabold text-indigo-700 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                {LANGUAGE_PROFICIENCIES.map((prof) => (
                  <option key={prof} value={prof}>
                    {prof}
                  </option>
                ))}
              </select>

              {entries.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(entry.language)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Remove language"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add New Language Row */}
      <div className="p-4 rounded-xl bg-slate-100/80 border-2 border-slate-300/90 space-y-3 border-slate-300">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
          + Add Another Language
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          <div className="sm:col-span-4">
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              {STANDARD_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
              <option value="OTHER_CUSTOM">+ Other Language (Custom)...</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedModality}
              onChange={(e) =>
                setSelectedModality(e.target.value as LanguageModality)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              {LANGUAGE_MODALITIES.map((mod) => (
                <option key={mod} value={mod}>
                  {mod}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedProficiency}
              onChange={(e) =>
                setSelectedProficiency(e.target.value as LanguageProficiency)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              {LANGUAGE_PROFICIENCIES.map((prof) => (
                <option key={prof} value={prof}>
                  {prof}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={handleAddLanguage}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors shadow-2xs cursor-pointer"
            >
              + Add
            </button>
          </div>
        </div>

        {selectedLang === 'OTHER_CUSTOM' && (
          <div className="pt-1">
            <input
              type="text"
              value={customLang}
              onChange={(e) => setCustomLang(e.target.value)}
              placeholder="Enter custom language name (e.g., Swahili, Bengali, Farsi)..."
              className="w-full sm:w-1/2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  )
}