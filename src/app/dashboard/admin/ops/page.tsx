'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  getAdminOpsDashboardData,
  updateOpsWorkItem,
  replyToCustomerFromOpsConsole,
  pushWorkItemToAzureDevOps,
  runLiveBehavioralHeuristicScan,
  executeBehavioralEnforcement,
  seedSampleOpsAndBehavioralItems,
  type OpsWorkItem,
  type WorkItemStatus,
  type WorkItemPriority,
  type BehavioralFlagItem,
} from '@/app/dashboard/admin-actions'

export default function AdminOpsCommandCenterPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'tickets' | 'behavioral'>('tickets')

  const [workItems, setWorkItems] = useState<OpsWorkItem[]>([])
  const [behavioralFlags, setBehavioralFlags] = useState<BehavioralFlagItem[]>([])
  const [selectedWorkItem, setSelectedWorkItem] = useState<OpsWorkItem | null>(null)

  // Unified Command Bar Filters (Work Items)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Behavioral Filters
  const [flagStatusFilter, setFlagStatusFilter] = useState<string>('all')
  const [flagSeverityFilter, setFlagSeverityFilter] = useState<string>('all')

  // Drawer Action Inputs
  const [internalNoteInput, setInternalNoteInput] = useState('')
  const [customerReplyInput, setCustomerReplyInput] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const loadOpsData = useCallback(async () => {
    setIsLoading(true)
    const res = await getAdminOpsDashboardData()
    if (!res.error) {
      setWorkItems(res.workItems || [])
      setBehavioralFlags(res.behavioralFlags || [])
      if (res.workItems && res.workItems.length > 0 && !selectedWorkItem) {
        setSelectedWorkItem(res.workItems[0])
      }
    }
    setIsLoading(false)
  }, [selectedWorkItem])

  useEffect(() => {
    loadOpsData()
  }, [loadOpsData])

  const handleStatusOrPriorityChange = async (
    itemId: string,
    updates: { status?: WorkItemStatus; priority?: WorkItemPriority }
  ) => {
    setIsBusy(true)
    setFeedback(null)
    const res = await updateOpsWorkItem(itemId, updates)
    setIsBusy(false)

    if (res.error) {
      setFeedback({ type: 'error', text: res.error })
    } else if (res.workItems) {
      setWorkItems(res.workItems)
      const updated = res.workItems.find((w) => w.id === itemId) || null
      setSelectedWorkItem(updated)
      setFeedback({ type: 'success', text: res.message || 'Updated work item.' })
    }
  }

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWorkItem || !internalNoteInput.trim()) return

    setIsBusy(true)
    setFeedback(null)
    const res = await updateOpsWorkItem(selectedWorkItem.id, {
      internalNoteText: internalNoteInput,
    })
    setIsBusy(false)

    if (res.error) {
      setFeedback({ type: 'error', text: res.error })
    } else if (res.workItems) {
      setInternalNoteInput('')
      setWorkItems(res.workItems)
      const updated =
        res.workItems.find((w) => w.id === selectedWorkItem.id) || null
      setSelectedWorkItem(updated)
      setFeedback({
        type: 'success',
        text: '✓ Internal engineering note logged on ' + selectedWorkItem.id,
      })
    }
  }

  const handleSendCustomerReply = async (
    nextStatus: WorkItemStatus = 'waiting_customer'
  ) => {
    if (!selectedWorkItem || !customerReplyInput.trim()) return

    setIsBusy(true)
    setFeedback(null)
    const res = await replyToCustomerFromOpsConsole(
      selectedWorkItem.id,
      customerReplyInput,
      nextStatus
    )
    setIsBusy(false)

    if (res.error) {
      setFeedback({ type: 'error', text: res.error })
    } else if (res.workItems) {
      setCustomerReplyInput('')
      setWorkItems(res.workItems)
      const updated =
        res.workItems.find((w) => w.id === selectedWorkItem.id) || null
      setSelectedWorkItem(updated)
      setFeedback({
        type: 'success',
        text: res.message || '✓ Sent branded reply to customer.',
      })
    }
  }

  const handlePushToAdo = async (workItemId: string) => {
    setIsBusy(true)
    setFeedback(null)
    const res = await pushWorkItemToAzureDevOps(workItemId)
    setIsBusy(false)

    if (res.error) {
      setFeedback({ type: 'error', text: res.error })
    } else if (res.workItems) {
      setWorkItems(res.workItems)
      const updated = res.workItems.find((w) => w.id === workItemId) || null
      setSelectedWorkItem(updated)
      setFeedback({ type: 'success', text: res.message || 'Synced to ADO.' })
    }
  }

  const handleRunLiveScan = async () => {
    setIsBusy(true)
    setFeedback(null)
    const res = await runLiveBehavioralHeuristicScan()
    setIsBusy(false)

    if (res.behavioralFlags) {
      setBehavioralFlags(res.behavioralFlags)
      setFeedback({
        type: 'success',
        text: res.message || 'Live heuristic scan completed.',
      })
    }
  }

  const handleEnforcement = async (
    flagId: string,
    action:
      | 'dismiss'
      | 'hide_candidate_profile'
      | 'revoke_verification'
      | 'freeze_employer_credits'
  ) => {
    setIsBusy(true)
    setFeedback(null)
    const res = await executeBehavioralEnforcement(flagId, action)
    setIsBusy(false)

    if (res.error) {
      setFeedback({ type: 'error', text: res.error })
    } else if (res.behavioralFlags) {
      setBehavioralFlags(res.behavioralFlags)
      setFeedback({ type: 'success', text: res.message || 'Action applied.' })
    }
  }

  const handleSeedDemoItems = async () => {
    setIsBusy(true)
    setFeedback(null)
    const res = await seedSampleOpsAndBehavioralItems()
    setIsBusy(false)

    if (res.workItems) {
      setWorkItems(res.workItems)
      setBehavioralFlags(res.behavioralFlags || [])
      setSelectedWorkItem(res.workItems[0] || null)
      setFeedback({
        type: 'success',
        text: res.message || 'Sample work items generated.',
      })
    }
  }

  // Filtered Work Items
  const filteredWorkItems = workItems.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false
    if (typeFilter !== 'all' && item.work_item_type !== typeFilter) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const hay =
        `${item.id} ${item.subject} ${item.description} ${item.reporter_email} ${item.reporter_name} ${item.category}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  // Filtered Behavioral Flags
  const filteredFlags = behavioralFlags.filter((f) => {
    if (flagStatusFilter !== 'all' && f.status !== flagStatusFilter) return false
    if (flagSeverityFilter !== 'all' && f.severity !== flagSeverityFilter)
      return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const hay =
        `${f.id} ${f.actor_email} ${f.summary} ${f.evidence_snippet} ${f.flag_type}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  const openTicketCount = workItems.filter((w) => w.status !== 'resolved').length
  const p0TicketCount = workItems.filter(
    (w) => w.priority === 'P0_Critical' && w.status !== 'resolved'
  ).length
  const openFlagsCount = behavioralFlags.filter((f) => f.status === 'open').length

  return (
    <div className="max-w-7xl mx-auto py-4 space-y-6">
      {/* Dark Slate + Gold Trim Command Center Header */}
      <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 border-2 border-amber-500 shadow-sm ring-1 ring-amber-400/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-wider">
              <span className="text-amber-300">
                ⚡ Special Sauce™ Ops &amp; Trust Command Center
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400">
                Azure DevOps-Style Triage &amp; Behavioral Radar
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Support Work Items, Bug Triage &amp; Behavioral Flags
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Manage incoming support tickets and bug reports with structured workflow states, reply directly to customers via branded Resend emails without cluttering your inbox, and enforce anti-harvesting &amp; Terms of Service guardrails.
            </p>
          </div>

          {/* Live Queue Telemetry Counters */}
          <div className="grid grid-cols-3 gap-3 shrink-0 bg-slate-800/90 border border-slate-700 rounded-2xl p-4 text-center">
            <div className="px-2">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Open Tickets
              </span>
              <span className="text-xl font-black text-white mt-0.5 block">
                {openTicketCount}
              </span>
            </div>
            <div className="px-2 border-x border-slate-700">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                P0 Critical
              </span>
              <span className="text-xl font-black text-amber-300 mt-0.5 block">
                {p0TicketCount}
              </span>
            </div>
            <div className="px-2">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Open Flags
              </span>
              <span className="text-xl font-black text-rose-400 mt-0.5 block">
                {openFlagsCount}
              </span>
            </div>
          </div>
        </div>

        {/* Mode Switcher & Quick QA Actions */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('tickets')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'tickets'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              1. Service Desk &amp; Bug Work Items ({workItems.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('behavioral')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'behavioral'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              2. Behavioral &amp; ToS Flag Radar ({behavioralFlags.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={handleRunLiveScan}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
            >
              🔍 Run Live Heuristic DB Scan
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={handleSeedDemoItems}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
            >
              + Seed Sample Ticket &amp; Flag
            </button>

            <Link
              href="/dashboard"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-extrabold transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-extrabold border flex items-center justify-between ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 font-black cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Single-Row Unified Command Bar */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs">
        {activeTab === 'tickets' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Search Work Item ID, Email, or Keyword
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. TKT-849201, DNS, e@test.com..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Workflow State
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800"
              >
                <option value="all">All States ({workItems.length})</option>
                <option value="new">New / Unassigned</option>
                <option value="triaged">Triaged / Active</option>
                <option value="waiting_customer">Waiting on Customer</option>
                <option value="resolved">Resolved / Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Priority / SLA
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800"
              >
                <option value="all">All Priorities</option>
                <option value="P0_Critical">P0 — Critical / Enterprise</option>
                <option value="P1_High">P1 — High</option>
                <option value="P2_Normal">P2 — Normal</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Work Item Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800"
              >
                <option value="all">All Types</option>
                <option value="Support_Ticket">Support Tickets</option>
                <option value="Bug_Defect">Bug / Defect Reports</option>
                <option value="Feature_Request">Feature Requests</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Search Flag ID, Email, Domain, or Evidence
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actor email, domain, or rule..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Flag Status
              </label>
              <select
                value={flagStatusFilter}
                onChange={(e) => setFlagStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800"
              >
                <option value="all">All Flags ({behavioralFlags.length})</option>
                <option value="open">Open / Needs Review</option>
                <option value="enforced">Enforced</option>
                <option value="dismissed">Dismissed (False Positive)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Severity Level
              </label>
              <select
                value={flagSeverityFilter}
                onChange={(e) => setFlagSeverityFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800"
              >
                <option value="all">All Severities</option>
                <option value="high">High Severity (Immediate Review)</option>
                <option value="medium">Medium Severity</option>
                <option value="low">Low Severity</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1 CONTENT: SERVICE DESK & WORK ITEM QUEUE */}
      {activeTab === 'tickets' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Work Items Queue List */}
          <div className="lg:col-span-5 space-y-3">
            {isLoading ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-xs font-bold text-slate-400">
                Loading Service Desk Work Items...
              </div>
            ) : filteredWorkItems.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center space-y-3">
                <p className="text-sm font-black text-slate-800">
                  No Work Items in Queue
                </p>
                <p className="text-xs text-slate-500">
                  Submit a ticket via <code>/dashboard/support</code>, click the top-bar <strong>🐞 Feedback</strong> button, or click <strong>+ Seed Sample Ticket &amp; Flag</strong> above to test!
                </p>
              </div>
            ) : (
              filteredWorkItems.map((item) => {
                const isSelected = selectedWorkItem?.id === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedWorkItem(item)}
                    className={`w-full text-left rounded-2xl p-4 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-2 border-amber-500 shadow-md'
                        : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono text-[11px] font-black px-2 py-0.5 rounded ${
                            isSelected
                              ? 'bg-slate-800 text-amber-300'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {item.id}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                            item.priority === 'P0_Critical'
                              ? 'bg-rose-600 text-white'
                              : item.priority === 'P1_High'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.priority.replace('_', ' ')}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          item.status === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                            : item.status === 'waiting_customer'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                            : item.status === 'triaged'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3
                      className={`text-sm font-black line-clamp-1 ${
                        isSelected ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {item.subject}
                    </h3>

                    <p
                      className={`text-xs mt-1 line-clamp-2 ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {item.description}
                    </p>

                    <div
                      className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-bold ${
                        isSelected
                          ? 'border-slate-800 text-slate-400'
                          : 'border-slate-100 text-slate-400'
                      }`}
                    >
                      <span>
                        {item.reporter_role}: {item.reporter_email}
                      </span>
                      <span>
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Right Column: Active Work Item Triage & Customer Reply Console */}
          <div className="lg:col-span-7">
            {selectedWorkItem ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-900 text-amber-300">
                        {selectedWorkItem.id}
                      </span>
                      <span className="text-xs font-extrabold text-slate-500">
                        {selectedWorkItem.work_item_type.replace('_', ' ')} •{' '}
                        {selectedWorkItem.category}
                      </span>
                      {selectedWorkItem.ado_work_item_id && (
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          ✓ ADO #{selectedWorkItem.ado_work_item_id}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-black text-slate-900 pt-1">
                      {selectedWorkItem.subject}
                    </h2>
                  </div>

                  {/* State & Priority Controls */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <select
                      disabled={isBusy}
                      value={selectedWorkItem.status}
                      onChange={(e) =>
                        handleStatusOrPriorityChange(selectedWorkItem.id, {
                          status: e.target.value as WorkItemStatus,
                        })
                      }
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-900"
                    >
                      <option value="new">State: New</option>
                      <option value="triaged">State: Triaged / Active</option>
                      <option value="waiting_customer">
                        State: Waiting on Customer
                      </option>
                      <option value="resolved">State: Resolved / Closed</option>
                    </select>

                    <select
                      disabled={isBusy}
                      value={selectedWorkItem.priority}
                      onChange={(e) =>
                        handleStatusOrPriorityChange(selectedWorkItem.id, {
                          priority: e.target.value as WorkItemPriority,
                        })
                      }
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-900"
                    >
                      <option value="P0_Critical">P0 Critical</option>
                      <option value="P1_High">P1 High</option>
                      <option value="P2_Normal">P2 Normal</option>
                    </select>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handlePushToAdo(selectedWorkItem.id)}
                      className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold transition-colors cursor-pointer"
                    >
                      ↗ Push to Azure DevOps
                    </button>
                  </div>
                </div>

                {/* Reporter & Telemetry Metadata Box */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                      Reporter Account
                    </span>
                    <span className="font-bold text-slate-900">
                      {selectedWorkItem.reporter_name} (
                      {selectedWorkItem.reporter_email})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                      Role &amp; Organization Context
                    </span>
                    <span className="font-bold text-slate-900">
                      {selectedWorkItem.reporter_role}{' '}
                      {selectedWorkItem.organization_context
                        ? `• ${selectedWorkItem.organization_context}`
                        : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                      Reported Page URL
                    </span>
                    <code className="font-mono text-indigo-700 font-bold">
                      {selectedWorkItem.page_url || '/dashboard'}
                    </code>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                      Browser / Device Telemetry
                    </span>
                    <span className="text-slate-600 line-clamp-1">
                      {selectedWorkItem.user_agent || 'Standard Web Client'}
                    </span>
                  </div>
                </div>

                {/* Original Description */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Original User Submission
                  </span>
                  <div className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedWorkItem.description}
                  </div>
                </div>

                {/* Activity & Notes Timeline */}
                {selectedWorkItem.notes.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Work Item History &amp; Sent Replies (
                      {selectedWorkItem.notes.length})
                    </span>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {selectedWorkItem.notes.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl text-xs border ${
                            n.visibility === 'customer_reply'
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                              : 'bg-amber-50/70 border-amber-200 text-amber-950'
                          }`}
                        >
                          <div className="flex items-center justify-between font-extrabold mb-1">
                            <span>
                              {n.visibility === 'customer_reply'
                                ? '✉ Outbound Customer Email Reply'
                                : '🔒 Internal Engineering Note'}{' '}
                              ({n.author})
                            </span>
                            <span className="text-[10px] opacity-75">
                              {new Date(n.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed">
                            {n.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Two-Action Bottom Forms: Customer Email Reply + Internal Note */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                  {/* Direct Customer Email Reply Box */}
                  <div className="space-y-2">
                    <label className="block text-xs font-extrabold text-slate-800">
                      ✉ Reply to Customer via Branded Resend Email
                    </label>
                    <textarea
                      rows={3}
                      value={customerReplyInput}
                      onChange={(e) => setCustomerReplyInput(e.target.value)}
                      placeholder={`Write a response to ${selectedWorkItem.reporter_email}...`}
                      className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isBusy || !customerReplyInput.trim()}
                        onClick={() =>
                          handleSendCustomerReply('waiting_customer')
                        }
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Send &amp; Mark Waiting →
                      </button>
                      <button
                        type="button"
                        disabled={isBusy || !customerReplyInput.trim()}
                        onClick={() => handleSendCustomerReply('resolved')}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Send &amp; Resolve ✓
                      </button>
                    </div>
                  </div>

                  {/* Private Internal Engineering Note Box */}
                  <form onSubmit={handleAddInternalNote} className="space-y-2">
                    <label className="block text-xs font-extrabold text-slate-800">
                      🔒 Add Private Internal Note / Repro Steps
                    </label>
                    <textarea
                      rows={3}
                      value={internalNoteInput}
                      onChange={(e) => setInternalNoteInput(e.target.value)}
                      placeholder="Log root cause, commit hash, or internal triage notes..."
                      className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isBusy || !internalNoteInput.trim()}
                      className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Save Internal Engineering Note
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-xs font-bold text-slate-400">
                Select a Work Item from the left queue to inspect telemetry, log internal notes, or send a branded customer reply.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TAB 2 CONTENT: TRUST, SAFETY & BEHAVIORAL FLAG RADAR */
        <div className="space-y-4">
          {filteredFlags.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center space-y-3">
              <p className="text-base font-black text-slate-900">
                ✓ Zero Open Behavioral or ToS Flags
              </p>
              <p className="text-xs text-slate-500 max-w-xl mx-auto">
                Whenever a user attempts to send blocked phishing links/SSNs in a thread, hits the 5-Silent-Unlock anti-harvesting cap, or fails domain spoofing checks, the alert will land here automatically. Click <strong>🔍 Run Live Heuristic DB Scan</strong> above to audit existing records at any time.
              </p>
            </div>
          ) : (
            filteredFlags.map((flag) => (
              <div
                key={flag.id}
                className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-slate-900 text-amber-300">
                      {flag.id}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded ${
                        flag.severity === 'high'
                          ? 'bg-rose-600 text-white'
                          : flag.severity === 'medium'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {flag.severity} Severity
                    </span>
                    <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded">
                      {flag.flag_type.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        flag.status === 'enforced'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : flag.status === 'dismissed'
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      Status: {flag.status}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      {new Date(flag.created_at).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900">
                    {flag.summary}
                  </h3>

                  <div className="text-xs font-bold text-slate-600">
                    Actor: <code className="font-mono">{flag.actor_email}</code>{' '}
                    ({flag.actor_role.toUpperCase()})
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700">
                    {flag.evidence_snippet}
                  </div>

                  {flag.enforcement_taken && (
                    <div className="text-xs font-extrabold text-emerald-700">
                      ✓ Enforcement Logged: {flag.enforcement_taken}
                    </div>
                  )}
                </div>

                {/* 1-Click Trust & Safety Enforcement Controls */}
                <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
                  {flag.actor_role === 'candidate' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        handleEnforcement(flag.id, 'hide_candidate_profile')
                      }
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      🚫 Hide Candidate from Search
                    </button>
                  )}

                  {flag.actor_role === 'employer' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        handleEnforcement(flag.id, 'freeze_employer_credits')
                      }
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      ⏸ Freeze Employer Pitch Credits
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      handleEnforcement(flag.id, 'revoke_verification')
                    }
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    🔒 Revoke Verification Badge
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleEnforcement(flag.id, 'dismiss')}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    ✓ Dismiss Flag (False Positive)
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}