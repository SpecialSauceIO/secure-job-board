export const STANDARD_INDUSTRY_VERTICALS = [
  'Technology, Software & SaaS',
  'Artificial Intelligence, Data & Analytics',
  'Cybersecurity & Cloud Infrastructure',
  'IT Services, MSP & Technical Support',
  'BPO, Contact Center & Customer Operations',
  'Finance, Banking, FinTech & Insurance',
  'Healthcare, Biotech & Life Sciences',
  'Defense, Aerospace & Government Contracting',
  'Manufacturing, Supply Chain & Logistics',
  'Energy, Utilities & CleanTech',
  'E-Commerce, Retail & Consumer Goods',
  'Telecommunications & Networking',
  'Media, Marketing, Gaming & Entertainment',
  'Education, EdTech & Corporate Training',
  'Legal, HR, Staffing & Professional Services',
  'Real Estate, Construction & Facilities',
  'Non-Profit, Public Sector & Civic',
  'Other / Multi-Industry',
] as const

export type StandardIndustryVertical = (typeof STANDARD_INDUSTRY_VERTICALS)[number]

/**
 * Maps legacy or free-form strings (e.g. "IT", "SaaS / AI", "FinTech")
 * to the closest standardized Industry Vertical so dropdowns always pre-select cleanly.
 */
export function normalizeIndustryVertical(raw?: string | null): string {
  const val = (raw || '').trim()
  if (!val) return ''

  // Exact match
  const exact = STANDARD_INDUSTRY_VERTICALS.find(
    (item) => item.toLowerCase() === val.toLowerCase()
  )
  if (exact) return exact

  const lower = val.toLowerCase()
  if (lower.includes('cyber') || lower.includes('security') || lower.includes('cloud')) {
    return 'Cybersecurity & Cloud Infrastructure'
  }
  if (lower.includes('ai') || lower.includes('artificial') || lower.includes('data')) {
    return 'Artificial Intelligence, Data & Analytics'
  }
  if (lower.includes('bpo') || lower.includes('call center') || lower.includes('contact center')) {
    return 'BPO, Contact Center & Customer Operations'
  }
  if (
    lower === 'it' ||
    lower.includes('it service') ||
    lower.includes('msp') ||
    lower.includes('support') ||
    lower.includes('enterprise it')
  ) {
    return 'IT Services, MSP & Technical Support'
  }
  if (lower.includes('saas') || lower.includes('software') || lower.includes('tech')) {
    return 'Technology, Software & SaaS'
  }
  if (lower.includes('fin') || lower.includes('bank') || lower.includes('insur')) {
    return 'Finance, Banking, FinTech & Insurance'
  }
  if (lower.includes('health') || lower.includes('med') || lower.includes('bio')) {
    return 'Healthcare, Biotech & Life Sciences'
  }
  if (lower.includes('defen') || lower.includes('aero') || lower.includes('gov')) {
    return 'Defense, Aerospace & Government Contracting'
  }
  if (lower.includes('manufact') || lower.includes('supply') || lower.includes('logist')) {
    return 'Manufacturing, Supply Chain & Logistics'
  }
  if (lower.includes('energy') || lower.includes('util') || lower.includes('oil') || lower.includes('solar')) {
    return 'Energy, Utilities & CleanTech'
  }
  if (lower.includes('retail') || lower.includes('commerce') || lower.includes('consumer')) {
    return 'E-Commerce, Retail & Consumer Goods'
  }
  if (lower.includes('telecom') || lower.includes('network')) {
    return 'Telecommunications & Networking'
  }
  if (lower.includes('media') || lower.includes('market') || lower.includes('game') || lower.includes('gaming')) {
    return 'Media, Marketing, Gaming & Entertainment'
  }
  if (lower.includes('edu') || lower.includes('train') || lower.includes('enablement')) {
    return 'Education, EdTech & Corporate Training'
  }
  if (lower.includes('legal') || lower.includes('hr') || lower.includes('consult') || lower.includes('staff')) {
    return 'Legal, HR, Staffing & Professional Services'
  }
  if (lower.includes('real estate') || lower.includes('construct')) {
    return 'Real Estate, Construction & Facilities'
  }

  return 'Other / Multi-Industry'
}