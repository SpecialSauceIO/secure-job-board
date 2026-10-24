'use client'

import { useState, useMemo } from 'react'

export interface AnalyticsRecordItem {
  id: string
  referenceId: string
  roleTitle: string
  channel: 'Inbound Application' | 'Outbound Pitch'
  counterpartyId: string
  matchScore: number | null
  status: string
  vaultStage: string
  createdAt?: string
}

export default function DashboardAnalyticsReport({
  mode,
  orgOrBlindId,
  activeRolesCount = 0,
  creditsRemaining = 0,
  records,
}: {
  mode: 'employer' | 'candidate'
  orgOrBlindId: string
  activeRolesCount?: number
  creditsRemaining?: number
  records: AnalyticsRecordItem[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [channelFilter, setChannelFilter] = useState<'all' | 'inbound' | 'pitch'>('all')

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (channelFilter === 'inbound') return r.channel === 'Inbound Application'
      if (channelFilter === 'pitch') return r.channel === 'Outbound Pitch'
      return true
    })
  }, [records, channelFilter])

  const stats = useMemo(() => {
    const total = filteredRecords.length
    const inbound = filteredRecords.filter((r) => r.channel === 'Inbound Application').length
    const pitches = filteredRecords.filter((r) => r.channel === 'Outbound Pitch').length
    const scored = filteredRecords.filter((r) => typeof r.matchScore === 'number' && r.matchScore > 0)
    const avgScore =
      scored.length > 0
        ? Math.round(scored.reduce((acc, r) => acc + (r.matchScore || 0), 0) / scored.length)
        : 0
    const stage1 = filteredRecords.filter((r) => r.vaultStage.includes('Stage 1') || r.vaultStage.includes('Stage 2')).length
    const stage2 = filteredRecords.filter((r) => r.vaultStage.includes('Stage 2')).length
    const archived = filteredRecords.filter((r) => r.status === 'rejected' || r.status === 'declined').length

    return { total, inbound, pitches, avgScore, stage1, stage2, archived }
  }, [filteredRecords])

  const handleExportCsv = () => {
    const headers = [
      'Reference ID',
      'Channel',
      'Role Title',
      mode === 'employer' ? 'Candidate Blind ID' : 'Organization / Role Ref',
      '5-Point AI Match %',
      'Vault Stage',
      'Decision Status',
      'Account Ref',
    ]

    const escapeCsv = (val: any) => {
      const s = String(val ?? '').replace(/"/g, '""')
      return `"${s}"`
    }

    const rows = filteredRecords.map((r) => [
      escapeCsv(r.referenceId),
      escapeCsv(r.channel),
      escapeCsv(r.roleTitle),
      escapeCsv(r.counterpartyId),
      escapeCsv(r.matchScore !== null ? `${r.matchScore}%` : 'N/A'),
      escapeCsv(r.vaultStage),
      escapeCsv(r.status.toUpperCase()),
      escapeCsv(orgOrBlindId),
    ])

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const dateStamp = new Date().toISOString().slice(0, 10)
    link.href = url
    link.setAttribute(
      'download',
      `special-sauce-${mode}-report-${dateStamp}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-xs overflow-hidden">
      <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            {mode === 'employer' ? 'Hiring Funnel & ROI Reporting' : 'Application & Match Reporting'}
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-extrabold">
            {stats.total} Total Records
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-extrabold">
            Avg AI Fit: {stats.avgScore > 0 ? `${stats.avgScore}%` : '—'}
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-sky-900 text-xs font-extrabold">
            {stats.stage1} Unlocked • {stats.stage2} Vault Released
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredRecords.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <span>⬇ Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-2 border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            <span>{isOpen ? 'Hide Report' : 'View Funnel Report'}</span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="px-6 py-5 bg-slate-50/80 border-t-2 border-slate-200 space-y-4 animate-in fade-in duration-150">
          {/* Funnel KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-300">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {mode === 'employer' ? 'Inbound Apps' : 'Apps Submitted'}
              </span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">
                {stats.inbound}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-300">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {mode === 'employer' ? 'Outbound Pitches' : 'Pitches Received'}
              </span>
              <span className="text-xl font-black text-indigo-700 mt-0.5 block">
                {stats.pitches}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-300">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Avg 5-Point Fit
              </span>
              <span className="text-xl font-black text-emerald-700 mt-0.5 block">
                {stats.avgScore > 0 ? `${stats.avgScore}%` : '—'}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-300">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Private Chat Open
              </span>
              <span className="text-xl font-black text-sky-700 mt-0.5 block">
                {stats.stage1}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-300">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Full Resume Shared
              </span>
              <span className="text-xl font-black text-violet-700 mt-0.5 block">
                {stats.stage2}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-300">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {mode === 'employer' ? 'Active Roles / Credits' : 'Archived / Declined'}
              </span>
              <span className="text-xl font-black text-slate-700 mt-0.5 block">
                {mode === 'employer'
                  ? `${activeRolesCount} / ${creditsRemaining}`
                  : stats.archived}
              </span>
            </div>
          </div>

          {/* Filter & Ledger Table */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {(['all', 'inbound', 'pitch'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setChannelFilter(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold border transition-colors cursor-pointer ${
                    channelFilter === tab
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {tab === 'all'
                    ? 'All Channels'
                    : tab === 'inbound'
                    ? 'Inbound Applications'
                    : 'Outbound Pitches'}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-500">
              Report Ref: {orgOrBlindId}
            </span>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-slate-300 text-center text-xs font-bold text-slate-500">
              No records match the selected channel filter yet.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-300 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-3.5">Ref ID</th>
                    <th className="py-2.5 px-3.5">Channel</th>
                    <th className="py-2.5 px-3.5">Role</th>
                    <th className="py-2.5 px-3.5">
                      {mode === 'employer' ? 'Candidate Blind ID' : 'Role / Org Ref'}
                    </th>
                    <th className="py-2.5 px-3.5">AI Fit</th>
                    <th className="py-2.5 px-3.5">Vault Stage</th>
                    <th className="py-2.5 px-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                  {filteredRecords.slice(0, 15).map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">
                        {rec.referenceId}
                      </td>
                      <td className="py-2.5 px-3.5">{rec.channel}</td>
                      <td className="py-2.5 px-3.5 font-bold text-slate-900 truncate max-w-[200px]">
                        {rec.roleTitle}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-indigo-700 font-bold">
                        {rec.counterpartyId}
                      </td>
                      <td className="py-2.5 px-3.5 font-extrabold">
                        {rec.matchScore !== null ? `${rec.matchScore}%` : '—'}
                      </td>
                      <td className="py-2.5 px-3.5">{rec.vaultStage}</td>
                      <td className="py-2.5 px-3.5 uppercase text-[11px] font-extrabold">
                        {rec.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
