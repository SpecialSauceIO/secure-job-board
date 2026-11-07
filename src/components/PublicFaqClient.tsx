'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { FAQ } from '@/constants/faqs'
export default function PublicFaqClient({ faqs }: { faqs: FAQ[] }) {
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id || null)
  const categories = useMemo(() => {
    const set = new Set<string>()
    faqs.forEach((f) => { if (f.category) set.add(f.category) })
    return ['All', ...Array.from(set)]
  }, [faqs])
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return faqs.filter((f) => {
      if (categoryFilter !== 'All' && f.category !== categoryFilter) return false
      if (q === '') return true
      return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
    })
  }, [faqs, categoryFilter, searchQuery])
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 mb-3">Special Sauce™ Knowledge Base</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</h1>
        <p className="mt-3 text-base text-slate-600">Clear answers on how Special Sauce™ verifies every person and business, protects your personal information, and connects Professionals and Employers.</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm mb-8 space-y-4">
        <div className="relative w-full">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search questions, pricing, privacy, verification..." className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((cat) => (
            <button key={cat} type="button" onClick={() => setCategoryFilter(cat)} className={categoryFilter === cat ? 'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors bg-blue-600 text-white border-blue-600' : 'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}>{cat}</button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">No questions matched your search. Try clearing the search box or switching categories.</div>
        ) : filteredFaqs.map((item) => {
          const isOpen = openId === item.id
          return (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
              <button type="button" onClick={() => setOpenId(isOpen ? null : item.id)} className="w-full px-5 py-4 text-left flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="space-y-1">
                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">{item.category}</span>
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
