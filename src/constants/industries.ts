export const STANDARD_INDUSTRY_VERTICALS = [
  'Technology, Software & SaaS',
  'Artificial Intelligence, Data & Analytics',
  'Cybersecurity & Cloud Infrastructure',
  'IT Services, MSP & Technical Support',
  'BPO, Contact Center & Customer Operations',
  'Finance, Banking, FinTech & Insurance',
  'Accounting, Tax, Audit & Advisory',
  'Healthcare, Biotech, Pharma & Life Sciences',
  'Hospitality, Food Service, Restaurants & Travel',
  'Agriculture, Forestry, Conservation & Outdoor',
  'Government & Public Administration (Federal, State & Local)',
  'Public Safety, Law Enforcement, Fire & Emergency Services',
  'Defense, Aerospace & Government Contracting',
  'Non-Profit, Philanthropy & Civic Organizations',
  'Manufacturing, Industrial & Production',
  'Wholesale Trade, Supply Chain, Logistics & Distribution',
  'Architecture, Civil Engineering & Environmental Services',
  'Real Estate, Construction, Facilities & Skilled Trades',
  'Energy, Oil & Gas, Utilities & CleanTech',
  'Automotive, Aviation, Marine & Transportation',
  'E-Commerce, Retail & Consumer Goods (CPG)',
  'Telecommunications, Hardware & Networking',
  'Media, Marketing, Advertising, Gaming & Entertainment',
  'Arts, Design, Photography & Creative Studios',
  'Education, EdTech, K-12, Higher Ed & Corporate Training',
  'Legal, HR, Staffing, Recruiting & Management Consulting',
  'Fitness, Wellness, Sports & Personal Care Services',
  'Other / Multi-Industry',
] as const

export type IndustryVertical = (typeof STANDARD_INDUSTRY_VERTICALS)[number]

/**
 * Normalizes any raw or AI-extracted industry string to the closest
 * canonical vertical in STANDARD_INDUSTRY_VERTICALS so filters always match.
 */
export function normalizeIndustryVertical(raw?: string | null): string {
  if (!raw) return 'Technology, Software & SaaS'
  const cleaned = raw.trim()
  if (!cleaned) return 'Technology, Software & SaaS'

  // 1. Exact match (case-insensitive)
  const exactMatch = STANDARD_INDUSTRY_VERTICALS.find(
    (v) => v.toLowerCase() === cleaned.toLowerCase()
  )
  if (exactMatch) return exactMatch

  const lower = cleaned.toLowerCase()

  // 2. Hospitality, Food Service, Restaurants & Travel
  if (
    lower.includes('hospitality') ||
    lower.includes('food') ||
    lower.includes('restaurant') ||
    lower.includes('culinary') ||
    lower.includes('kitchen') ||
    lower.includes('bakery') ||
    lower.includes('catering') ||
    lower.includes('hotel') ||
    lower.includes('resort') ||
    lower.includes('travel') ||
    lower.includes('tourism') ||
    lower.includes('leisure') ||
    lower.includes('bar ') ||
    lower.includes('cafe')
  ) {
    return 'Hospitality, Food Service, Restaurants & Travel'
  }

  // 3. Agriculture, Forestry, Conservation & Outdoor
  if (
    lower.includes('agricult') ||
    lower.includes('farm') ||
    lower.includes('ranch') ||
    lower.includes('forest') ||
    lower.includes('park') ||
    lower.includes('conservation') ||
    lower.includes('wildlife') ||
    lower.includes('outdoor') ||
    lower.includes('agritech') ||
    lower.includes('fishery') ||
    lower.includes('horticult') ||
    lower.includes('landscap') ||
    lower.includes('natural resource') ||
    lower.includes('veterinar')
  ) {
    return 'Agriculture, Forestry, Conservation & Outdoor'
  }

  // 4. Public Safety, Law Enforcement, Fire & Emergency Services
  if (
    lower.includes('public safety') ||
    lower.includes('law enforcement') ||
    lower.includes('police') ||
    lower.includes('fire ') ||
    lower.includes('firefighter') ||
    lower.includes('emergency') ||
    lower.includes('ems') ||
    lower.includes('paramedic') ||
    lower.includes('physical security') ||
    lower.includes('correction')
  ) {
    return 'Public Safety, Law Enforcement, Fire & Emergency Services'
  }

  // 5. Defense, Aerospace & Government Contracting
  if (
    lower.includes('defense') ||
    lower.includes('aerospace') ||
    lower.includes('contracting') ||
    lower.includes('military') ||
    lower.includes('dod') ||
    lower.includes('space')
  ) {
    return 'Defense, Aerospace & Government Contracting'
  }

  // 6. Government & Public Administration (Federal, State & Local)
  if (
    lower.includes('government') ||
    lower.includes('federal') ||
    lower.includes('municipal') ||
    lower.includes('state agency') ||
    lower.includes('city of') ||
    lower.includes('county') ||
    lower.includes('public administration') ||
    lower.includes('civil service') ||
    lower.includes('public sector')
  ) {
    return 'Government & Public Administration (Federal, State & Local)'
  }

  // 7. Non-Profit, Philanthropy & Civic Organizations
  if (
    lower.includes('non-profit') ||
    lower.includes('nonprofit') ||
    lower.includes('philanthrop') ||
    lower.includes('charity') ||
    lower.includes('foundation') ||
    lower.includes('ngo') ||
    lower.includes('civic') ||
    lower.includes('religious') ||
    lower.includes('social service')
  ) {
    return 'Non-Profit, Philanthropy & Civic Organizations'
  }

  // 8. Accounting, Tax, Audit & Advisory
  if (
    lower.includes('accounting') ||
    lower.includes('accountant') ||
    lower.includes('cpa') ||
    lower.includes('bookkeep') ||
    lower.includes('tax') ||
    lower.includes('audit') ||
    lower.includes('payroll')
  ) {
    return 'Accounting, Tax, Audit & Advisory'
  }

  // 9. Finance, Banking, FinTech & Insurance
  if (
    lower.includes('financ') ||
    lower.includes('bank') ||
    lower.includes('fintech') ||
    lower.includes('insur') ||
    lower.includes('wealth') ||
    lower.includes('invest') ||
    lower.includes('capital') ||
    lower.includes('mortgage') ||
    lower.includes('credit')
  ) {
    return 'Finance, Banking, FinTech & Insurance'
  }

  // 10. AI, Data & Analytics
  if (
    lower.includes('artificial intelligence') ||
    lower.includes('machine learning') ||
    lower.includes('data') ||
    lower.includes('analytics') ||
    lower === 'ai'
  ) {
    return 'Artificial Intelligence, Data & Analytics'
  }

  // 11. Cybersecurity & Cloud
  if (
    lower.includes('cyber') ||
    lower.includes('security') ||
    lower.includes('infosec') ||
    lower.includes('cloud')
  ) {
    return 'Cybersecurity & Cloud Infrastructure'
  }

  // 12. IT Services, MSP & Technical Support
  if (
    lower.includes('it service') ||
    lower.includes('msp') ||
    lower.includes('technical support') ||
    lower.includes('help desk') ||
    lower.includes('managed service') ||
    lower.includes('system admin')
  ) {
    return 'IT Services, MSP & Technical Support'
  }

  // 13. BPO & Contact Center
  if (
    lower.includes('bpo') ||
    lower.includes('contact center') ||
    lower.includes('call center') ||
    lower.includes('customer operations') ||
    lower.includes('customer support') ||
    lower.includes('customer service')
  ) {
    return 'BPO, Contact Center & Customer Operations'
  }

  // 14. Healthcare, Biotech, Pharma & Life Sciences
  if (
    lower.includes('health') ||
    lower.includes('medical') ||
    lower.includes('biotech') ||
    lower.includes('pharma') ||
    lower.includes('clinical') ||
    lower.includes('hospital') ||
    lower.includes('dental') ||
    lower.includes('nursing') ||
    lower.includes('life science')
  ) {
    return 'Healthcare, Biotech, Pharma & Life Sciences'
  }

  // 15. Wholesale Trade, Supply Chain, Logistics & Distribution
  if (
    lower.includes('wholesale') ||
    lower.includes('distribution') ||
    lower.includes('distributor') ||
    lower.includes('supply chain') ||
    lower.includes('logistic') ||
    lower.includes('warehouse') ||
    lower.includes('freight') ||
    lower.includes('import') ||
    lower.includes('export') ||
    lower.includes('procurement')
  ) {
    return 'Wholesale Trade, Supply Chain, Logistics & Distribution'
  }

  // 16. Manufacturing, Industrial & Production
  if (
    lower.includes('manufactur') ||
    lower.includes('industrial') ||
    lower.includes('factory') ||
    lower.includes('production') ||
    lower.includes('machin') ||
    lower.includes('chemical') ||
    lower.includes('packaging')
  ) {
    return 'Manufacturing, Industrial & Production'
  }

  // 17. Architecture, Civil Engineering & Environmental Services
  if (
    lower.includes('architect') ||
    lower.includes('civil engineer') ||
    lower.includes('structural engineer') ||
    lower.includes('mechanical engineer') ||
    lower.includes('environmental') ||
    lower.includes('surveying') ||
    lower.includes('urban plan')
  ) {
    return 'Architecture, Civil Engineering & Environmental Services'
  }

  // 18. Real Estate, Construction, Facilities & Skilled Trades
  if (
    lower.includes('real estate') ||
    lower.includes('construct') ||
    lower.includes('property') ||
    lower.includes('facilities') ||
    lower.includes('skilled trade') ||
    lower.includes('hvac') ||
    lower.includes('plumbing') ||
    lower.includes('electrical') ||
    lower.includes('carpentr') ||
    lower.includes('welding') ||
    lower.includes('roofing')
  ) {
    return 'Real Estate, Construction, Facilities & Skilled Trades'
  }

  // 19. Energy, Oil & Gas, Utilities & CleanTech
  if (
    lower.includes('energy') ||
    lower.includes('utilit') ||
    lower.includes('oil') ||
    lower.includes('gas') ||
    lower.includes('solar') ||
    lower.includes('wind') ||
    lower.includes('clean') ||
    lower.includes('renewable') ||
    lower.includes('mining')
  ) {
    return 'Energy, Oil & Gas, Utilities & CleanTech'
  }

  // 20. Automotive, Aviation, Marine & Transportation
  if (
    lower.includes('automot') ||
    lower.includes('aviation') ||
    lower.includes('airline') ||
    lower.includes('transport') ||
    lower.includes('trucking') ||
    lower.includes('fleet') ||
    lower.includes('rail') ||
    lower.includes('maritime') ||
    lower.includes('marine')
  ) {
    return 'Automotive, Aviation, Marine & Transportation'
  }

  // 21. E-Commerce, Retail & Consumer Goods (CPG)
  if (
    lower.includes('e-commerce') ||
    lower.includes('ecommerce') ||
    lower.includes('retail') ||
    lower.includes('consumer') ||
    lower.includes('cpg') ||
    lower.includes('apparel') ||
    lower.includes('fashion') ||
    lower.includes('grocery')
  ) {
    return 'E-Commerce, Retail & Consumer Goods (CPG)'
  }

  // 22. Telecommunications, Hardware & Networking
  if (
    lower.includes('telecom') ||
    lower.includes('network') ||
    lower.includes('wireless') ||
    lower.includes('broadband') ||
    lower.includes('hardware') ||
    lower.includes('semiconductor')
  ) {
    return 'Telecommunications, Hardware & Networking'
  }

  // 23. Arts, Design, Photography & Creative Studios
  if (
    lower.includes('design') ||
    lower.includes('graphic') ||
    lower.includes('photograph') ||
    lower.includes('art') ||
    lower.includes('creative') ||
    lower.includes('animation') ||
    lower.includes('illustrat') ||
    lower.includes('museum')
  ) {
    return 'Arts, Design, Photography & Creative Studios'
  }

  // 24. Media, Marketing, Advertising, Gaming & Entertainment
  if (
    lower.includes('media') ||
    lower.includes('market') ||
    lower.includes('advertising') ||
    lower.includes('public relations') ||
    lower.includes('gaming') ||
    lower.includes('game') ||
    lower.includes('entertain') ||
    lower.includes('film') ||
    lower.includes('music') ||
    lower.includes('publishing')
  ) {
    return 'Media, Marketing, Advertising, Gaming & Entertainment'
  }

  // 25. Education, EdTech, K-12, Higher Ed & Corporate Training
  if (
    lower.includes('educat') ||
    lower.includes('edtech') ||
    lower.includes('school') ||
    lower.includes('k-12') ||
    lower.includes('universit') ||
    lower.includes('college') ||
    lower.includes('training') ||
    lower.includes('enablement')
  ) {
    return 'Education, EdTech, K-12, Higher Ed & Corporate Training'
  }

  // 26. Legal, HR, Staffing, Recruiting & Management Consulting
  if (
    lower.includes('legal') ||
    lower.includes('law') ||
    lower.includes('attorney') ||
    lower.includes('staffing') ||
    lower.includes('recruit') ||
    lower.includes('human resource') ||
    lower.includes('consulting') ||
    lower.includes('professional service')
  ) {
    return 'Legal, HR, Staffing, Recruiting & Management Consulting'
  }

  // 27. Fitness, Wellness, Sports & Personal Care Services
  if (
    lower.includes('fitness') ||
    lower.includes('wellness') ||
    lower.includes('gym') ||
    lower.includes('sport') ||
    lower.includes('athletic') ||
    lower.includes('salon') ||
    lower.includes('spa') ||
    lower.includes('beauty') ||
    lower.includes('personal care')
  ) {
    return 'Fitness, Wellness, Sports & Personal Care Services'
  }

  // 28. Software / Tech fallback
  if (
    lower.includes('tech') ||
    lower.includes('software') ||
    lower.includes('saas') ||
    lower.includes('engineering')
  ) {
    return 'Technology, Software & SaaS'
  }

  return 'Other / Multi-Industry'
}