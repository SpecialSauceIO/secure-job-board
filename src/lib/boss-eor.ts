const DEFAULT_BOSS_BASE_URL = 'https://portal.backofficenow.com/api'

export interface EorPostalAddress {
  street1: string
  street2?: string | null
  city: string
  state: string
  postalcode: string
}

export interface BossPlacementHandoffInput {
  packetId: string
  referenceId: string
  roleTitle: string
  roleDescription?: string | null
  contractTrack: 'trial_to_hire_90d' | 'fixed_term_w2' | 'open_ended_w2'
  trialDays: number
  targetStartDate: string
  hourlyPayRate: number
  employerBillRate: number
  weeklyHours: number
  wcCode?: string | null
  requireBackgroundCheck: boolean
  requireDrugScreening: boolean
  scopeNote?: string | null
  employer: {
    orgId?: string | null
    name: string
    domain?: string | null
    contactName?: string | null
    contactEmail: string
    contactPhone?: string | null
    address?: EorPostalAddress | null
    cachedBossClientId?: number | null
  }
  professional: {
    fullName: string
    email: string
    mobilePhone?: string | null
    workState: string
    address: EorPostalAddress
    cachedBossAssociateId?: number | null
  }
}

export interface BossPlacementHandoffResult {
  syncStatus: 'synced' | 'pending_rates' | 'manual_fallback'
  clientId: number | null
  contactId: number | null
  associateId: number | null
  assignmentId: number | null
  placementId: number | null
  usedExistingAssociate: boolean
  summaryNote: string
  errorDetail?: string | null
}

export interface BossDeltaSyncResult {
  configured: boolean
  associatesById: Map<number, { isOnboarded: boolean; onboardedDate: string | null; statusDisplay: string | null }>
  placementsById: Map<number, { active: boolean; statusDisplay: string | null; startDate: string | null }>
  error?: string
}

function cleanEnv(raw?: string | null): string {
  if (!raw) return ''
  return raw.trim().replace(/^["']+|["']+$/g, '').trim()
}

export function getBossApiConfig(): { apiKey: string; baseUrl: string; configured: boolean } {
  const apiKey = cleanEnv(process.env.BOSS_PARTNER_API_KEY)
  const rawBase = cleanEnv(process.env.BOSS_PARTNER_API_BASE_URL) || DEFAULT_BOSS_BASE_URL
  const baseUrl = rawBase.replace(/\/+$/, '')
  return { apiKey, baseUrl, configured: Boolean(apiKey) }
}

function splitPersonName(fullName?: string | null, fallbackFirst = 'Verified', fallbackLast = 'Member'): { firstName: string; lastName: string } {
  const cleaned = String(fullName || '').trim().replace(/\s+/g, ' ')
  if (!cleaned) return { firstName: fallbackFirst, lastName: fallbackLast }
  const parts = cleaned.split(' ')
  if (parts.length === 1) return { firstName: parts[0], lastName: fallbackLast }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

function normalizeTwoLetterState(rawState?: string | null): string {
  const trimmed = String(rawState || '').trim()
  const parenMatch = trimmed.match(/\(([A-Za-z]{2})\)/)
  if (parenMatch) return parenMatch[1].toUpperCase()
  const code = trimmed.replace(/[^A-Za-z]/g, '').toUpperCase()
  return code.length >= 2 ? code.slice(0, 2) : 'TX'
}

function normalizePostalCode(rawZip?: string | null): string {
  const cleaned = String(rawZip || '').trim().replace(/[^0-9A-Za-z-]/g, '')
  return cleaned || '78731'
}

function computeAssignmentEndDate(startDate: string, track: string, trialDays: number): string | null {
  if (track === 'open_ended_w2' || !trialDays || trialDays <= 0) return null
  const parsed = new Date(`${startDate}T12:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return null
  const end = new Date(parsed.getTime() + trialDays * 86400000)
  return end.toISOString().slice(0, 10)
}

function escapePdfText(input: string): string {
  return input
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

export function buildMinimalPlacementOrderPdfBase64(lines: string[]): string {
  const safeLines = lines.slice(0, 22).map((line) => escapePdfText(line.slice(0, 92)))
  const streamOps = [
    'BT',
    '/F1 10 Tf',
    '50 740 Td',
    '14 TL',
    ...safeLines.map((line, idx) => (idx === 0 ? `(${line}) Tj` : `T* (${line}) Tj`)),
    'ET',
  ].join('\n')

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${Buffer.byteLength(streamOps, 'utf8')} >>\nstream\n${streamOps}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = [0]
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += obj
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  return Buffer.from(pdf, 'utf8').toString('base64')
}

async function bossRequest(
  path: string,
  init?: { method?: 'GET' | 'POST' | 'PATCH'; body?: unknown }
): Promise<{ ok: boolean; status: number; data: any; errorText: string }> {
  const { apiKey, baseUrl, configured } = getBossApiConfig()
  if (!configured) {
    return { ok: false, status: 0, data: null, errorText: 'BOSS_PARTNER_API_KEY not configured' }
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
  try {
    const res = await fetch(`${baseUrl}${normalizedPath}`, {
      method: init?.method || 'GET',
      headers: {
        'X-Api-Key': apiKey,
        Accept: 'application/json',
        ...(init?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
      signal: controller.signal,
    })
    const rawText = await res.text()
    let parsed: any = null
    if (rawText) {
      try {
        parsed = JSON.parse(rawText)
      } catch {
        parsed = null
      }
    }
    const errSummary =
      parsed?.detail ||
      parsed?.message ||
      parsed?.msg ||
      (parsed?.errors ? JSON.stringify(parsed.errors) : rawText.slice(0, 260))
    return { ok: res.ok, status: res.status, data: parsed, errorText: errSummary || `HTTP ${res.status}` }
  } catch (err: any) {
    return { ok: false, status: 0, data: null, errorText: err?.message || 'Network error contacting BOSS API' }
  } finally {
    clearTimeout(timer)
  }
}

export async function checkBossPartnerWhoami(): Promise<{ ok: boolean; partnerId: number | null; capabilities: string[]; error?: string }> {
  const res = await bossRequest('/whoami/')
  if (!res.ok || !res.data?.data) {
    return { ok: false, partnerId: null, capabilities: [], error: res.errorText }
  }
  return {
    ok: true,
    partnerId: typeof res.data.data.account_id === 'number' ? res.data.data.account_id : null,
    capabilities: Array.isArray(res.data.data.capabilities) ? res.data.data.capabilities : [],
  }
}

export async function submitBossW2PlacementHandoff(
  input: BossPlacementHandoffInput
): Promise<BossPlacementHandoffResult> {
  const cfg = getBossApiConfig()
  if (!cfg.configured) {
    return {
      syncStatus: 'manual_fallback',
      clientId: null,
      contactId: null,
      associateId: null,
      assignmentId: null,
      placementId: null,
      usedExistingAssociate: false,
      summaryNote: 'Queued in SpecialSauce Operations Console (BOSS_PARTNER_API_KEY not yet set in environment).',
      errorDetail: null,
    }
  }

  let clientId: number | null = input.employer.cachedBossClientId || null
  let contactId: number | null = null
  let associateId: number | null = input.professional.cachedBossAssociateId || null
  let usedExistingAssociate = false

  if (!clientId) {
    const pickerRes = await bossRequest('/clients/?picker=1&page_size=200')
    if (pickerRes.ok && Array.isArray(pickerRes.data?.results)) {
      const targetLower = input.employer.name.trim().toLowerCase()
      const matched = pickerRes.data.results.find(
        (row: any) => String(row?.name || '').trim().toLowerCase() === targetLower
      )
      if (matched?.id) clientId = Number(matched.id)
    }
  }

  const empNameParts = splitPersonName(
    input.employer.contactName || input.employer.name,
    'Hiring',
    'Manager'
  )

  if (!clientId) {
    const empAddr = input.employer.address || {
      street1: '5900 Balcones Dr Ste 34619',
      street2: null,
      city: 'Austin',
      state: normalizeTwoLetterState(input.professional.workState),
      postalcode: '78731',
    }
    const orderPdfB64 = buildMinimalPlacementOrderPdfBase64([
      'SPECIALSAUCE.IO — W-2 EMPLOYER OF RECORD PLACEMENT ORDER',
      `Packet ID: ${input.packetId} | Reference: ${input.referenceId}`,
      `Executed Timestamp (UTC): ${new Date().toISOString()}`,
      `Employer Client: ${input.employer.name} (${input.employer.domain || 'verified'})`,
      `Hiring Contact: ${input.employer.contactEmail}`,
      `Assigned Professional: ${input.professional.fullName} (${input.professional.email})`,
      `Role Title: ${input.roleTitle} | Work State: ${normalizeTwoLetterState(input.professional.workState)}`,
      `Gross W-2 Pay Rate: $${input.hourlyPayRate.toFixed(2)}/hr | Employer Bill Rate (+28%): $${input.employerBillRate.toFixed(2)}/hr`,
      `Target Start Date: ${input.targetStartDate} | Est. Schedule: ${input.weeklyHours} hrs/wk`,
      'Direct Conversion Fee: $0.00 across 90-day, 180-day, or custom conversion timelines.',
    ])

    const createClientRes = await bossRequest('/clients/submit/', {
      method: 'POST',
      body: {
        name: input.employer.name.slice(0, 128),
        website: input.employer.domain ? `https://${input.employer.domain}` : null,
        payment_terms: 15,
        description: `SpecialSauce.io Verified Employer (${input.referenceId})`,
        partner_comments: `Packet ${input.packetId} — W-2 placement via SpecialSauce.io`,
        main_contact: {
          first_name: empNameParts.firstName,
          last_name: empNameParts.lastName,
          title: 'Authorized Hiring Contact',
          phone_number: input.employer.contactPhone || null,
          email: input.employer.contactEmail,
        },
        address: {
          street1: empAddr.street1,
          street2: empAddr.street2 || null,
          city: empAddr.city,
          state: normalizeTwoLetterState(empAddr.state),
          postalcode: normalizePostalCode(empAddr.postalcode),
        },
        contracts: [
          {
            data: orderPdfB64,
            filename: `SpecialSauce_${input.packetId}_Placement_Order.pdf`,
          },
        ],
        contract_type: 1,
        not_factored: false,
        override_no_sales_tax: false,
      },
    })

    if (!createClientRes.ok || createClientRes.data?.result === 'error' || !createClientRes.data?.id) {
      return {
        syncStatus: 'manual_fallback',
        clientId: null,
        contactId: null,
        associateId: null,
        assignmentId: null,
        placementId: null,
        usedExistingAssociate: false,
        summaryNote: 'Queued for manual BOSS Client setup in Operations Console.',
        errorDetail: `BOSS /clients/submit/ failed: ${createClientRes.errorText}`,
      }
    }
    clientId = Number(createClientRes.data.id)
  }

  const clientDetailRes = await bossRequest(`/clients/${clientId}/`)
  if (clientDetailRes.ok && clientDetailRes.data) {
    const contacts: any[] = Array.isArray(clientDetailRes.data.clientcontact_set)
      ? clientDetailRes.data.clientcontact_set
      : []
    const targetEmail = input.employer.contactEmail.trim().toLowerCase()
    const existingContact = contacts.find(
      (c: any) => String(c?.email || '').trim().toLowerCase() === targetEmail
    )
    if (existingContact?.id) {
      contactId = Number(existingContact.id)
    } else if (clientDetailRes.data.main_contact?.id) {
      contactId = Number(clientDetailRes.data.main_contact.id)
    }
  }

  if (!contactId && clientId) {
    const addContactRes = await bossRequest(`/clients/${clientId}/contacts/`, {
      method: 'POST',
      body: {
        first_name: empNameParts.firstName,
        last_name: empNameParts.lastName,
        title: 'Hiring Manager',
        phone_number: input.employer.contactPhone || null,
        email: input.employer.contactEmail,
        all_timesheet_access: true,
        all_invoices_access: true,
        is_active: true,
        is_primary: false,
      },
    })
    if (addContactRes.ok && addContactRes.data?.id) {
      contactId = Number(addContactRes.data.id)
    }
  }

  if (!associateId) {
    const profNameParts = splitPersonName(input.professional.fullName, 'Verified', 'Professional')
    const screeningNotes = [
      `SpecialSauce Packet ${input.packetId} (${input.referenceId})`,
      input.requireBackgroundCheck ? 'Background Check Requested' : null,
      input.requireDrugScreening ? 'Drug Screening Requested' : null,
    ]
      .filter(Boolean)
      .join(' | ')

    const baseAssociateBody: Record<string, any> = {
      first_name: profNameParts.firstName,
      last_name: profNameParts.lastName,
      mobile_phone: input.professional.mobilePhone || undefined,
      email_address: input.professional.email,
      comments: screeningNotes,
      address: {
        street1: input.professional.address.street1,
        street2: input.professional.address.street2 || null,
        city: input.professional.address.city,
        state: normalizeTwoLetterState(input.professional.address.state || input.professional.workState),
        postalcode: normalizePostalCode(input.professional.address.postalcode),
      },
      employment_type: 'w-2',
      ...(input.requireBackgroundCheck ? { bg_other: 'Standard criminal & employment verification requested via SpecialSauce.io' } : {}),
      ...(input.requireDrugScreening ? { drug_other: 'Standard pre-employment drug panel requested via SpecialSauce.io' } : {}),
    }

    let assocRes = await bossRequest('/associates/submit/', {
      method: 'POST',
      body: baseAssociateBody,
    })

    if (assocRes.status === 409 && assocRes.data?.result === 'email_match' && Array.isArray(assocRes.data?.matches) && assocRes.data.matches[0]?.id) {
      const matchedAssocId = Number(assocRes.data.matches[0].id)
      assocRes = await bossRequest('/associates/submit/', {
        method: 'POST',
        body: {
          ...baseAssociateBody,
          duplicate_action: 'use_existing',
          existing_associate_id: matchedAssocId,
        },
      })
    }

    if (!assocRes.ok || !assocRes.data?.id) {
      return {
        syncStatus: 'manual_fallback',
        clientId,
        contactId,
        associateId: null,
        assignmentId: null,
        placementId: null,
        usedExistingAssociate: false,
        summaryNote: 'BOSS Client ready; Associate submission queued for Operations Console review.',
        errorDetail: `BOSS /associates/submit/ failed: ${assocRes.errorText}`,
      }
    }
    associateId = Number(assocRes.data.id)
    usedExistingAssociate = Boolean(assocRes.data.used_existing)
  }

  const payReg = input.hourlyPayRate.toFixed(2)
  const payOt = (Math.round(input.hourlyPayRate * 1.5 * 100) / 100).toFixed(2)
  const billReg = input.employerBillRate.toFixed(2)
  const billOt = (Math.round(input.employerBillRate * 1.5 * 100) / 100).toFixed(2)
  const endDate = computeAssignmentEndDate(input.targetStartDate, input.contractTrack, input.trialDays)
  const cleanWcCode = String(input.wcCode || '8810').trim().slice(0, 16) || '8810'
  const jobDescLines = [
    `SpecialSauce.io Protected W-2 Engagement (${input.packetId} / ${input.referenceId}).`,
    input.scopeNote ? `Scope & Milestones: ${input.scopeNote}` : null,
    input.roleDescription ? input.roleDescription.slice(0, 600) : null,
  ]
    .filter(Boolean)
    .join('\n')

  const assignRes = await bossRequest('/assignments/submit/', {
    method: 'POST',
    body: {
      client_id: clientId,
      contractor_id: associateId,
      job_title: input.roleTitle.slice(0, 128),
      job_desc: jobDescLines,
      start_date: input.targetStartDate,
      end_date: endDate,
      pay_regular: payReg,
      pay_overtime: payOt,
      bill_regular: billReg,
      bill_overtime: billOt,
      wc_code: cleanWcCode,
      po_number: input.packetId,
      is_w2: true,
      pay_basis: 'hourly',
      ...(contactId ? { manager_contact_id: contactId, billing_contact_id: contactId } : {}),
    },
  })

  if (!assignRes.ok || assignRes.data?.result === 'error' || !assignRes.data?.placement_id) {
    return {
      syncStatus: 'manual_fallback',
      clientId,
      contactId,
      associateId,
      assignmentId: assignRes.data?.assignment_id ? Number(assignRes.data.assignment_id) : null,
      placementId: null,
      usedExistingAssociate,
      summaryNote: 'BOSS Client & Associate created; Assignment rate confirmation queued in Operations Console.',
      errorDetail: `BOSS /assignments/submit/ failed: ${assignRes.errorText}`,
    }
  }

  const assignmentId = assignRes.data.assignment_id ? Number(assignRes.data.assignment_id) : null
  const placementId = Number(assignRes.data.placement_id)
  let ratesPending = false
  if (assignmentId) {
    const checkAssign = await bossRequest(`/assignments/${assignmentId}/`)
    if (checkAssign.ok && checkAssign.data?.rates_pending === true) {
      ratesPending = true
    }
  }

  return {
    syncStatus: ratesPending ? 'pending_rates' : 'synced',
    clientId,
    contactId,
    associateId,
    assignmentId,
    placementId,
    usedExistingAssociate,
    summaryNote: ratesPending
      ? `Dispatched to BOSS EOR (Placement #${placementId}, awaiting BOSS rate table confirmation).`
      : `Automatically provisioned in BOSS EOR (Placement #${placementId}, Associate #${associateId}).`,
    errorDetail: null,
  }
}

export async function fetchBossUpdatedRecordsSince(updatedSinceIso: string): Promise<BossDeltaSyncResult> {
  const cfg = getBossApiConfig()
  const associatesById = new Map<number, { isOnboarded: boolean; onboardedDate: string | null; statusDisplay: string | null }>()
  const placementsById = new Map<number, { active: boolean; statusDisplay: string | null; startDate: string | null }>()
  if (!cfg.configured) {
    return { configured: false, associatesById, placementsById }
  }

  const encodedSince = encodeURIComponent(updatedSinceIso)
  const [assocRes, placeRes] = await Promise.all([
    bossRequest(`/associates/?updated_since=${encodedSince}&page_size=100`),
    bossRequest(`/placements/?updated_since=${encodedSince}&page_size=100`),
  ])

  if (!assocRes.ok && !placeRes.ok) {
    return {
      configured: true,
      associatesById,
      placementsById,
      error: assocRes.errorText || placeRes.errorText,
    }
  }

  if (assocRes.ok && Array.isArray(assocRes.data?.results)) {
    for (const row of assocRes.data.results) {
      if (typeof row?.id === 'number') {
        associatesById.set(row.id, {
          isOnboarded: Boolean(row.is_onboarded),
          onboardedDate: row.onboarded_date || null,
          statusDisplay: row.record_status || null,
        })
      }
    }
  }

  if (placeRes.ok && Array.isArray(placeRes.data?.results)) {
    for (const row of placeRes.data.results) {
      if (typeof row?.id === 'number') {
        placementsById.set(row.id, {
          active: Boolean(row.active),
          statusDisplay: row.get_status_display || null,
          startDate: row.start_date || null,
        })
      }
    }
  }

  return { configured: true, associatesById, placementsById }
}
