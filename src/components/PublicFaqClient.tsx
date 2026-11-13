'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { FAQ } from '@/constants/faqs'
export default function PublicFaqClient({ faqs }: { faqs: FAQ[] }) {
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'candidate' | 'employer'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id || null)
  const categories = useMemo(() => {
    const set = new Set<string>()
    faqs.forEach((f) => {
      const matchesTarget = audienceFilter === 'all' || f.target === 'all' || f.target === audienceFilter
      if (matchesTarget && f.category) set.add(f.category)
    })
    return ['All', ...Array.from(set)]
  }, [faqs, audienceFilter])
  const hasActiveFilters = audienceFilter !== 'all' || categoryFilter !== 'All' || searchQuery.trim() !== ''
  const resetAllFilters = () => {
    setAudienceFilter('all')
    setCategoryFilter('All')
    setSearchQuery('')
  }
  const filteredFaqs = useMemo(() => {
    const rawTrimmed = searchQuery.trim().toLowerCase()
    const queryTokens = rawTrimmed ? rawTrimmed.split(/\s+/).filter(Boolean) : []
    const matchesToken = (haystack: string, needle: string) => {
      if (!needle) return true
      const h = haystack.toLowerCase()
      if (needle.length <= 3 || /^[a-z0-9+.#/-]+$/i.test(needle)) {
        const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const boundaryRe = new RegExp('(?:^|[^a-z0-9])' + escaped + '(?:$|[^a-z0-9])', 'i')
        if (boundaryRe.test(h)) return true
        return needle.length > 3 && h.includes(needle)
      }
      return h.includes(needle)
    }
    return faqs.filter((f) => {
      const matchesTarget = audienceFilter === 'all' || f.target === 'all' || f.target === audienceFilter
      if (matchesTarget === false) return false
      if (categoryFilter !== 'All' && f.category !== categoryFilter) return false
      if (queryTokens.length === 0) return true
      const combined = f.question + ' ' + f.answer + ' ' + f.category
      if (rawTrimmed.includes(' ') && combined.toLowerCase().includes(rawTrimmed)) return true
      return queryTokens.every((tok) => matchesToken(combined, tok))
    })
  }, [faqs, audienceFilter, categoryFilter, searchQuery])
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 mb-3">Special Sauce™ Knowledge Base</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</h1>
        <p className="mt-3 text-base text-slate-600">Clear answers on how Special Sauce™ verifies every person and business, protects your personal information, and connects Professionals and Employers.</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            {([{ id: 'all', label: 'All Topics' }, { id: 'candidate', label: 'For Professionals' }, { id: 'employer', label: 'For Employers' }] as const).map((tab) => (
              <button key={tab.id} type="button" onClick={() => { setAudienceFilter(tab.id); setCategoryFilter('All') }} className={audienceFilter === tab.id ? 'px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all bg-slate-900 text-white shadow-sm' : 'px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all text-slate-600 hover:text-slate-900'}>{tab.label}</button>
            ))}
          </div>
          <div className="relative flex-1 max-w-md">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search questions, pricing, privacy, verification..." className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-4 pr-16 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none" />
            {searchQuery.trim() !== '' && (
              <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors">Clear</button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button key={cat} type="button" onClick={() => setCategoryFilter(cat)} className={categoryFilter === cat ? 'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors bg-blue-600 text-white border-blue-600' : 'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}>{cat}</button>
            ))}
          </div>
          {hasActiveFilters && (
            <button type="button" onClick={resetAllFilters} className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors">Reset Filters</button>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
            <p className="text-slate-500 text-sm">No questions matched your search. Try clearing the search box or switching categories.</p>
            {hasActiveFilters && (
              <button type="button" onClick={resetAllFilters} className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors">Clear Search &amp; Filters</button>
            )}
          </div>
        ) : filteredFaqs.map((item) => {
          const isOpen = openId === item.id
          const badgeLabel = item.target === 'candidate' ? 'Professionals' : item.target === 'employer' ? 'Employers' : 'All Members'
          return (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
              <button type="button" onClick={() => setOpenId(isOpen ? null : item.id)} className="w-full px-5 py-4 text-left flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">{item.category}</span>
                    <span className="inline-block text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">{badgeLabel}</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900">{item.question}</h2>
                </div>
                <span className="mt-1 text-slate-400 font-bold text-lg select-none">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && <div className="px-5 pb-5 pt-1 text-sm text-slate-700 leading-relaxed whitespace-pre-line border-t border-slate-100">{item.answer}</div>}
            </div>
          )
        })}
      </div>
      <div className="mt-10 bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">Ready to get verified?</h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">Explore our platform workflows, review our security standards, or view transparent plans.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/workflows" className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold border border-slate-700 transition-colors">Platform Workflows</Link>
          <Link href="/pricing" className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-colors">View Plans &amp; Pricing</Link>
        </div>
      </div>
    </div>
  )
}
