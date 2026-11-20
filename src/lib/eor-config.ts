export type EorContractTrack =
  | 'none'
  | 'trial_to_hire_90d'
  | 'fixed_term_w2'
  | 'open_ended_w2'

export interface OrganizationEorConfig {
  defaultContractTrack: EorContractTrack
  defaultDurationMonths: number
  defaultBgCheck: boolean
  defaultDrugCheck: boolean
  defaultEquipmentPolicy: string
  defaultEquipmentNotes: string
  legalEntityName: string
  timecardApproverName: string
  timecardApproverEmail: string
  billingApEmail: string
  defaultSupervisorName: string
  defaultPoNumber: string
  billingStreet1: string
  billingCity: string
  billingState: string
  billingZip: string
  defaultWcCode: string
  diffWorksite: boolean
  worksiteStreet1: string
  worksiteCity: string
  worksiteState: string
  worksiteZip: string
}

export const EOR_CONTRACT_TRACK_OPTIONS: ReadonlyArray<{
  value: EorContractTrack
  label: string
}> = [
  {
    value: 'none',
    label: 'Direct Hire Only (No W-2 Contract Routing)',
  },
  {
    value: 'trial_to_hire_90d',
    label: 'W-2 Contract-to-Hire ($0 Conversion)',
  },
  {
    value: 'fixed_term_w2',
    label: 'Fixed-Term W-2 Contract (3–12 Months + Extend Anytime)',
  },
  {
    value: 'open_ended_w2',
    label: 'Open-Ended Ongoing W-2 Contract (Extend or End Anytime)',
  },
]

export const EOR_EQUIPMENT_POLICY_OPTIONS: ReadonlyArray<string> = [
  'No Equipment Needed / Not Applicable',
  'Company-Shipped Hardware (Laptop / Security Key)',
  'Cloud VDI / BYOD (Virtual Desktop & Passkey Only)',
  'Request Managed Laptop Add-On',
]

export const DEFAULT_ORG_EOR_CONFIG: OrganizationEorConfig = {
  defaultContractTrack: 'none',
  defaultDurationMonths: 6,
  defaultBgCheck: true,
  defaultDrugCheck: false,
  defaultEquipmentPolicy: 'No Equipment Needed / Not Applicable',
  defaultEquipmentNotes: '',
  legalEntityName: '',
  timecardApproverName: '',
  timecardApproverEmail: '',
  billingApEmail: '',
  defaultSupervisorName: '',
  defaultPoNumber: '',
  billingStreet1: '',
  billingCity: '',
  billingState: '',
  billingZip: '',
  defaultWcCode: '8810',
  diffWorksite: false,
  worksiteStreet1: '',
  worksiteCity: '',
  worksiteState: '',
  worksiteZip: '',
}

const VALID_TRACKS = new Set<string>([
  'none',
  'trial_to_hire_90d',
  'fixed_term_w2',
  'open_ended_w2',
])

function decodeBase64Utf8(b64: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64, 'base64').toString('utf-8')
  }
  return decodeURIComponent(
    Array.from(atob(b64))
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
  )
}

function encodeBase64Utf8(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64')
  }
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  )
}

export function hasExplicitEorConfigTag(desc?: string | null): boolean {
  return /\[EOR_CFG:[A-Za-z0-9+/=]+\]/i.test(String(desc || ''))
}

export function extractEorConfigTag(desc?: string | null): string {
  const match = String(desc || '').match(/\[EOR_CFG:[A-Za-z0-9+/=]+\]/i)
  return match ? match[0] : ''
}

export function parseEorConfigFromDescription(
  desc?: string | null
): OrganizationEorConfig {
  const raw = String(desc || '')
  const match = raw.match(/\[EOR_CFG:([A-Za-z0-9+/=]+)\]/i)
  if (match?.[1]) {
    try {
      const parsed = JSON.parse(decodeBase64Utf8(match[1]))
      const trackCandidate = String(parsed?.defaultContractTrack || 'none').trim()
      const defaultContractTrack: EorContractTrack = VALID_TRACKS.has(trackCandidate)
        ? (trackCandidate as EorContractTrack)
        : 'none'
      const dur = Math.min(24, Math.max(1, Number(parsed?.defaultDurationMonths) || 6))
      const rawEqPolicy = String(
        parsed?.defaultEquipmentPolicy || DEFAULT_ORG_EOR_CONFIG.defaultEquipmentPolicy
      ).trim()
      const eqPolicy =
        rawEqPolicy === 'Request EOR Managed Laptop Add-On'
          ? 'Request Managed Laptop Add-On'
          : rawEqPolicy
      return {
        defaultContractTrack,
        defaultDurationMonths: dur,
        defaultBgCheck:
          parsed?.defaultBgCheck !== undefined ? Boolean(parsed.defaultBgCheck) : true,
        defaultDrugCheck: Boolean(parsed?.defaultDrugCheck),
        defaultEquipmentPolicy: EOR_EQUIPMENT_POLICY_OPTIONS.includes(eqPolicy)
          ? eqPolicy
          : DEFAULT_ORG_EOR_CONFIG.defaultEquipmentPolicy,
        defaultEquipmentNotes: String(parsed?.defaultEquipmentNotes || '')
          .trim()
          .slice(0, 240),
        legalEntityName: String(parsed?.legalEntityName || '')
          .trim()
          .slice(0, 128),
        timecardApproverName: String(parsed?.timecardApproverName || '')
          .trim()
          .slice(0, 120),
        timecardApproverEmail: String(parsed?.timecardApproverEmail || '')
          .trim()
          .toLowerCase()
          .slice(0, 160),
        billingApEmail: String(parsed?.billingApEmail || '')
          .trim()
          .toLowerCase()
          .slice(0, 160),
        defaultSupervisorName: String(parsed?.defaultSupervisorName || '')
          .trim()
          .slice(0, 120),
        defaultPoNumber: String(parsed?.defaultPoNumber || '')
          .trim()
          .slice(0, 64),
        billingStreet1: String(parsed?.billingStreet1 || '')
          .trim()
          .slice(0, 120),
        billingCity: String(parsed?.billingCity || '')
          .trim()
          .slice(0, 80),
        billingState: String(parsed?.billingState || '')
          .trim()
          .toUpperCase()
          .slice(0, 2),
        billingZip: String(parsed?.billingZip || '')
          .trim()
          .slice(0, 16),
        defaultWcCode: String(parsed?.defaultWcCode || '8810')
          .trim()
          .slice(0, 10) || '8810',
        diffWorksite: Boolean(parsed?.diffWorksite),
        worksiteStreet1: String(parsed?.worksiteStreet1 || '')
          .trim()
          .slice(0, 120),
        worksiteCity: String(parsed?.worksiteCity || '')
          .trim()
          .slice(0, 80),
        worksiteState: String(parsed?.worksiteState || '')
          .trim()
          .toUpperCase()
          .slice(0, 2),
        worksiteZip: String(parsed?.worksiteZip || '')
          .trim()
          .slice(0, 16),
      }
    } catch {
      return { ...DEFAULT_ORG_EOR_CONFIG }
    }
  }
  return { ...DEFAULT_ORG_EOR_CONFIG }
}

export function embedEorConfigInDescription(
  existingDesc: string | null | undefined,
  cfg: OrganizationEorConfig
): string {
  const cleaned = String(existingDesc || '')
    .replace(/\s*\[EOR_CFG:[A-Za-z0-9+/=]+\]/gi, '')
    .trim()
  const b64 = encodeBase64Utf8(JSON.stringify(cfg))
  return `${cleaned} [EOR_CFG:${b64}]`.replace(/\s+/g, ' ').trim()
}
