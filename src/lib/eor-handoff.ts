import { getAscenServiceClient } from '@/lib/ascen-eor'

export interface EorPostalAddress {
  street1: string
  street2?: string | null
  city: string
  state: string
  postalcode: string
}

export interface EorPlacementHandoffInput {
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
  poNumber?: string | null
  worksiteAddress?: EorPostalAddress | null
  requireBackgroundCheck: boolean
  requireDrugScreening: boolean
  scopeNote?: string | null
  employer: {
    orgId?: string | null
    name: string
    legalEntityName?: string | null
    domain?: string | null
    contactName?: string | null
    contactEmail: string
    contactPhone?: string | null
    timecardApproverName?: string | null
    timecardApproverEmail?: string | null
    supervisorName?: string | null
    invoiceCcEmail?: string | null
    address?: EorPostalAddress | null
    cachedPartnerClientId?: string | number | null
  }
  professional: {
    fullName: string
    email: string
    mobilePhone?: string | null
    workState: string
    address: EorPostalAddress
    cachedPartnerAssociateId?: string | number | null
  }
}

export interface EorPlacementHandoffResult {
  syncStatus: 'synced' | 'pending_rates' | 'manual_fallback'
  clientId: string | number | null
  contactId: string | number | null
  associateId: string | number | null
  assignmentId: string | number | null
  placementId: string | number | null
  usedExistingAssociate: boolean
  summaryNote: string
  errorDetail?: string | null
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

export async function submitW2PlacementHandoff(
  input: EorPlacementHandoffInput
): Promise<EorPlacementHandoffResult> {
  try {
    const supabase = getAscenServiceClient()
    if (supabase) {
      const nowIso = new Date().toISOString()
      await supabase.from('eor_placements').upsert(
        {
          packet_id: input.packetId,
          reference_id: input.referenceId,
          organization_id: input.employer.orgId || null,
          provider: 'ascen',
          ascen_company_id: input.employer.cachedPartnerClientId
            ? String(input.employer.cachedPartnerClientId)
            : null,
          ascen_worker_id: input.professional.cachedPartnerAssociateId
            ? String(input.professional.cachedPartnerAssociateId)
            : null,
          contract_track: input.contractTrack,
          eor_status: 'pending_sync',
          hourly_pay_rate: input.hourlyPayRate,
          employer_bill_rate: input.employerBillRate,
          weekly_hours: input.weeklyHours,
          target_start_date: input.targetStartDate || null,
          metadata: {
            roleTitle: input.roleTitle,
            employerName: input.employer.legalEntityName || input.employer.name,
            professionalEmail: input.professional.email,
            workState: input.professional.workState,
          },
          updated_at: nowIso,
        },
        { onConflict: 'packet_id' }
      )
    }
  } catch (err) {
    console.warn('eor_placements upsert skipped:', err)
  }

  return {
    syncStatus: 'manual_fallback',
    clientId: input.employer.cachedPartnerClientId ?? null,
    contactId: null,
    associateId: input.professional.cachedPartnerAssociateId ?? null,
    assignmentId: null,
    placementId: null,
    usedExistingAssociate: Boolean(input.professional.cachedPartnerAssociateId),
    summaryNote: `Packet ${input.packetId} queued in SpecialSauce Operations Console for U.S. W-2 EOR partner onboarding dispatch.`,
    errorDetail: null,
  }
}
