'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import {
  sendApplicationMessage,
  releaseCandidateVaultToEmployer,
  getVaultReleasedResumeUrl,
  getApplicationThreadState,
  proposeTrialToHireTerms,
  respondToTrialToHireTerms,
  withdrawTrialToHireTerms,
  ThreadMessage,
  TrialToHireHandshake,
} from '@/app/dashboard/messaging-actions'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

// Synthesize a clean, pleasant 2-note harmonic chime using the browser's native Web Audio API
function playIncomingMessageChime() {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    // Note 1: A5 (880 Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880, ctx.currentTime)
    gain1.gain.setValueAtTime(0.08, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.18)

    // Note 2: E6 (1318.5 Hz)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.11)
    gain2.gain.setValueAtTime(0.09, ctx.currentTime + 0.11)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(ctx.currentTime + 0.11)
    osc2.stop(ctx.currentTime + 0.42)
  } catch {
    // Ignore if browser autoplay policy blocks audio prior to first click
  }
}

export default function SecureMessageThread({
  applicationId,
  referenceId,
  viewerRole,
  initialMessages = [],
  initialVaultReleased = false,
  employerName = 'Verified Employer',
  candidateDisplayName = 'Verified Professional',
  candidateFullName: initialCandidateFullName,
  candidateEmail: initialCandidateEmail,
  employerEmail: initialEmployerEmail,
  initialResumeUrl,
  initialTrialToHire = null,
}: {
  applicationId: string
  referenceId: string
  viewerRole: 'employer' | 'candidate'
  initialMessages?: ThreadMessage[]
  initialVaultReleased?: boolean
  employerName?: string
  employerDomain?: string | null;
  candidateDisplayName?: string
  candidateFullName?: string | null
  candidateEmail?: string | null
  employerEmail?: string | null
  initialResumeUrl?: string | null
  initialTrialToHire?: TrialToHireHandshake | null
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(
    Array.isArray(initialMessages) ? initialMessages : []
  )
  const [vaultReleased, setVaultReleased] = useState<boolean>(
    Boolean(initialVaultReleased)
  )
  const [candidateFullName, setCandidateFullName] = useState<string | null>(
    initialCandidateFullName || null
  )
  const [candidateEmail, setCandidateEmail] = useState<string | null>(
    initialCandidateEmail || null
  )
  const [employerEmail, setEmployerEmail] = useState<string | null>(
    initialEmployerEmail || null
  )
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [justReceivedAlert, setJustReceivedAlert] = useState(false)
  const [liveResumeUrl, setLiveResumeUrl] = useState<string | null>(
    initialResumeUrl || null
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [trialToHire, setTrialToHire] = useState<TrialToHireHandshake | null>(
    initialTrialToHire || null
  )
  const [jobEmploymentType, setJobEmploymentType] = useState<string | null>(null)
  const [jobEorTrack, setJobEorTrack] = useState<string>('trial_to_hire_90d')
  const [jobEorDurationMonths, setJobEorDurationMonths] = useState<number>(6)
  const [jobEquipmentPolicy, setJobEquipmentPolicy] = useState<string>('No Equipment Needed / Not Applicable')
  const roleDefaultsAppliedRef = useRef<boolean>(false)
  const [employerPlanActive, setEmployerPlanActive] = useState<boolean>(true)
  const [showTrialDrawer, setShowTrialDrawer] = useState(false)
  const [trialPayRate, setTrialPayRate] = useState('65')
  const [trialWeeklyHours, setTrialWeeklyHours] = useState('40')
  const [trialStartDate, setTrialStartDate] = useState(() => {
    const d = new Date(Date.now() + 14 * 86400000)
    return d.toISOString().slice(0, 10)
  })
  const [trialWorkState, setTrialWorkState] = useState('TX')
  const [trialBgCheck, setTrialBgCheck] = useState(true)
  const [trialDrugCheck, setTrialDrugCheck] = useState(false)
  const [trialScopeNote, setTrialScopeNote] = useState('')
  const [trialWcCode, setTrialWcCode] = useState('8810')
  const [legalEntityName, setLegalEntityName] = useState(initialTrialToHire?.legal_entity_name || employerName || '')
  const [timecardApproverName, setTimecardApproverName] = useState(initialTrialToHire?.timecard_approver_name || '')
  const [timecardApproverEmail, setTimecardApproverEmail] = useState(initialTrialToHire?.timecard_approver_email || initialEmployerEmail || '')
  const [supervisorName, setSupervisorName] = useState(initialTrialToHire?.supervisor_name || '')
  const [clientPoNumber, setClientPoNumber] = useState(initialTrialToHire?.po_number || '')
  const [invoiceCcEmail, setInvoiceCcEmail] = useState(initialTrialToHire?.invoice_cc_email || '')
  const [diffWorksite, setDiffWorksite] = useState(Boolean(initialTrialToHire?.worksite_address))
  const [worksiteStreet1, setWorksiteStreet1] = useState(initialTrialToHire?.worksite_address?.street1 || '')
  const [worksiteCity, setWorksiteCity] = useState(initialTrialToHire?.worksite_address?.city || '')
  const [worksiteState, setWorksiteState] = useState(initialTrialToHire?.worksite_address?.state || initialTrialToHire?.work_state || 'TX')
  const [worksiteZip, setWorksiteZip] = useState(initialTrialToHire?.worksite_address?.postalcode || '')
  const [empBillStreet1, setEmpBillStreet1] = useState('')
  const [empBillCity, setEmpBillCity] = useState('')
  const [empBillState, setEmpBillState] = useState('TX')
  const [empBillZip, setEmpBillZip] = useState('')
  const [profResStreet1, setProfResStreet1] = useState('')
  const [profResStreet2, setProfResStreet2] = useState('')
  const [profResCity, setProfResCity] = useState('')
  const [profResState, setProfResState] = useState(initialTrialToHire?.work_state || 'TX')
  const [profResZip, setProfResZip] = useState('')
  const [profMobilePhone, setProfMobilePhone] = useState('')
  const [isSubmittingTrial, setIsSubmittingTrial] = useState(false)
  const [showProfOfferModal, setShowProfOfferModal] = useState(false)
  const [pendingOfferConfirm, setPendingOfferConfirm] = useState<'propose' | 'accept' | 'decline' | 'withdraw' | null>(null)
  const [offerIntentChecked, setOfferIntentChecked] = useState(false)
  const pendingModalRef = useRef<boolean>(false)
  const openOfferConfirm = (action: 'propose' | 'accept' | 'decline' | 'withdraw') => {
    pendingModalRef.current = true
    if (typeof window !== 'undefined') {
      ;(window as unknown as { __ssNavPendingUntil?: number }).__ssNavPendingUntil = Date.now() + 60000
    }
    setOfferIntentChecked(false)
    setPendingOfferConfirm(action)
  }

  useEffect(() => {
    const anyModalOpen = Boolean(pendingOfferConfirm || showTrialDrawer || showProfOfferModal)
    pendingModalRef.current = anyModalOpen
    if (!anyModalOpen && typeof window !== 'undefined') {
      ;(window as unknown as { __ssNavPendingUntil?: number }).__ssNavPendingUntil = 0
    }
  }, [pendingOfferConfirm, showTrialDrawer, showProfOfferModal])

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const prevMsgCountRef = useRef<number>(messages.length)
  const hasHydratedRef = useRef<boolean>(false)
  const syncInFlightRef = useRef<boolean>(false)
  const soundEnabledRef = useRef<boolean>(soundEnabled)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  // Keep state in sync if parent re-fetches applications list
  useEffect(() => {
    if (
      Array.isArray(initialMessages) &&
      initialMessages.length > messages.length
    ) {
      setMessages(initialMessages)
    }
  }, [initialMessages, messages.length])

  useEffect(() => {
    if (initialVaultReleased && !vaultReleased) {
      setVaultReleased(true)
    }
  }, [initialVaultReleased, vaultReleased])

  useEffect(() => {
    if (
      initialTrialToHire &&
      (!trialToHire || initialTrialToHire.status !== trialToHire.status)
    ) {
      setTrialToHire(initialTrialToHire)
    }
  }, [initialTrialToHire, trialToHire])

  // Auto-scroll & chime when a new message from the OTHER party arrives
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight
      }

      const newestMsg = messages[messages.length - 1]
      if (
        hasHydratedRef.current &&
        newestMsg &&
        newestMsg.sender_role !== viewerRole
      ) {
        if (soundEnabledRef.current) {
          playIncomingMessageChime()
        }
        setJustReceivedAlert(true)
        setTimeout(() => setJustReceivedAlert(false), 4000)
      }
    }
    prevMsgCountRef.current = messages.length
    hasHydratedRef.current = true
  }, [messages, viewerRole])

  // Direct, uncached server state pull with in-flight deduplication
  const syncLatestThreadState = useCallback(async () => {
    if (!applicationId || syncInFlightRef.current || pendingModalRef.current) return
    syncInFlightRef.current = true
    try {
      const res = await getApplicationThreadState(applicationId, viewerRole)
      if (!res.error) {
        setMessages((prev) => {
          if (
            res.messages.length !== prev.length ||
            res.messages[res.messages.length - 1]?.id !==
              prev[prev.length - 1]?.id
          ) {
            return res.messages
          }
          return prev
        })
        setVaultReleased((prev) =>
          prev !== res.vaultReleased ? res.vaultReleased : prev
        )
        if (res.candidateFullName) setCandidateFullName(res.candidateFullName)
        if (res.candidateEmail) setCandidateEmail(res.candidateEmail)
        if (res.employerEmail) {
          setEmployerEmail(res.employerEmail)
          setTimecardApproverEmail((prev) => prev || res.orgTimecardApproverEmail || res.employerEmail || '')
        }
        if (res.trialToHire !== undefined) {
          const nextTrial = res.trialToHire || null
          setTrialToHire((prev) => (JSON.stringify(prev) === JSON.stringify(nextTrial) ? prev : nextTrial))
        }
        if (res.jobEmploymentType !== undefined) setJobEmploymentType(res.jobEmploymentType || null)
        if (res.jobEorTrack) setJobEorTrack(res.jobEorTrack)
        if (res.jobEorDurationMonths) setJobEorDurationMonths(res.jobEorDurationMonths)
        if (res.jobEquipmentPolicy) setJobEquipmentPolicy(res.jobEquipmentPolicy)
        if (!roleDefaultsAppliedRef.current && res.jobEorBgCheck !== undefined) {
          roleDefaultsAppliedRef.current = true
          setTrialBgCheck(Boolean(res.jobEorBgCheck))
          setTrialDrugCheck(Boolean(res.jobEorDrugCheck))
          if (!res.trialToHire) {
            if (res.suggestedHourlyRate) setTrialPayRate(String(res.suggestedHourlyRate))
            if (res.suggestedWeeklyHours) setTrialWeeklyHours(String(res.suggestedWeeklyHours))
            if (res.suggestedWorkState) setTrialWorkState(res.suggestedWorkState)
            if (res.orgLegalEntityName) setLegalEntityName(res.orgLegalEntityName)
            if (res.orgTimecardApproverName) setTimecardApproverName((prev) => prev || res.orgTimecardApproverName || '')
            if (res.orgTimecardApproverEmail) setTimecardApproverEmail(res.orgTimecardApproverEmail)
            if (res.orgBillingApEmail) setInvoiceCcEmail((prev) => prev || res.orgBillingApEmail || '')
            if (res.orgSupervisorName) setSupervisorName((prev) => prev || res.orgSupervisorName || '')
            if (res.orgPoNumber) setClientPoNumber((prev) => prev || res.orgPoNumber || '')
            if (res.orgWcCode) setTrialWcCode(res.orgWcCode)
            if (res.orgBillingStreet1) setEmpBillStreet1((prev) => prev || res.orgBillingStreet1 || '')
            if (res.orgBillingCity) setEmpBillCity((prev) => prev || res.orgBillingCity || '')
            if (res.orgBillingState) setEmpBillState(res.orgBillingState)
            if (res.orgBillingZip) setEmpBillZip((prev) => prev || res.orgBillingZip || '')
            if (typeof res.orgDiffWorksite === 'boolean') setDiffWorksite(res.orgDiffWorksite)
            if (res.orgWorksiteStreet1) setWorksiteStreet1((prev) => prev || res.orgWorksiteStreet1 || '')
            if (res.orgWorksiteCity) setWorksiteCity((prev) => prev || res.orgWorksiteCity || '')
            if (res.orgWorksiteState) setWorksiteState(res.orgWorksiteState)
            if (res.orgWorksiteZip) setWorksiteZip((prev) => prev || res.orgWorksiteZip || '')
          }
        }
        if (typeof res.employerPlanActive === 'boolean') setEmployerPlanActive(res.employerPlanActive)
      }
    } catch {
      // Ignore transient network hiccups during polling
    } finally {
      syncInFlightRef.current = false
    }
  }, [applicationId, viewerRole])

  // Subscribe to Instant WebSocket Broadcast + Postgres Changes + 2.5s Uncached Poll
  useEffect(() => {
    if (!applicationId) return

    syncLatestThreadState()

    const supabase = createClient()
    const channel = supabase
      .channel(`ss-live-thread-${applicationId}`)
      .on('broadcast', { event: 'thread-update' }, () => {
        syncLatestThreadState()
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
          filter: `id=eq.${applicationId}`,
        },
        () => {
          syncLatestThreadState()
        }
      )
      .subscribe()

    channelRef.current = channel

    const intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      syncLatestThreadState()
    }, 8000)

    return () => {
      clearInterval(intervalId)
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [applicationId, syncLatestThreadState])

  const broadcastInstantPing = async () => {
    try {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'thread-update',
          payload: { updatedAt: Date.now() },
        })
      }
    } catch {
      // Fallback polling handles it
    }
  }

  const hasEmployerMessaged = messages.some((m) => m.sender_role === 'employer')

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim() || isSending) return

    setIsSending(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const res = await sendApplicationMessage(applicationId, draft)
    if (res.error) {
      setErrorMsg(res.error)
    } else if (res.messages) {
      setMessages(res.messages)
      setDraft('')
      await broadcastInstantPing()
    }
    setIsSending(false)
  }

  const handleReleaseVault = async () => {
    if (isReleasing || vaultReleased) return
    setIsReleasing(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const res = await releaseCandidateVaultToEmployer(applicationId)
    if (res.error) {
      setErrorMsg(res.error)
    } else {
      setVaultReleased(true)
      setSuccessMsg(
        `Full Identity Vault (Resume PDF & Direct Email) released to ${employerName}!`
      )
      await syncLatestThreadState()
      await broadcastInstantPing()
    }
    setIsReleasing(false)
  }

  const handleOpenResume = async () => {
    if (liveResumeUrl) {
      window.open(liveResumeUrl, '_blank', 'noopener,noreferrer')
      return
    }
    const res = await getVaultReleasedResumeUrl(applicationId)
    if (res.error) {
      setErrorMsg(res.error)
    } else if (res.signedUrl) {
      setLiveResumeUrl(res.signedUrl)
      window.open(res.signedUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const parsedPay = Math.max(0, Number(trialPayRate) || 0)
  const parsedHrs = Math.min(60, Math.max(10, Math.round(Number(trialWeeklyHours) || 40)))
  const computedBillRate = Math.round(parsedPay * 1.28 * 100) / 100
  const agencyBillRate = Math.round(parsedPay * 1.55 * 100) / 100
  const est90DaySavings = Math.max(0, Math.round((agencyBillRate - computedBillRate) * parsedHrs * 13))

  const handleProposeTrial = async () => {
    setIsSubmittingTrial(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    const res = await proposeTrialToHireTerms(applicationId, {
      hourlyPayRate: parsedPay,
      weeklyHours: parsedHrs,
      targetStartDate: trialStartDate,
      workState: trialWorkState,
      requireBackgroundCheck: trialBgCheck,
      requireDrugScreening: trialDrugCheck,
      scopeNote: trialScopeNote,
      wcCode: trialWcCode,
      legalEntityName: legalEntityName.trim(),
      timecardApproverName: timecardApproverName.trim(),
      timecardApproverEmail: timecardApproverEmail.trim(),
      supervisorName: (supervisorName.trim() || timecardApproverName.trim()),
      poNumber: clientPoNumber.trim() || undefined,
      invoiceCcEmail: invoiceCcEmail.trim() || undefined,
      worksiteAddress:
        diffWorksite && worksiteStreet1.trim() && worksiteCity.trim() && worksiteZip.trim()
          ? { street1: worksiteStreet1.trim(), city: worksiteCity.trim(), state: worksiteState || trialWorkState, postalcode: worksiteZip.trim() }
          : undefined,
      employerAddress:
        empBillStreet1.trim() && empBillCity.trim() && empBillZip.trim()
          ? { street1: empBillStreet1.trim(), city: empBillCity.trim(), state: empBillState || trialWorkState, postalcode: empBillZip.trim() }
          : undefined,
    })
    if (res.error) {
      setErrorMsg(res.error)
    } else if (res.trialToHire) {
      setTrialToHire(res.trialToHire)
      setShowTrialDrawer(false)
      setSuccessMsg('Protected W-2 Contract-to-Hire offer sent to Professional.')
      await syncLatestThreadState()
      await broadcastInstantPing()
    }
    setIsSubmittingTrial(false)
  }

  const handleRespondTrial = async (decision: 'accept' | 'decline') => {
    setIsSubmittingTrial(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    const res = await respondToTrialToHireTerms(
      applicationId,
      decision,
      decision === 'accept'
        ? {
            street1: profResStreet1,
            street2: profResStreet2,
            city: profResCity,
            state: profResState || trialToHire?.work_state || 'TX',
            postalcode: profResZip,
            mobilePhone: profMobilePhone,
          }
        : undefined
    )
    if (res.error) {
      setErrorMsg(res.error)
    } else if (res.trialToHire) {
      setTrialToHire(res.trialToHire)
      setSuccessMsg(
        decision === 'accept'
          ? 'W-2 Contract-to-Hire accepted! Licensed US EOR onboarding has been dispatched.'
          : 'Notified Employer that you would like to discuss or adjust contract terms in chat.'
      )
      await syncLatestThreadState()
      await broadcastInstantPing()
    }
    setIsSubmittingTrial(false)
  }

  const handleWithdrawTrial = async () => {
    setIsSubmittingTrial(true)
    setErrorMsg(null)
    const res = await withdrawTrialToHireTerms(applicationId)
    if (res.error) {
      setErrorMsg(res.error)
    } else {
      setShowTrialDrawer(true)
      await syncLatestThreadState()
      await broadcastInstantPing()
    }
    setIsSubmittingTrial(false)
  }

  return (
    <div
      className={`rounded-2xl border bg-white overflow-hidden transition-all ${
        justReceivedAlert
          ? 'border-indigo-500 ring-4 ring-indigo-500/15 shadow-md'
          : 'border-slate-300 shadow-xs'
      }`}
    >
      {/* Top Vault Status Header */}
      <div
        className={`px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          vaultReleased
            ? 'bg-emerald-50/80 border-emerald-300'
            : 'bg-indigo-50/70 border-indigo-300'
        }`}
      >
        <div className="flex items-start sm:items-center gap-2.5">
          <span
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
              vaultReleased
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 text-white'
            }`}
          >
            {vaultReleased ? '🔓' : '🛡️'}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-slate-900">
                {vaultReleased
                  ? 'Resume Unlocked: Full Contact Info & PDF Shared'
                  : 'Private Chat Active: Your Name, Email & PDF Resume Remain Hidden'}
              </span>
              <span className="px-2 py-0.5 rounded bg-white/80 border border-slate-300 text-[10px] font-mono font-bold text-slate-600">
                {referenceId}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-[10px] font-extrabold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Sync
              </span>
              <button
                type="button"
                onClick={() => {
                  const next = !soundEnabled
                  setSoundEnabled(next)
                  if (next) playIncomingMessageChime()
                }}
                title={
                  soundEnabled
                    ? 'Audio chime enabled for incoming messages (Click to mute)'
                    : 'Audio chime muted (Click to enable & test chime)'
                }
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold transition-colors cursor-pointer ${
                  soundEnabled
                    ? 'bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-50'
                    : 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {soundEnabled ? '🔔 Chime On' : '🔕 Muted'}
              </button>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {vaultReleased
                ? viewerRole === 'employer'
                  ? 'Professional has released their full name, direct email, and signed PDF resume.'
                  : `You have released your direct contact details and PDF resume to ${employerName}.`
                : viewerRole === 'employer'
                ? 'To prevent passive resume harvesting, raw email & PDF resume remain vaulted until you message the professional and they choose to share it.'
                : `Your raw email & PDF resume are still hidden from ${employerName}. Chat below first, then click "Release Resume & Contact Vault" whenever you feel comfortable.`}
            </p>
          </div>
        </div>

        {/* Vault Release Button */}
        <div className="shrink-0">
          {viewerRole === 'candidate' && !vaultReleased && (
            <button
              type="button"
              disabled={isReleasing}
              onClick={handleReleaseVault}
              className="w-full sm:w-auto text-center justify-center px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isReleasing
                ? 'Releasing Vault...'
                : '🔓 Release Resume & Contact Vault'}
            </button>
          )}

          {viewerRole === 'employer' && vaultReleased && (
            <button
              type="button"
              onClick={handleOpenResume}
              className="w-full sm:w-auto justify-center px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              📄 View Unlocked PDF Resume
            </button>
          )}

          {viewerRole === 'employer' && !vaultReleased && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-bold">
              🔒 PDF Resume Vaulted (Message Professional First)
            </span>
          )}
        </div>
      </div>

      {/* Unlocked Contact Card (Only visible AFTER Professional clicks Release Vault) */}
      {vaultReleased && (
        <div className="px-4 py-2.5 bg-emerald-50/40 border-b border-emerald-300 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {candidateFullName && (
              <span>
                <strong className="text-slate-600">Professional:</strong>{' '}
                <span className="font-extrabold text-slate-900">
                  {candidateFullName}
                </span>
              </span>
            )}
            {candidateEmail && (
              <span>
                <strong className="text-slate-600">Professional Email:</strong>{' '}
                <a
                  href={`mailto:${candidateEmail}`}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  {candidateEmail}
                </a>
              </span>
            )}
            {employerEmail && (
              <span>
                <strong className="text-slate-600">Hiring Team Email:</strong>{' '}
                <a
                  href={`mailto:${employerEmail}`}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  {employerEmail}
                </a>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Protected 90-Day W-2 Trial-to-Hire Handshake (Stage 2 Vault Unlocked) */}
      {vaultReleased && (viewerRole === 'employer' || Boolean(trialToHire && ['proposed', 'accepted_pending_eor', 'converted_direct', 'ended'].includes(trialToHire.status))) && (
        <div className="px-4 py-3 bg-indigo-50/50 border-b border-indigo-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wide">
                🛡️{' '}
                {(trialToHire?.contract_track || jobEorTrack) === 'fixed_term_w2'
                  ? `Protected ${trialToHire?.duration_months || jobEorDurationMonths}-Month W-2 Contract`
                  : (trialToHire?.contract_track || jobEorTrack) === 'open_ended_w2'
                  ? 'Protected Open-Ended W-2 Contract'
                  : 'Protected W-2 Contract-to-Hire'}
              </span>
              {(trialToHire?.equipment_policy || jobEquipmentPolicy) !== 'No Equipment Needed / Not Applicable' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white text-slate-800 border border-slate-300 text-[10px] font-bold">
                  💻 {(trialToHire?.equipment_policy || jobEquipmentPolicy).replace(' (Laptop / Security Key)', '').replace(' (Virtual Desktop & Passkey Only)', '')}
                </span>
              )}
              <span className="text-[11px] font-semibold text-slate-700">
                Licensed US Employer of Record (W-2 payroll, I-9 &amp; Workers&apos; Comp){viewerRole === 'employer' ? ' • $0 conversion fee' : ''}
              </span>
            </div>

            {viewerRole === 'employer' && (!trialToHire || trialToHire.status === 'declined' || trialToHire.status === 'withdrawn') && (
              employerPlanActive ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="hidden md:inline text-[11px] font-bold text-slate-600 bg-white/80 border border-indigo-100 rounded-md px-2 py-1">
                    ${parsedPay.toFixed(2)}/hr W-2 (${computedBillRate.toFixed(2)}/hr all-in) • {parsedHrs} hrs/wk • {trialWorkState}
                  </span>
                  {parsedPay >= 15 && legalEntityName.trim().length >= 2 && timecardApproverName.trim().length >= 2 && timecardApproverEmail.trim().includes('@') && (
                    <button
                      type="button"
                      onClick={() => openOfferConfirm('propose')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-colors cursor-pointer"
                    >
                      ⚡ Review &amp; Send W-2 Offer
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowTrialDrawer(true)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    {legalEntityName.trim().length >= 2 && timecardApproverName.trim().length >= 2 && timecardApproverEmail.trim().includes('@') ? 'Edit Offer Details' : '⚡ Propose W-2 Offer'}
                  </button>
                </div>
              ) : (
                <Link
                  href="/dashboard/billing"
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold transition-colors"
                >
                  Activate Monthly Plan to Propose W-2 Offer →
                </Link>
              )
            )}
          </div>

          {trialToHire && trialToHire.status === 'proposed' && (
            <div className="p-3.5 rounded-xl bg-white border-2 border-indigo-300 shadow-xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-indigo-950">
                  📋 Pending {trialToHire.contract_track === 'fixed_term_w2' ? `${trialToHire.duration_months || 6}-Month W-2 Contract` : trialToHire.contract_track === 'open_ended_w2' ? 'Open-Ended W-2 Contract' : 'W-2 Contract-to-Hire'} Offer • ${trialToHire.hourly_pay_rate.toFixed(2)}/hr Gross W-2 ({trialToHire.weekly_hours} hrs/wk)
                </span>
                {viewerRole === 'employer' && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                    $0 Direct Hire Conversion
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700">
                <strong>Target Start:</strong> {trialToHire.target_start_date} • <strong>Work State:</strong> {trialToHire.work_state}
                {viewerRole === 'employer' && (
                  <span> • <strong>Your All-In Rate (+28%):</strong> ${trialToHire.employer_bill_rate.toFixed(2)}/hr</span>
                )}
                {(trialToHire.require_background_check || trialToHire.require_drug_screening) && (
                  <span>
                    {' '}• <strong>Screenings:</strong>{' '}
                    {[
                      trialToHire.require_background_check ? 'Background Check' : null,
                      trialToHire.require_drug_screening ? 'Drug Screening' : null,
                    ].filter(Boolean).join(' + ')}
                  </span>
                )}
              </p>
              {trialToHire.scope_note && (
                <p className="text-xs text-slate-600 italic bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                  &ldquo;{trialToHire.scope_note}&rdquo;
                </p>
              )}
              {viewerRole !== 'employer' ? (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Inspect hiring entity, supervisor, equipment, worksite, and W-2 terms to approve or request changes.
                  </span>
                  <button
                    type="button"
                    disabled={isSubmittingTrial}
                    onClick={() => {
                      setOfferIntentChecked(false)
                      setShowProfOfferModal(true)
                    }}
                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    📋 Review Full W-2 Offer →
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                  <span>Awaiting Professional review &amp; approval.</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowProfOfferModal(true)}
                      className="text-slate-700 hover:underline font-bold cursor-pointer"
                    >
                      Preview Offer Sheet
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingTrial}
                      onClick={() => openOfferConfirm('withdraw')}
                      className="text-indigo-700 hover:underline font-bold cursor-pointer"
                    >
                      Modify or Withdraw Offer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {trialToHire && ['accepted_pending_eor', 'converted_direct', 'ended'].includes(trialToHire.status) && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-400 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-emerald-950">
                  {trialToHire.status === 'converted_direct'
                    ? viewerRole === 'employer' ? '🎉 Converted to Direct W-2 Hire ($0 Conversion Fee)' : '🎉 Converted to Direct Full-Time W-2 Hire'
                    : trialToHire.status === 'ended'
                    ? `📋 W-2 Assignment Wrapped Up${trialToHire.equipment_return_status === 'return_requested' ? ' • Hardware Return Pending' : ''}`
                    : `✅ Active W-2 Engagement Confirmed (${trialToHire.eor_packet_id || 'EOR Queued'})${trialToHire.extension_count ? ` • +${trialToHire.extension_count * 90}d Extended` : ''}`}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white border border-emerald-300 text-emerald-800 text-[10px] font-extrabold">
                  ${trialToHire.hourly_pay_rate.toFixed(2)}/hr W-2 • Start {trialToHire.target_start_date} ({trialToHire.work_state})
                </span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                {viewerRole === 'employer'
                  ? `All-in Employer rate locked at $${trialToHire.employer_bill_rate.toFixed(2)}/hr (+28% statutory W-2 burden) with a $0 conversion fee.`
                  : `Your W-2 gross pay rate of $${trialToHire.hourly_pay_rate.toFixed(2)}/hr is locked with statutory W-2 payroll, direct deposit, and Workers' Comp protection through our licensed US Employer of Record partner.`}
              </p>
              {trialToHire.boss_sync_status && (
                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px]">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-extrabold border ${trialToHire.boss_sync_status === 'synced' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-amber-50 text-amber-900 border-amber-300'}`}>
                    {trialToHire.boss_sync_status === 'synced'
                      ? `BOSS EOR Placement #${trialToHire.boss_placement_id || 'Active'} Provisioned`
                      : 'EOR Onboarding Packet Queued for Concierge Dispatch'}
                  </span>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowProfOfferModal(true)}
                  className="text-[11px] font-extrabold text-emerald-900 hover:underline cursor-pointer"
                >
                  View Full W-2 Offer Sheet →
                </button>
                {viewerRole === 'employer' && (
                  <a
                    href="/dashboard/employer/jobs"
                    className="inline-flex items-center gap-1 text-[11px] font-extrabold text-indigo-700 hover:text-indigo-900 underline"
                  >
                    Manage Contract Extensions, $0 Direct Conversion &amp; Equipment Return in Manage Roles →
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message History Feed */}
      <div
        ref={scrollContainerRef}
        className="p-4 max-h-64 overflow-y-auto space-y-3 bg-slate-50/60"
      >
        {messages.length === 0 ? (
          <div className="text-center py-6 px-4">
            <p className="text-xs font-bold text-slate-600">
              {viewerRole === 'employer'
                ? `Start the conversation with ${candidateDisplayName} to introduce your role and schedule an interview.`
                : `No messages from ${employerName} yet. You can send the first note below or wait for their outreach before releasing your resume vault.`}
            </p>
          </div>
        ) : (
          messages.map((m) => {
            if (m.sender_role === 'system') {
              return (
                <div
                  key={m.id}
                  className="text-center py-1.5 px-3 rounded-lg bg-emerald-50 border border-emerald-300 text-[11px] font-bold text-emerald-800"
                >
                  {m.text}
                </div>
              )
            }

            const isMe = m.sender_role === viewerRole

            return (
              <div
                key={m.id}
                className={`flex flex-col ${
                  isMe ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-extrabold text-slate-600">
                    {isMe ? 'You' : m.sender_name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    isMe
                      ? 'bg-slate-900 text-white rounded-br-xs'
                      : 'bg-white border border-slate-300 text-slate-800 rounded-bl-xs shadow-2xs'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Feedback Alerts */}
      {errorMsg && (
        <div className="px-4 py-2 bg-rose-50 border-t border-rose-300 text-xs font-bold text-rose-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-300 text-xs font-bold text-emerald-800">
          {successMsg}
        </div>
      )}

      {/* Message Composer */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-white border-t border-slate-300 flex items-center gap-2"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            viewerRole === 'employer' && !hasEmployerMessaged
              ? `Write an introductory message to ${candidateDisplayName} to request interview & resume release...`
              : 'Write a secure message...'
          }
          className="flex-1 min-w-0 rounded-xl border-2 border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSending || !draft.trim()}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors disabled:opacity-40 cursor-pointer shrink-0"
        >
          {isSending ? 'Sending...' : 'Send →'}
        </button>
      </form>

      {pendingOfferConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border-2 border-slate-300 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                  pendingOfferConfirm === 'accept' || pendingOfferConfirm === 'propose'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  Contract Action Safeguard
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {pendingOfferConfirm === 'propose'
                    ? 'Confirm Sending W-2 Contract Offer'
                    : pendingOfferConfirm === 'accept'
                    ? 'Confirm Accepting W-2 Contract Offer'
                    : pendingOfferConfirm === 'decline'
                    ? 'Return Offer to Chat for Adjustment?'
                    : 'Confirm Withdrawing Pending W-2 Offer'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPendingOfferConfirm(null)
                  setOfferIntentChecked(false)
                }}
                className="text-slate-400 hover:text-slate-700 text-sm font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs space-y-1">
              {pendingOfferConfirm === 'propose' ? (
                <>
                  <p className="text-slate-700"><strong className="text-slate-900">Legal Entity:</strong> {legalEntityName.trim()} • <strong className="text-slate-900">Approver:</strong> {timecardApproverName.trim()}</p>
                  <p className="text-slate-700"><strong className="text-slate-900">W-2 Gross Pay:</strong> ${parsedPay.toFixed(2)}/hr ({parsedHrs} hrs/wk)</p>
                  <p className="text-slate-700"><strong className="text-slate-900">All-In Employer Rate (+28%):</strong> ${computedBillRate.toFixed(2)}/hr{clientPoNumber.trim() ? ` • PO: ${clientPoNumber.trim()}` : ''}</p>
                  <p className="text-slate-700"><strong className="text-slate-900">Target Start &amp; State:</strong> {trialStartDate} ({trialWorkState}) • Net 15 EOR Billing</p>
                </>
              ) : trialToHire ? (
                <>
                  {trialToHire.legal_entity_name && <p className="text-slate-700"><strong className="text-slate-900">Employer Entity:</strong> {trialToHire.legal_entity_name}</p>}
                  <p className="text-slate-700"><strong className="text-slate-900">W-2 Gross Pay:</strong> ${trialToHire.hourly_pay_rate.toFixed(2)}/hr ({trialToHire.weekly_hours} hrs/wk)</p>
                  {viewerRole === 'employer' && <p className="text-slate-700"><strong className="text-slate-900">All-In Employer Rate (+28%):</strong> ${trialToHire.employer_bill_rate.toFixed(2)}/hr</p>}
                  <p className="text-slate-700"><strong className="text-slate-900">Target Start &amp; State:</strong> {trialToHire.target_start_date} ({trialToHire.work_state})</p>
                </>
              ) : null}
            </div>

            {pendingOfferConfirm === 'accept' && (
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                <p className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wide">
                  W-2 &amp; I-9 Residential Onboarding Address (Required by US EOR Partner)
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Our licensed US Employer of Record partner will email your secure onboarding link for federal/state W-4 tax withholding, Form I-9 work authorization, direct deposit setup, and weekly electronic timesheets.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input type="text" maxLength={120} value={profResStreet1} onChange={(e) => setProfResStreet1(e.target.value)} placeholder="Residential Street Address *" className="sm:col-span-2 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                  <input type="text" maxLength={80} value={profResStreet2} onChange={(e) => setProfResStreet2(e.target.value)} placeholder="Apt / Suite" className="block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input type="text" maxLength={80} value={profResCity} onChange={(e) => setProfResCity(e.target.value)} placeholder="City *" className="col-span-2 sm:col-span-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                  <select value={profResState} onChange={(e) => setProfResState(e.target.value)} className="block w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900">
                    {US_STATES.map((st) => (<option key={st} value={st}>{st}</option>))}
                  </select>
                  <input type="text" maxLength={16} value={profResZip} onChange={(e) => setProfResZip(e.target.value)} placeholder="ZIP *" className="block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                  <input type="tel" maxLength={24} value={profMobilePhone} onChange={(e) => setProfMobilePhone(e.target.value)} placeholder="Mobile (optional)" className="col-span-2 sm:col-span-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                </div>
              </div>
            )}

            <label className="flex items-start gap-2.5 rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={offerIntentChecked}
                onChange={(e) => setOfferIntentChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-900 leading-snug">
                {pendingOfferConfirm === 'propose'
                  ? `I confirm I intend to send this formal W-2 offer at $${parsedPay.toFixed(2)}/hr W-2 ($${computedBillRate.toFixed(2)}/hr all-in employer rate).`
                  : pendingOfferConfirm === 'accept'
                  ? `I confirm I intend to accept this W-2 offer and initiate Employer of Record W-2 & I-9 onboarding.`
                  : pendingOfferConfirm === 'decline'
                  ? 'I confirm I want to pause this pending offer so we can adjust terms in chat.'
                  : 'I confirm I intend to withdraw this pending W-2 offer.'}
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setPendingOfferConfirm(null)
                  setOfferIntentChecked(false)
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!offerIntentChecked || isSubmittingTrial || (pendingOfferConfirm === 'accept' && (!profResStreet1.trim() || !profResCity.trim() || !profResZip.trim()))}
                onClick={async () => {
                  const act = pendingOfferConfirm
                  setPendingOfferConfirm(null)
                  setOfferIntentChecked(false)
                  if (act === 'propose') await handleProposeTrial()
                  else if (act === 'accept') await handleRespondTrial('accept')
                  else if (act === 'decline') await handleRespondTrial('decline')
                  else if (act === 'withdraw') await handleWithdrawTrial()
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-colors ${
                  !offerIntentChecked || isSubmittingTrial || (pendingOfferConfirm === 'accept' && (!profResStreet1.trim() || !profResCity.trim() || !profResZip.trim()))
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : pendingOfferConfirm === 'accept' || pendingOfferConfirm === 'propose'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                }`}
              >
                {!offerIntentChecked
                  ? 'Check Box Above to Confirm'
                  : pendingOfferConfirm === 'propose'
                  ? 'Confirm & Send W-2 Offer'
                  : pendingOfferConfirm === 'accept'
                  ? 'Confirm & Start W-2 Onboarding'
                  : pendingOfferConfirm === 'decline'
                  ? 'Confirm & Discuss in Chat'
                  : 'Confirm & Withdraw Offer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewerRole === 'employer' && showTrialDrawer && employerPlanActive && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Protected W-2 Offer Details
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Pre-filled from your Company Profile and Protected Role settings. Update Company Profile defaults anytime in{' '}
                  <Link href="/dashboard/employer/organization" className="text-indigo-600 font-bold hover:underline">
                    Organization Settings
                  </Link>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTrialDrawer(false)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700">
                  Professional W-2 Pay ($/hr)
                </label>
                <input
                  type="number"
                  min="15"
                  max="500"
                  step="0.5"
                  value={trialPayRate}
                  onChange={(e) => setTrialPayRate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700">
                  Est. Weekly Hours
                </label>
                <input
                  type="number"
                  min="10"
                  max="60"
                  value={trialWeeklyHours}
                  onChange={(e) => setTrialWeeklyHours(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700">
                  Target Start Date
                </label>
                <input
                  type="date"
                  value={trialStartDate}
                  onChange={(e) => setTrialStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700">
                  Work State (W-2)
                </label>
                <select
                  value={trialWorkState}
                  onChange={(e) => setTrialWorkState(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 cursor-pointer"
                >
                  {US_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
              <label className="inline-flex items-center gap-1.5 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={trialBgCheck}
                  onChange={(e) => setTrialBgCheck(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                Include Standard Background Check
              </label>
              <label className="inline-flex items-center gap-1.5 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={trialDrugCheck}
                  onChange={(e) => setTrialDrugCheck(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                Include Drug Screening
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
              <p className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide">
                Employer of Record Contract &amp; Company Billing
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="text" maxLength={128} value={legalEntityName} onChange={(e) => setLegalEntityName(e.target.value)} placeholder="Exact Legal Entity Name (not DBA) *" className="block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                <input type="text" maxLength={100} value={timecardApproverName} onChange={(e) => setTimecardApproverName(e.target.value)} placeholder="Timecard Approver Full Name *" className="block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                <input type="email" maxLength={140} value={timecardApproverEmail} onChange={(e) => setTimecardApproverEmail(e.target.value)} placeholder="Timecard Approver Work Email *" className="block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="text" maxLength={100} value={supervisorName} onChange={(e) => setSupervisorName(e.target.value)} placeholder="Day-to-Day Supervisor (if different)" className="block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                <input type="text" maxLength={64} value={clientPoNumber} onChange={(e) => setClientPoNumber(e.target.value)} placeholder="Internal PO Number (optional)" className="block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                <input type="email" maxLength={140} value={invoiceCcEmail} onChange={(e) => setInvoiceCcEmail(e.target.value)} placeholder="AP / Invoice CC Email (optional)" className="block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input type="text" maxLength={120} value={empBillStreet1} onChange={(e) => setEmpBillStreet1(e.target.value)} placeholder="Company Billing Street" className="sm:col-span-2 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                <input type="text" maxLength={80} value={empBillCity} onChange={(e) => setEmpBillCity(e.target.value)} placeholder="Billing City" className="block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                <div className="grid grid-cols-3 gap-1.5">
                  <select value={empBillState} onChange={(e) => setEmpBillState(e.target.value)} className="block w-full rounded-lg border border-slate-300 bg-white px-1 py-1.5 text-xs text-slate-900">
                    {US_STATES.map((st) => (<option key={st} value={st}>{st}</option>))}
                  </select>
                  <input type="text" maxLength={16} value={empBillZip} onChange={(e) => setEmpBillZip(e.target.value)} placeholder="ZIP" className="block w-full rounded-lg border border-slate-300 bg-white px-1.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                  <input type="text" maxLength={10} value={trialWcCode} onChange={(e) => setTrialWcCode(e.target.value)} title="Workers Comp Code (default 8810 Clerical/Tech)" placeholder="8810" className="block w-full rounded-lg border border-slate-300 bg-white px-1.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                </div>
              </div>
              <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer pt-0.5">
                <input type="checkbox" checked={diffWorksite} onChange={(e) => setDiffWorksite(e.target.checked)} className="rounded border-slate-300 text-indigo-600" />
                On-site or hybrid worksite address differs from company billing address
              </label>
              {diffWorksite && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-0.5">
                  <input type="text" maxLength={120} value={worksiteStreet1} onChange={(e) => setWorksiteStreet1(e.target.value)} placeholder="Physical Worksite Street *" className="sm:col-span-2 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                  <input type="text" maxLength={80} value={worksiteCity} onChange={(e) => setWorksiteCity(e.target.value)} placeholder="Worksite City *" className="block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                  <div className="grid grid-cols-2 gap-1.5">
                    <select value={worksiteState} onChange={(e) => setWorksiteState(e.target.value)} className="block w-full rounded-lg border border-slate-300 bg-white px-1.5 py-1.5 text-xs text-slate-900">
                      {US_STATES.map((st) => (<option key={st} value={st}>{st}</option>))}
                    </select>
                    <input type="text" maxLength={16} value={worksiteZip} onChange={(e) => setWorksiteZip(e.target.value)} placeholder="ZIP *" className="block w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <input
                type="text"
                maxLength={400}
                value={trialScopeNote}
                onChange={(e) => setTrialScopeNote(e.target.value)}
                placeholder="Optional contract-to-hire milestones, schedule notes, or direct conversion target salary..."
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <p className="font-extrabold text-slate-900">
                  All-In Employer Rate (+28%): ${computedBillRate.toFixed(2)}/hr{' '}
                  <span className="font-semibold text-slate-500">
                    (Est. ${(computedBillRate * parsedHrs).toLocaleString('en-US', { maximumFractionDigits: 0 })}/wk)
                  </span>
                </p>
                <p className="text-[11px] text-emerald-700 font-bold">
                  Saves ~${est90DaySavings.toLocaleString('en-US')} over 90 days vs. 55% staffing agency markup (${agencyBillRate.toFixed(2)}/hr) + $0 buyout fee at Day 90
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTrialDrawer(false)}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Done
                </button>
                <button
                  type="button"
                  disabled={isSubmittingTrial || parsedPay < 15 || legalEntityName.trim().length < 2 || timecardApproverName.trim().length < 2 || !timecardApproverEmail.trim().includes('@')}
                  title={legalEntityName.trim().length < 2 || timecardApproverName.trim().length < 2 || !timecardApproverEmail.trim().includes('@') ? 'Enter Exact Legal Entity Name and Timecard Approver Name/Email first' : undefined}
                  onClick={() => {
                    setShowTrialDrawer(false)
                    openOfferConfirm('propose')
                  }}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingTrial ? 'Sending Offer...' : jobEorTrack === 'fixed_term_w2' ? `Review & Send ${jobEorDurationMonths}-Mo Offer` : jobEorTrack === 'open_ended_w2' ? 'Review & Send Open-Ended Offer' : 'Review & Send W-2 Offer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProfOfferModal && trialToHire && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wide">
                    {trialToHire.contract_track === 'fixed_term_w2'
                      ? `${trialToHire.duration_months || 6}-Month Fixed-Term W-2 Contract`
                      : trialToHire.contract_track === 'open_ended_w2'
                      ? 'Open-Ended W-2 Contract'
                      : '90-Day W-2 Contract-to-Hire'}
                  </span>
                  {viewerRole === 'employer' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                      $0 Direct Hire Conversion Fee
                    </span>
                  )}
                </div>
                <h3 className="text-base font-black text-slate-900">
                  Protected W-2 Contract Offer Sheet
                </h3>
                <p className="text-xs text-slate-600">
                  Review every compensation, supervision, worksite, equipment, and Employer of Record protection detail below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProfOfferModal(false)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200 p-3.5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Gross W-2 Pay</p>
                <p className="text-sm font-black text-slate-900 mt-0.5">${trialToHire.hourly_pay_rate.toFixed(2)}/hr</p>
                <p className="text-[11px] font-semibold text-emerald-700">
                  ~${(trialToHire.hourly_pay_rate * trialToHire.weekly_hours).toLocaleString('en-US', { maximumFractionDigits: 0 })}/wk gross
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Est. Weekly Hours</p>
                <p className="text-sm font-black text-slate-900 mt-0.5">{trialToHire.weekly_hours} hrs/wk</p>
                <p className="text-[11px] text-slate-600">Electronic weekly timecards</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Target Start Date</p>
                <p className="text-sm font-black text-slate-900 mt-0.5">{trialToHire.target_start_date}</p>
                <p className="text-[11px] text-slate-600">Pending W-4 &amp; I-9 completion</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">W-2 Work State</p>
                <p className="text-sm font-black text-slate-900 mt-0.5">{trialToHire.work_state}</p>
                <p className="text-[11px] text-slate-600">WC Class {trialToHire.wc_code || '8810'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800">
                  Hiring Company &amp; Supervision
                </p>
                <div className="space-y-1 text-slate-700">
                  <p><strong className="text-slate-900">Hiring Legal Entity:</strong> {trialToHire.legal_entity_name || employerName}</p>
                  <p><strong className="text-slate-900">Day-to-Day Supervisor:</strong> {trialToHire.supervisor_name || trialToHire.timecard_approver_name || 'Assigned Hiring Lead'}</p>
                  <p>
                    <strong className="text-slate-900">Timecard Approver:</strong>{' '}
                    {trialToHire.timecard_approver_name || 'Verified Hiring Manager'}
                    {trialToHire.timecard_approver_email ? ` (${trialToHire.timecard_approver_email})` : ''}
                  </p>
                  {trialToHire.employer_address?.city && (
                    <p>
                      <strong className="text-slate-900">Company Location:</strong>{' '}
                      {[trialToHire.employer_address.street1, trialToHire.employer_address.city, trialToHire.employer_address.state, trialToHire.employer_address.postalcode].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800">
                  Worksite, Equipment &amp; Screenings
                </p>
                <div className="space-y-1 text-slate-700">
                  <p>
                    <strong className="text-slate-900">Worksite Arrangement:</strong>{' '}
                    {trialToHire.worksite_address?.street1
                      ? `${trialToHire.worksite_address.street1}, ${trialToHire.worksite_address.city}, ${trialToHire.worksite_address.state} ${trialToHire.worksite_address.postalcode}`
                      : `Remote / Standard Work State (${trialToHire.work_state})`}
                  </p>
                  <p>
                    <strong className="text-slate-900">Equipment &amp; Access:</strong>{' '}
                    {trialToHire.equipment_policy || jobEquipmentPolicy || 'Standard Role Setup'}
                  </p>
                  {trialToHire.equipment_notes && (
                    <p>
                      <strong className="text-slate-900">Equipment Notes:</strong>{' '}
                      {trialToHire.equipment_notes}
                    </p>
                  )}
                  <p>
                    <strong className="text-slate-900">Pre-Hire Screenings:</strong>{' '}
                    {[
                      trialToHire.require_background_check ? 'Standard Background Check' : null,
                      trialToHire.require_drug_screening ? 'Drug Screening' : null,
                    ].filter(Boolean).join(' + ') || 'None Required'}
                  </p>
                  <p>
                    <strong className="text-slate-900">W-2 EOR Protection:</strong>{' '}
                    {viewerRole === 'employer'
                      ? "Statutory W-2 payroll, direct deposit, Workers' Comp & $0 buyout conversion"
                      : "Statutory W-2 payroll, direct deposit & Workers' Comp coverage"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs space-y-1">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800">
                {viewerRole === 'employer' ? 'Milestones, Schedule & Conversion Notes' : 'Milestones & Schedule Notes'}
              </p>
              <p className="text-slate-700 leading-relaxed">
                {trialToHire.scope_note
                  ? trialToHire.scope_note
                  : viewerRole === 'employer'
                  ? 'Standard full W-2 engagement terms apply with $0 direct conversion fee upon mutual agreement.'
                  : 'Standard full W-2 engagement terms apply with mutual direct full-time transition eligibility.'}
              </p>
            </div>

            {viewerRole !== 'employer' && trialToHire.status === 'proposed' ? (
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                  <p className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wide">
                    Your W-2 &amp; I-9 Residential Onboarding Address (Required to Approve)
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Our licensed US Employer of Record partner uses this residential address solely to provision your federal/state W-4 tax withholding, Form I-9 verification, and direct deposit onboarding packet.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input type="text" maxLength={120} value={profResStreet1} onChange={(e) => setProfResStreet1(e.target.value)} placeholder="Residential Street Address *" className="sm:col-span-2 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                    <input type="text" maxLength={80} value={profResStreet2} onChange={(e) => setProfResStreet2(e.target.value)} placeholder="Apt / Suite" className="block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input type="text" maxLength={80} value={profResCity} onChange={(e) => setProfResCity(e.target.value)} placeholder="City *" className="col-span-2 sm:col-span-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                    <select value={profResState} onChange={(e) => setProfResState(e.target.value)} className="block w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900">
                      {US_STATES.map((st) => (<option key={st} value={st}>{st}</option>))}
                    </select>
                    <input type="text" maxLength={16} value={profResZip} onChange={(e) => setProfResZip(e.target.value)} placeholder="ZIP *" className="block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                    <input type="tel" maxLength={24} value={profMobilePhone} onChange={(e) => setProfMobilePhone(e.target.value)} placeholder="Mobile (optional)" className="col-span-2 sm:col-span-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                  </div>
                </div>

                <label className="flex items-start gap-2.5 rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={offerIntentChecked}
                    onChange={(e) => setOfferIntentChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-900 leading-snug">
                    I have reviewed all W-2 contract details above and confirm I want to approve this offer at ${trialToHire.hourly_pay_rate.toFixed(2)}/hr gross W-2 and begin Employer of Record onboarding.
                  </span>
                </label>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isSubmittingTrial}
                    onClick={() => {
                      setShowProfOfferModal(false)
                      openOfferConfirm('decline')
                    }}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer disabled:opacity-50">
                    Discuss / Request Adjustment in Chat
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowProfOfferModal(false)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                      Close
                    </button>
                    <button
                      type="button"
                      disabled={!offerIntentChecked || isSubmittingTrial || !profResStreet1.trim() || !profResCity.trim() || !profResZip.trim()}
                      onClick={async () => {
                        setShowProfOfferModal(false)
                        setOfferIntentChecked(false)
                        await handleRespondTrial('accept')
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-colors ${
                        !offerIntentChecked || isSubmittingTrial || !profResStreet1.trim() || !profResCity.trim() || !profResZip.trim()
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      }`}>
                      {isSubmittingTrial ? 'Confirming...' : '✅ Approve W-2 Offer & Start Onboarding'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProfOfferModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold cursor-pointer">
                  Close Offer Sheet
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}