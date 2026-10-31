import { STANDARD_INDUSTRY_VERTICALS, normalizeIndustryVertical } from '@/constants/industries'

/**
 * DLC Feature Gate:
 * Keeps True Horizon™ active in local development (localhost) or when
 * NEXT_PUBLIC_ENABLE_TRUE_HORIZON='true', while keeping it hidden on live
 * production until the official DLC release.
 */
export function isTrueHorizonDlcEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_TRUE_HORIZON === 'true') return true
  if (process.env.NODE_ENV === 'development') return true
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') return true
  }
  return false
}

export type BridgeAcquisitionModality =
  | 'credential_fast_track'
  | 'sandbox_and_terminology'
  | 'industry_exposure_required'

export type HorizonFeasibilityTier =
  | 'high_fast_track'
  | 'moderate_stepping_stone'
  | 'low_structural_barrier'

export interface BridgeDeltaSkillSpec {
  skill: string
  recommendedLevel: 'Beginner' | 'Intermediate' | 'Expert'
  fitLiftPoints: number
  isSelfStudyBridgeable: boolean
  rationale: string
  modality: BridgeAcquisitionModality
  modalityLabel: string
  estimatedTimeToBridge: string
  actionableSteps: string[]
  recommendedCredentialsOrResources: string[]
  honestProfileFraming: string
}

export interface OperationalAxisScore {
  axis:
    | 'Systems & Architecture'
    | 'Process & SLA Rigor'
    | 'Escalation & Crisis Triage'
    | 'Resource & Vendor Orchestration'
    | 'Enablement & Knowledge Transfer'
    | 'Commercial & Throughput Velocity'
  shortLabel: string
  score: number
  evidence: string
}

export interface TerminologyTranslation {
  legacyTerm: string
  targetVerticalTerm: string
  operationalPrimitive: string
}

export interface HorizonVerticalProjection {
  vertical: string
  isCurrentPrimary: boolean
  feasibilityTier: HorizonFeasibilityTier
  feasibilityLabel: string
  realityCheckWarning: string
  transferabilityScore: number
  currentDirectFitEstimate: number
  shortTermSelfStudyCeiling: number
  projectedBridgedFitScore: number
  dominantSharedAxes: string[]
  targetRoleArchetypes: string[]
  estimatedPayBand: string
  terminologyTranslations: TerminologyTranslation[]
  bridgeDeltaSkills: BridgeDeltaSkillSpec[]
  executiveSummary: string
}

export interface LiveJobHorizonBridge {
  jobId: string
  title: string
  industry: string
  location: string
  workModel: string
  formattedPay: string
  feasibilityTier: HorizonFeasibilityTier
  feasibilityBadge: string
  currentTrueFitScore: number
  horizonTransferabilityScore: number
  shortTermSelfStudyCeiling: number
  projectedBridgedTrueFitScore: number
  matchedCoreSkills: string[]
  totalRequiredSkills: number
  bridgeDeltaSkills: {
    skill: string
    requiredLevel: string
    fitLiftPoints: number
    isSelfStudyBridgeable: boolean
    modality: BridgeAcquisitionModality
    modalityLabel: string
    estimatedTimeToBridge: string
    howToBridgeSummary: string
    recommendedResource: string
  }[]
  whyOperationalDnaFits: string
}

export interface TrueHorizonAnalysisResult {
  generatedAt: string
  primaryIndustry: string
  overallTransferabilityIndex: number
  operationalRadar: OperationalAxisScore[]
  topHorizonVerticals: HorizonVerticalProjection[]
  liveJobBridges: LiveJobHorizonBridge[]
}

export interface LearningResourceLink {
  label: string
  url: string
  provider: string
  isOfficialAuthority: boolean
}

const CANONICAL_RESOURCE_URLS: { pattern: RegExp; url: string; provider: string }[] = [
  { pattern: /sc-900|security, compliance, and identity/i, url: 'https://learn.microsoft.com/en-us/credentials/certifications/security-compliance-and-identity-fundamentals/', provider: 'Microsoft Learn' },
  { pattern: /az-900|azure fundamentals/i, url: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/', provider: 'Microsoft Learn' },
  { pattern: /copilot|microsoft learn/i, url: 'https://learn.microsoft.com/en-us/training/', provider: 'Microsoft Learn' },
  { pattern: /anthropic|claude/i, url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview', provider: 'Anthropic Docs' },
  { pattern: /deeplearning\.ai/i, url: 'https://www.deeplearning.ai/short-courses/', provider: 'DeepLearning.AI' },
  { pattern: /supabase|pgvector/i, url: 'https://supabase.com/docs/guides/ai', provider: 'Supabase Docs' },
  { pattern: /automate the boring stuff|python/i, url: 'https://automatetheboringstuff.com/', provider: 'Python Open Textbook' },
  { pattern: /groq|openai api/i, url: 'https://console.groq.com/docs/quickstart', provider: 'Groq Cloud Docs' },
  { pattern: /hhs\.gov|hipaa/i, url: 'https://www.hhs.gov/hipaa/for-professionals/training/index.html', provider: 'HHS.gov Official' },
  { pattern: /hitrust/i, url: 'https://hitrustalliance.net/academy/', provider: 'HITRUST Academy' },
  { pattern: /hl7|fhir/i, url: 'https://www.hl7.org/fhir/overview.html', provider: 'HL7 International' },
  { pattern: /healthit\.gov|ehr/i, url: 'https://www.healthit.gov/topic/health-it-and-health-information-exchange-basics', provider: 'HealthIT.gov' },
  { pattern: /hfma|crcr|revenue cycle/i, url: 'https://www.hfma.org/certifications/certified-revenue-cycle-representative-crcr/', provider: 'HFMA Official' },
  { pattern: /cms\.gov|medicare learning/i, url: 'https://www.cms.gov/training-education/medicare-learning-network', provider: 'CMS.gov MLN' },
  { pattern: /atlassian|jira|agile/i, url: 'https://university.atlassian.com/', provider: 'Atlassian University' },
  { pattern: /product school|product operations/i, url: 'https://productschool.com/resources', provider: 'Product School' },
  { pattern: /gainsight|customer success/i, url: 'https://education.gainsight.com/', provider: 'Gainsight Pulse+' },
  { pattern: /sqlbolt|sql/i, url: 'https://sqlbolt.com/', provider: 'SQLBolt Interactive' },
  { pattern: /okta|entra|zero-trust/i, url: 'https://www.microsoft.com/en-us/security/business/zero-trust', provider: 'Microsoft Security' },
  { pattern: /isc2|certified in cybersecurity/i, url: 'https://www.isc2.org/certifications/cc', provider: 'ISC2 Official' },
  { pattern: /nist csf|cybersecurity framework/i, url: 'https://www.nist.gov/cyberframework', provider: 'NIST.gov Official' },
  { pattern: /comptia|security\+|a\+|network\+/i, url: 'https://www.comptia.org/certifications', provider: 'CompTIA Official' },
  { pattern: /copc|vendor management/i, url: 'https://www.copc.com/standards/', provider: 'COPC Standards' },
  { pattern: /icmi|workforce management/i, url: 'https://www.icmi.com/Training', provider: 'ICMI Training' },
  { pattern: /occ bulletin|third-party|tprm|shared assessments/i, url: 'https://www.occ.gov/news-issuances/bulletins/2023/bulletin-2023-17.html', provider: 'OCC.gov Regulatory' },
  { pattern: /acams|kyc|aml/i, url: 'https://www.acams.org/en/training-and-certification', provider: 'ACAMS Official' },
  { pattern: /stripe identity|radar/i, url: 'https://docs.stripe.com/identity', provider: 'Stripe Docs' },
  { pattern: /isaca|crisc/i, url: 'https://www.isaca.org/credentialing/crisc', provider: 'ISACA Official' },
  { pattern: /ascm|apics|supply chain/i, url: 'https://www.ascm.org/learning-development/', provider: 'ASCM / APICS' },
  { pattern: /corporate finance institute|cfi|unit economics/i, url: 'https://corporatefinanceinstitute.com/resources/accounting/unit-economics/', provider: 'CFI Education' },
  { pattern: /ebay|marketplace/i, url: 'https://sellercentre.ebay.com/', provider: 'eBay Seller Academy' },
  { pattern: /google analytics|ga4/i, url: 'https://skillshop.withgoogle.com/', provider: 'Google Skillshop' },
  { pattern: /atd|instructional design|addie/i, url: 'https://www.td.org/education-courses', provider: 'ATD Education' },
  { pattern: /kirkpatrick|okr/i, url: 'https://www.whatmatters.com/get-certified', provider: 'WhatMatters OKR' },
  { pattern: /cdse|cui|800-171|cmmc/i, url: 'https://www.cdse.edu/Training/eLearning/', provider: 'DoD CDSE Official' },
  { pattern: /fedramp/i, url: 'https://www.fedramp.gov/training/', provider: 'FedRAMP.gov Official' },
  { pattern: /pmi|dau|earned value|evm/i, url: 'https://www.dau.edu/', provider: 'Defense Acquisition Univ' },
  { pattern: /itil/i, url: 'https://www.peoplecert.org/browse-certifications/it-governance-and-service-management/ITIL-1', provider: 'PeopleCert ITIL' },
  { pattern: /wcag|accessibility/i, url: 'https://www.w3.org/WAI/standards-guidelines/wcag/', provider: 'W3C WAI Official' },
  { pattern: /shrm|employment law|hris/i, url: 'https://www.shrm.org/credentials/certification', provider: 'SHRM Official' },
  { pattern: /figma/i, url: 'https://help.figma.com/hc/en-us/categories/360002051613-Get-started', provider: 'Figma Learn' },
  { pattern: /osha/i, url: 'https://www.osha.gov/training', provider: 'OSHA.gov Official' },
  { pattern: /faa\.gov|aviation/i, url: 'https://www.faa.gov/training_testing', provider: 'FAA.gov Official' },
  { pattern: /aicpa|cpa|gaap/i, url: 'https://www.aicpa-cima.com/', provider: 'AICPA Official' },
  { pattern: /fema|emergency management|nics/i, url: 'https://training.fema.gov/is/', provider: 'FEMA Emergency Management Institute' },
  { pattern: /usda|agriculture/i, url: 'https://www.farmers.gov/working-with-us', provider: 'USDA Farmers.gov' },
  { pattern: /servsafe|hospitality/i, url: 'https://www.servsafe.com/', provider: 'ServSafe Official' },
  { pattern: /nasm|ace fitness/i, url: 'https://www.nasm.org/', provider: 'NASM Official' },
]

export function resolveLearningResourceLinks(
  resourceOrSkillText: string,
  fallbackSkillName?: string
): LearningResourceLink[] {
  const cleanText = String(resourceOrSkillText || '').trim()
  const searchTopic = String(fallbackSkillName || cleanText)
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-zA-Z0-9\s&+/-]/g, ' ')
    .trim()
  const encodedTopic = encodeURIComponent(searchTopic)

  for (const entry of CANONICAL_RESOURCE_URLS) {
    if (entry.pattern.test(cleanText) || (fallbackSkillName && entry.pattern.test(fallbackSkillName))) {
      return [
        {
          label: cleanText,
          url: entry.url,
          provider: entry.provider,
          isOfficialAuthority: true,
        },
        {
          label: `Coursera Accredited Courses: ${searchTopic}`,
          url: `https://www.coursera.org/search?query=${encodedTopic}`,
          provider: 'Coursera Catalog',
          isOfficialAuthority: false,
        },
      ]
    }
  }

  return [
    {
      label: `Coursera Certificate Catalog: ${searchTopic}`,
      url: `https://www.coursera.org/search?query=${encodedTopic}`,
      provider: 'Coursera',
      isOfficialAuthority: false,
    },
    {
      label: `edX University Courses: ${searchTopic}`,
      url: `https://www.edx.org/search?q=${encodedTopic}`,
      provider: 'edX',
      isOfficialAuthority: false,
    },
  ]
}

interface VerticalArchetypeSpec {
  vertical: string
  weights: [number, number, number, number, number, number]
  domainKeywords: RegExp
  structuralBarrierPenalty: number
  barrierExplanation: string
  roleArchetypes: string[]
  payBand: string
  translations: [string, string, string][]
  bridgeSkills: Omit<BridgeDeltaSkillSpec, 'isSelfStudyBridgeable'>[]
}

const VERTICAL_ARCHETYPE_MATRIX: VerticalArchetypeSpec[] = [
  {
    vertical: 'Technology, Software & SaaS',
    weights: [0.28, 0.15, 0.16, 0.16, 0.15, 0.10],
    domainKeywords: /saas|software|cloud|api|agile|jira|product|typescript|python|sql|microsoft|onboarding|release|devops|tech/i,
    structuralBarrierPenalty: 4,
    barrierExplanation: 'Low licensing barrier; heavily rewards demonstrable technical tooling, SaaS release governance, and customer adoption metrics.',
    roleArchetypes: ['Senior Technical Program Manager (SaaS)', 'Enterprise Customer Success & Enablement Lead', 'Product Operations & Release Readiness Manager'],
    payBand: '$115k – $160k /yr',
    translations: [
      ['Service Desk / Escalation Lead', 'Incident Response & Release Readiness Lead', 'Escalation & Crisis Triage'],
      ['Vendor / BPO Supervision', 'Cross-Functional Engineering & Ops Orchestration', 'Resource & Vendor Orchestration'],
      ['End-User Training', 'Enterprise SaaS Adoption & Technical Enablement', 'Enablement & Knowledge Transfer'],
    ],
    bridgeSkills: [
      {
        skill: 'SaaS Product Operations & Agile Delivery',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 14,
        rationale: 'Maps operational cadence to recurring software release cycles.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Fast-Track Framework Bridge (1–2 Weeks)',
        estimatedTimeToBridge: '10–14 Hours',
        actionableSteps: ['Map your program planning and escalation review cadences to Agile sprint ceremonies and release readiness checklists.'],
        recommendedCredentialsOrResources: ['Atlassian Agile with Jira & Release Governance Track', 'Product School: Product Operations Fundamentals'],
        honestProfileFraming: 'Frame as "SaaS Release Readiness & Cross-Functional Program Operations".',
      },
      {
        skill: 'Enterprise Customer Onboarding & Retention',
        recommendedLevel: 'Expert',
        fitLiftPoints: 12,
        rationale: 'Converts support escalation mastery into proactive Net Dollar Retention.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Direct Equivalence Translation (1 Week)',
        estimatedTimeToBridge: '4–6 Hours',
        actionableSteps: ['Translate your support metrics (CSAT, FCR, Time-to-Onboard) into SaaS Customer Success metrics (Time-to-Value, Churn Deflection).'],
        recommendedCredentialsOrResources: ['Gainsight Customer Success Leadership Playbook'],
        honestProfileFraming: 'Safe to add if you have led enterprise client onboarding or escalation retention.',
      },
      {
        skill: 'SQL / Telemetry Analytics',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 8,
        rationale: 'Links KPI reporting directly to product adoption telemetry.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Technical Sandbox Lab (1–2 Weeks)',
        estimatedTimeToBridge: '12 Hours',
        actionableSteps: ['Practice writing SELECT, JOIN, and GROUP BY cohort queries in a SQL sandbox.'],
        recommendedCredentialsOrResources: ['SQLBolt Interactive SQL Tutorial'],
        honestProfileFraming: 'List at "Beginner / Intermediate" once you can query user adoption tables.',
      },
    ],
  },
  {
    vertical: 'Artificial Intelligence, Data & Analytics',
    weights: [0.28, 0.14, 0.10, 0.16, 0.22, 0.10],
    domainKeywords: /ai|artificial intelligence|llm|prompt|machine learning|data|analytics|rag|python|evaluation|genai|generative|model|anthropic|openai/i,
    structuralBarrierPenalty: 6,
    barrierExplanation: 'No formal government license required, but employers strictly test hands-on LLM evaluation, prompt architecture, or data pipeline literacy.',
    roleArchetypes: ['AI Enablement & Knowledge Program Lead', 'LLM Operations & Evaluation Specialist', 'Technical AI Deployment Program Manager'],
    payBand: '$125k – $175k /yr',
    translations: [
      ['Knowledge Base / SOP Authoring', 'RAG Corpus Curation & Prompt Grounding', 'Enablement & Knowledge Transfer'],
      ['Escalation QA & Ticket Audits', 'RLHF / Model Output Evaluation & Guardrails', 'Process & SLA Rigor'],
      ['Support Tooling & Scripting', 'Agentic Workflow & Pipeline Automation', 'Systems & Architecture'],
    ],
    bridgeSkills: [
      {
        skill: 'Prompt Engineering & LLM Evaluation',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 15,
        rationale: 'Translates existing QA and training rigor directly into AI model readiness.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Fast-Track Credential + Lab (1–2 Weeks)',
        estimatedTimeToBridge: '10–15 Hours',
        actionableSteps: ['Complete a structured LLM evaluation & prompt architecture course covering rubric grading and hallucination auditing.'],
        recommendedCredentialsOrResources: ['Anthropic Prompt Engineering Interactive Tutorial', 'DeepLearning.AI: Evaluating and Debugging Generative AI'],
        honestProfileFraming: 'Frame as "LLM Output Evaluation & Prompt Guardrail Design".',
      },
      {
        skill: 'RAG Knowledge Architecture',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 12,
        rationale: 'Bridges enterprise documentation management into vector-grounded AI workflows.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Technical Sandbox Bridge (2–3 Weeks)',
        estimatedTimeToBridge: '15–20 Hours',
        actionableSteps: ['Learn how enterprise documentation is chunked, embedded, and retrieved in a Vector Database (e.g., Supabase pgvector).'],
        recommendedCredentialsOrResources: ['Supabase pgvector & RAG Architecture Documentation Lab'],
        honestProfileFraming: 'Frame as "AI-Ready Knowledge Architecture & RAG Corpus Governance".',
      },
      {
        skill: 'Python / API Workflow Automation',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 9,
        rationale: 'Connects systems troubleshooting to automated model evaluation pipelines.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Practical Scripting Bridge (2–4 Weeks)',
        estimatedTimeToBridge: '20 Hours',
        actionableSteps: ['Write Python scripts that call REST APIs, parse JSON payloads, and export automated evaluation reports.'],
        recommendedCredentialsOrResources: ['Automate the Boring Stuff with Python', 'Groq API Quickstart Docs'],
        honestProfileFraming: 'List at "Beginner / Intermediate" for API scripting and workflow automation.',
      },
    ],
  },
  {
    vertical: 'IT Services, MSP & Technical Support',
    weights: [0.26, 0.20, 0.24, 0.14, 0.12, 0.04],
    domainKeywords: /it service|msp|technical support|help desk|service desk|office 365|m365|comptia|itil|escalation|troubleshooting|active directory|entra|windows|mac/i,
    structuralBarrierPenalty: 2,
    barrierExplanation: 'Direct operational alignment for IT support, service desk, and enterprise enablement professionals.',
    roleArchetypes: ['Director of Service Desk & Technical Support', 'MSP Service Delivery & Escalation Manager', 'Enterprise M365 / Cloud Support Enablement Lead'],
    payBand: '$95k – $140k /yr',
    translations: [
      ['Ticket Queue Supervision', 'ITSM / ITIL Incident & Problem Governance', 'Escalation & Crisis Triage'],
      ['Agent Coaching & QA', 'Technical Support Enablement & MTTR Optimization', 'Enablement & Knowledge Transfer'],
      ['System Administration', 'Multi-Tenant Cloud & Endpoint Architecture', 'Systems & Architecture'],
    ],
    bridgeSkills: [
      {
        skill: 'ITIL v4 Service Management & SLA Governance',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 14,
        rationale: 'Formalizes service desk leadership into industry-standard ITSM terminology.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Fast-Track Certification Bridge (1–2 Weeks)',
        estimatedTimeToBridge: '10–14 Hours',
        actionableSteps: ['Map your incident, problem, and change management workflows to ITIL v4 practices.'],
        recommendedCredentialsOrResources: ['ITIL® 4 Foundation Official Certification Prep'],
        honestProfileFraming: 'Frame as "ITSM / ITIL Incident, Escalation & SLA Governance".',
      },
      {
        skill: 'Multi-Tenant M365 & Entra ID Administration',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 12,
        rationale: 'Validates hands-on enterprise cloud directory and endpoint management.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Technical Equivalence Bridge (1 Week)',
        estimatedTimeToBridge: '8–10 Hours',
        actionableSteps: ['Document your Office 365 / Entra ID provisioning, conditional access, and escalation experience.'],
        recommendedCredentialsOrResources: ['Microsoft Learn: M365 & Identity Administration Paths'],
        honestProfileFraming: 'Frame as "Enterprise M365 & Identity Support Operations".',
      },
      {
        skill: 'AI Ticket Deflection & Self-Service Automation',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 9,
        rationale: 'Differentiates modern support leaders from legacy queue managers.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Direct AI Enablement Synergy (Immediate)',
        estimatedTimeToBridge: '4–6 Hours',
        actionableSteps: ['Highlight how you use AI knowledge bases and copilots to reduce Average Handle Time (AHT) and Tier-1 volume.'],
        recommendedCredentialsOrResources: ['Microsoft Copilot for Service Deployment Playbook'],
        honestProfileFraming: 'Frame as "AI-Augmented Support Enablement & Ticket Deflection".',
      },
    ],
  },
  {
    vertical: 'BPO, Contact Center & Customer Operations',
    weights: [0.14, 0.24, 0.22, 0.22, 0.12, 0.06],
    domainKeywords: /bpo|contact center|call center|vendor|customer support|customer service|sla|qa|escalation|queue|aht|csat|workforce/i,
    structuralBarrierPenalty: 2,
    barrierExplanation: 'Very low structural barrier for professionals with vendor management, service desk, or escalation leadership experience.',
    roleArchetypes: ['Global Vendor Program & BPO Operations Director', 'Workforce & Service Delivery Optimization Lead', 'Customer Experience (CX) Transformation Manager'],
    payBand: '$105k – $145k /yr',
    translations: [
      ['Team Supervision & Coaching', 'Multi-Site BPO Partner Governance & SLA Enforcement', 'Resource & Vendor Orchestration'],
      ['Issue Resolution', 'High-Severity Escalation & Root-Cause Governance', 'Escalation & Crisis Triage'],
      ['Process Documentation', 'Global Playbook Standardization & AHT Optimization', 'Process & SLA Rigor'],
    ],
    bridgeSkills: [
      {
        skill: 'Vendor SLA & MSA Partner Governance',
        recommendedLevel: 'Expert',
        fitLiftPoints: 15,
        rationale: 'Formalizes partner oversight into executive vendor program management.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Direct Experience Reframing (Immediate)',
        estimatedTimeToBridge: '2–4 Hours',
        actionableSteps: ['Explicitly cite your Quarterly Business Reviews (QBRs), SLA adherence scorecards, and multi-site vendor oversight.'],
        recommendedCredentialsOrResources: ['COPC® Customer Experience & Vendor Management Standard'],
        honestProfileFraming: 'Safe to add immediately if you have managed external vendor or BPO queues.',
      },
      {
        skill: 'Workforce Capacity & Shrinkage Modeling',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 11,
        rationale: 'Connects ticket volume tracking to contact center unit-cost economics.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Operational Math Reframing (1 Week)',
        estimatedTimeToBridge: '6–8 Hours',
        actionableSteps: ['Review Erlang-C staffing basics, utilization, and cost-per-contact modeling.'],
        recommendedCredentialsOrResources: ['ICMI Workforce Management (WFM) Training'],
        honestProfileFraming: 'Frame as "Queue Capacity Planning & Service Delivery Optimization".',
      },
      {
        skill: 'Omnichannel CX & Copilot Enablement',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 9,
        rationale: 'Modernizes legacy support queues with automated triage.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Direct AI Enablement Synergy (Immediate)',
        estimatedTimeToBridge: '4 Hours',
        actionableSteps: ['Show how knowledge engineering and AI agent-assist reduce ramp time for BPO cohorts.'],
        recommendedCredentialsOrResources: ['Microsoft Copilot for Service Playbooks'],
        honestProfileFraming: 'Frame as "BPO Agent Enablement & AI-Assisted CX Operations".',
      },
    ],
  },
  {
    vertical: 'Education, EdTech, K-12, Higher Ed & Corporate Training',
    weights: [0.16, 0.14, 0.08, 0.16, 0.38, 0.08],
    domainKeywords: /training|enablement|education|edtech|curriculum|instructional|learning|lms|coaching|onboarding|workshop|course|instructor/i,
    structuralBarrierPenalty: 5,
    barrierExplanation: 'Corporate Training & EdTech SaaS have zero licensing barriers (high transferability); public K-12 classroom teaching requires state teacher certification.',
    roleArchetypes: ['Director of Technical Enablement & Learning Architecture', 'Enterprise Instructional Systems & Readiness Lead', 'EdTech Curriculum & Knowledge Program Manager'],
    payBand: '$95k – $138k /yr',
    translations: [
      ['Support Agent Coaching & Onboarding', 'Competency-Based Learning Architecture & Bootcamp Design', 'Enablement & Knowledge Transfer'],
      ['Internal Wiki / KB Maintenance', 'Enterprise LMS & Knowledge Graph Governance', 'Systems & Architecture'],
      ['Quality Scorecards', 'Learner Competency & Time-to-Productivity Telemetry', 'Process & SLA Rigor'],
    ],
    bridgeSkills: [
      {
        skill: 'Instructional Design (ADDIE / SAM) & LMS Governance',
        recommendedLevel: 'Expert',
        fitLiftPoints: 16,
        rationale: 'Validates hands-on training creation for executive L&D and EdTech roles.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Formal Framework Alignment (1–2 Weeks)',
        estimatedTimeToBridge: '8–12 Hours',
        actionableSteps: ['Map the technical training programs and onboarding bootcamps you built into formal ADDIE and SAM instructional design terminology.'],
        recommendedCredentialsOrResources: ['ATD Instructional Design Foundations'],
        honestProfileFraming: 'Safe to add immediately if you have built corporate training curricula and onboarding programs.',
      },
      {
        skill: 'Time-to-Productivity & Enablement OKRs',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 12,
        rationale: 'Links training programs directly to measurable business outcomes.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Direct OKR Certification Synergy (Immediate)',
        estimatedTimeToBridge: '3–4 Hours',
        actionableSteps: ['Combine your Certified OKR Coach credential with learner ramp-time and certification pass-rate metrics.'],
        recommendedCredentialsOrResources: ['WhatMatters OKR Certification & Kirkpatrick Evaluation'],
        honestProfileFraming: 'Frame as "Enablement OKR Design & Time-to-Productivity Telemetry".',
      },
      {
        skill: 'K-12 / Higher-Ed State Teaching Licensure (Public Schools Only)',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 8,
        rationale: 'Only required if targeting public K-12 classroom teaching rather than Corporate Enablement or EdTech.',
        modality: 'industry_exposure_required',
        modalityLabel: '🏥 State Licensure Required (Public K-12 Only)',
        estimatedTimeToBridge: '6–18 Months (Not Required for EdTech/Corporate L&D)',
        actionableSteps: ['Target Corporate Enablement, EdTech SaaS, or Enterprise Training roles where state K-12 teaching licenses are NOT required.'],
        recommendedCredentialsOrResources: ['ATD Corporate Enablement Track'],
        honestProfileFraming: 'Focus profile on Corporate Technical Enablement & EdTech Program Management.',
      },
    ],
  },
  {
    vertical: 'Cybersecurity & Cloud Infrastructure',
    weights: [0.30, 0.24, 0.22, 0.10, 0.08, 0.06],
    domainKeywords: /cyber|security|infosec|cloud|aws|azure|iam|zero-trust|soc2|nist|iso|siem|soc|firewall|encryption|vulnerability|comptia/i,
    structuralBarrierPenalty: 12,
    barrierExplanation: 'Moderate technical gate: SecOps/GRC Program Management is bridgeable via SC-900/Security+/ISC2-CC, whereas hands-on Penetration Testing requires deep lab tenure.',
    roleArchetypes: ['Security Operations (SecOps) Program Lead', 'Cloud Governance, Risk & Compliance (GRC) Manager', 'Identity & Access Governance Specialist'],
    payBand: '$120k – $170k /yr',
    translations: [
      ['Tier-3 Incident Escalation', 'SOC Incident Triage & Threat Containment', 'Escalation & Crisis Triage'],
      ['Access Control & Account Provisioning', 'Zero-Trust IAM & Identity Governance', 'Systems & Architecture'],
      ['Audit & Policy Adherence', 'SOC2 / ISO27001 / NIST Compliance Rigor', 'Process & SLA Rigor'],
    ],
    bridgeSkills: [
      {
        skill: 'IAM & Zero-Trust Access Governance',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 14,
        rationale: 'Extends M365 and platform access administration into enterprise security architecture.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Technical Equivalence + Security Lab (1–2 Weeks)',
        estimatedTimeToBridge: '12–16 Hours',
        actionableSteps: ['Connect your Microsoft 365 / Entra ID / Supabase RLS experience to formal Zero-Trust IAM terminology (RBAC, Least Privilege, MFA).'],
        recommendedCredentialsOrResources: ['Microsoft Certified: Security, Compliance, and Identity Fundamentals (SC-900)', 'Okta / Microsoft Entra ID Zero-Trust Access Architecture Labs'],
        honestProfileFraming: 'Frame as "Identity & Access Governance (RBAC / MFA / Zero-Trust Controls)".',
      },
      {
        skill: 'NIST / SOC2 Compliance Frameworks',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 13,
        rationale: 'Formalizes operational SOP auditing into regulatory security controls.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Fast-Track GRC Certification (2–3 Weeks)',
        estimatedTimeToBridge: '15–20 Hours',
        actionableSteps: ['Study the 5 SOC2 Trust Services Criteria and NIST CSF 2.0 functions and map them to your existing operational audit logs.'],
        recommendedCredentialsOrResources: ['ISC2 Certified in Cybersecurity (CC) — Free Training & Exam Initiative', 'NIST Cybersecurity Framework (CSF 2.0) Official Quick-Start Guide'],
        honestProfileFraming: 'Add once you complete ISC2 CC or SC-900 and can map SOPs to SOC2/NIST controls.',
      },
      {
        skill: 'Hands-On SIEM / Offensive Penetration Testing',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 10,
        rationale: 'Required only for technical SOC analyst / red-team engineering roles (not required for GRC or SecOps Program Management).',
        modality: 'industry_exposure_required',
        modalityLabel: '🏥 Deep Technical Lab / SecOps Tenure Required',
        estimatedTimeToBridge: '6–12 Months (Or Target GRC / SecOps Program Roles First)',
        actionableSteps: ['Do not claim offensive security or SIEM engineering from a short course; target Security Program Management, IAM Governance, or GRC roles first.'],
        recommendedCredentialsOrResources: ['CompTIA Security+ (SY0-701) Official Certification'],
        honestProfileFraming: 'Focus on "Security Program Governance, IAM & Compliance Readiness".',
      },
    ],
  },
  {
    vertical: 'E-Commerce, Retail & Consumer Goods (CPG)',
    weights: [0.18, 0.16, 0.12, 0.18, 0.10, 0.26],
    domainKeywords: /e-commerce|ecommerce|retail|ebay|amazon|marketplace|sourcing|arbitrage|inventory|merchandising|sku|cpg|catalog|fulfillment|pricing/i,
    structuralBarrierPenalty: 4,
    barrierExplanation: 'Low licensing barrier; directly rewards hands-on marketplace operations, SKU unit economics, and automated inventory tracking.',
    roleArchetypes: ['E-Commerce Marketplace & Merchandising Operations Lead', 'Digital Catalog & Pricing Arbitrage Manager', 'Omnichannel Fulfillment & Vendor Program Manager'],
    payBand: '$95k – $142k /yr',
    translations: [
      ['Marketplace Reselling & Sourcing', 'Assortment Strategy & Margin Yield Management', 'Commercial & Throughput Velocity'],
      ['Automated Stock Monitoring', 'Programmatic Pricing & Inventory Intelligence', 'Systems & Architecture'],
      ['Customer Dispute Handling', 'Marketplace Trust, Post-Purchase CX & Chargeback Defense', 'Process & SLA Rigor'],
    ],
    bridgeSkills: [
      {
        skill: 'Marketplace Channel Management (eBay / Amazon / D2C)',
        recommendedLevel: 'Expert',
        fitLiftPoints: 16,
        rationale: 'Directly monetizes hands-on listing, sourcing, and conversion expertise.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Direct Hands-On Experience (Immediate)',
        estimatedTimeToBridge: '2–4 Hours (Portfolio Framing)',
        actionableSteps: ['Translate your active e-commerce reselling & retail arbitrage operation into enterprise marketplace KPIs (sell-through rate, GMROI, defect-free fulfillment).'],
        recommendedCredentialsOrResources: ['eBay Seller Academy & Marketplace Analytics'],
        honestProfileFraming: 'Safe to add immediately if you actively run marketplace sourcing and fulfillment.',
      },
      {
        skill: 'Inventory Turnover & GMV Unit Economics',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 12,
        rationale: 'Formalizes high-margin product selection into CPG merchandising metrics.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Merchandising Metric Translation (1 Week)',
        estimatedTimeToBridge: '5–8 Hours',
        actionableSteps: ['Structure your product acquisition and holding-period ROI tracking into formal GMV, COGS, and inventory turn ratios.'],
        recommendedCredentialsOrResources: ['Corporate Finance Institute (CFI): Unit Economics & Margin Analysis'],
        honestProfileFraming: 'Frame as "SKU Margin Analysis, Sourcing & Inventory Velocity Management".',
      },
      {
        skill: 'Programmatic Catalog & Inventory Feed Automation',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 10,
        rationale: 'Combines Python scripting skills with large-scale SKU monitoring.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Technical Scripting Bridge (1–2 Weeks)',
        estimatedTimeToBridge: '8–10 Hours',
        actionableSteps: ['Use your Python inventory-tracking scripts to demonstrate automated stock monitoring and price-drop alerting.'],
        recommendedCredentialsOrResources: ['Automate the Boring Stuff with Python'],
        honestProfileFraming: 'Frame as "Programmatic Inventory Monitoring & Catalog Operations".',
      },
    ],
  },
  {
    vertical: 'Wholesale Trade, Supply Chain, Logistics & Distribution',
    weights: [0.16, 0.24, 0.18, 0.22, 0.06, 0.14],
    domainKeywords: /wholesale|supply chain|logistics|distribution|warehouse|inventory|procurement|vendor|3pl|freight|fulfillment|morsco|erp|wms/i,
    structuralBarrierPenalty: 8,
    barrierExplanation: 'Low-to-moderate barrier for Supply Chain Systems, Vendor Ops, and Inventory Planning; physical warehouse floor management requires onsite 3PL/WMS tenure.',
    roleArchetypes: ['Supply Chain Systems & Inventory Operations Lead', 'Vendor Procurement & Fulfillment Program Manager', 'Distribution Logistics & Exception Triage Manager'],
    payBand: '$98k – $140k /yr',
    translations: [
      ['Inventory Tracking & Retail Arbitrage', 'Demand Forecasting & SKU Velocity Optimization', 'Commercial & Throughput Velocity'],
      ['Ticket Queue Prioritization', 'Fulfillment Exception & Bottleneck Triage', 'Escalation & Crisis Triage'],
      ['Vendor Coordination', 'Supplier Lead-Time & 3PL SLA Orchestration', 'Resource & Vendor Orchestration'],
    ],
    bridgeSkills: [
      {
        skill: 'Supplier & 3PL SLA Governance',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 14,
        rationale: 'Applies vendor management mechanics to physical distribution networks.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Vendor SLA Translation (1–2 Weeks)',
        estimatedTimeToBridge: '8–12 Hours',
        actionableSteps: ['Translate service-level vendor governance (fill rate, OTIF — On-Time In-Full, lead-time variance) from your IT/BPO and wholesale distribution experience.'],
        recommendedCredentialsOrResources: ['ASCM (APICS) Supply Chain Procurement Certificate'],
        honestProfileFraming: 'Frame as "Supplier SLA Governance & Fulfillment Exception Management".',
      },
      {
        skill: 'ERP / WMS Inventory Telemetry',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 12,
        rationale: 'Bridges technical database comfort into supply chain tracking systems.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Systems & ERP Bridge Course (2 Weeks)',
        estimatedTimeToBridge: '12–16 Hours',
        actionableSteps: ['Connect your automated inventory monitoring scripts and wholesale service-desk background (e.g., MORSCO) with modern ERP/WMS inventory ledger concepts.'],
        recommendedCredentialsOrResources: ['ASCM Supply Chain Technology & ERP Foundations'],
        honestProfileFraming: 'Frame as "Inventory Telemetry Automation & Enterprise Distribution Systems Support".',
      },
      {
        skill: 'Physical Warehouse Floor & DOT Freight Routing',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 9,
        rationale: 'Required only for onsite warehouse general managers or DOT freight dispatchers.',
        modality: 'industry_exposure_required',
        modalityLabel: '🏥 Direct Onsite Warehouse / Freight Tenure Required',
        estimatedTimeToBridge: '6–12 Months Onsite (Target Corporate Supply Chain Systems / Vendor Ops First)',
        actionableSteps: ['Do not apply for onsite forklift/warehouse floor superintendent roles without physical 3PL tenure; target Supply Chain Systems, Vendor Program, or E-Commerce Fulfillment Ops instead.'],
        recommendedCredentialsOrResources: ['ASCM Supply Chain Warehousing Certificate'],
        honestProfileFraming: 'Focus on "Supply Chain Systems, Vendor SLA & Inventory Operations".',
      },
    ],
  },
  {
    vertical: 'Telecommunications, Hardware & Networking',
    weights: [0.28, 0.20, 0.22, 0.14, 0.10, 0.06],
    domainKeywords: /telecom|hardware|network|wireless|broadband|cisco|comptia|infrastructure|noc|dispatch|field service|radioshack|router|switch/i,
    structuralBarrierPenalty: 8,
    barrierExplanation: 'Low barrier for Telecom/Hardware Program Management, NOC Escalation, and Technical Training; RF electrical engineering requires an ABET engineering degree.',
    roleArchetypes: ['Telecom Infrastructure & Vendor Program Lead', 'NOC Escalation & Service Delivery Manager', 'Hardware & Network Field Enablement Lead'],
    payBand: '$102k – $148k /yr',
    translations: [
      ['Infrastructure & Vendor Operations', 'Carrier / Field Services Vendor SLA Orchestration', 'Resource & Vendor Orchestration'],
      ['Tier-3 Incident Escalation', 'NOC Outage Triage & Mean-Time-To-Repair (MTTR) Governance', 'Escalation & Crisis Triage'],
      ['Technical Training & CompTIA A+', 'Hardware / Endpoint Deployment & Field Readiness', 'Enablement & Knowledge Transfer'],
    ],
    bridgeSkills: [
      {
        skill: 'NOC Incident Governance & Carrier SLA Management',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 14,
        rationale: 'Connects enterprise escalation and infrastructure ops to telecom carrier environments.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Direct Infrastructure Reframing (1 Week)',
        estimatedTimeToBridge: '6–8 Hours',
        actionableSteps: ['Highlight your CompTIA A+ hardware foundation, Citi infrastructure vendor lead work, and high-severity outage triage.'],
        recommendedCredentialsOrResources: ['CompTIA Network+ / Telecom Infrastructure Overview'],
        honestProfileFraming: 'Frame as "Infrastructure Vendor Operations & High-Severity Outage Triage".',
      },
      {
        skill: 'Cloud Networking & SD-WAN Fundamentals',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 11,
        rationale: 'Bridges desktop/cloud support into modern enterprise networking.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Fast-Track Networking Cert (2–3 Weeks)',
        estimatedTimeToBridge: '15–20 Hours',
        actionableSteps: ['Review TCP/IP, DNS, VPN, and SD-WAN concepts to speak fluently with network engineering teams.'],
        recommendedCredentialsOrResources: ['CompTIA Network+ Official Learning Path'],
        honestProfileFraming: 'Frame as "Enterprise Network Support & Infrastructure Program Coordination".',
      },
      {
        skill: 'RF / Layer-1 Physical Fiber Splicing & Hardware Design',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 8,
        rationale: 'Required only for physical cell-tower climbing or electrical PCB engineering.',
        modality: 'industry_exposure_required',
        modalityLabel: '🏥 Physical Field / Electrical Engineering License Required',
        estimatedTimeToBridge: '1–4 Years (Target Telecom Program / NOC / Enablement Roles Instead)',
        actionableSteps: ['Skip physical tower/RF hardware engineering roles; target Telecom Vendor Program Management, NOC Leadership, or Retail/Field Enablement.'],
        recommendedCredentialsOrResources: ['CompTIA Official Certifications'],
        honestProfileFraming: 'Focus on "Infrastructure Operations, Vendor Governance & Technical Enablement".',
      },
    ],
  },
  {
    vertical: 'Finance, Banking, FinTech & Insurance',
    weights: [0.18, 0.28, 0.16, 0.16, 0.10, 0.12],
    domainKeywords: /finance|bank|citi|fintech|insurance|kyc|aml|stripe|payment|risk|compliance|audit|fraud|underwriting|capital/i,
    structuralBarrierPenalty: 12,
    barrierExplanation: 'FinTech Operations, Vendor Risk (TPRM), and IT/Support Leadership are highly accessible (especially with prior Citi/banking ops); licensed wealth advising or actuarial science requires FINRA Series 7/66 or actuarial exams.',
    roleArchetypes: ['FinTech Operations & Fraud Triage Lead', 'Enterprise Vendor & Operational Risk Manager', 'Payment Systems & Compliance Program Manager'],
    payBand: '$115k – $165k /yr',
    translations: [
      ['Identity & Account Verification', 'KYC / KYB & Anti-Fraud Operations', 'Process & SLA Rigor'],
      ['Vendor Infrastructure Operations (Citi)', 'Third-Party Risk Management (TPRM) & Resilience', 'Resource & Vendor Orchestration'],
      ['System Outage Escalations', 'High-Availability Transaction Incident Governance', 'Escalation & Crisis Triage'],
    ],
    bridgeSkills: [
      {
        skill: 'Third-Party Risk Management (TPRM)',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 15,
        rationale: 'Maps banking vendor program leadership (e.g., Citi) directly to regulated financial standards.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Regulatory Framework Bridge (1–2 Weeks)',
        estimatedTimeToBridge: '10–14 Hours',
        actionableSteps: ['Connect your Citi Vendor Program & Infrastructure Operations experience directly to OCC Third-Party Risk Management lifecycle terminology.'],
        recommendedCredentialsOrResources: ['OCC Bulletin 2023-17: Third-Party Relationships Risk Management'],
        honestProfileFraming: 'Frame as "Financial Vendor Program Governance & Operational Risk Controls".',
      },
      {
        skill: 'KYC / KYB & Payment Fraud Operations',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 13,
        rationale: 'Connects Stripe Identity biometric verification & escrow logic to FinTech compliance.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 FinTech Compliance Micro-Credential (1–2 Weeks)',
        estimatedTimeToBridge: '10–12 Hours',
        actionableSteps: ['Combine your hands-on Stripe Identity verification & payment escrow architecture with formal KYC/AML compliance terminology.'],
        recommendedCredentialsOrResources: ['ACAMS AML / KYC Foundations Certificate', 'Stripe Identity & Radar Fraud Prevention Architecture Docs'],
        honestProfileFraming: 'Frame as "Identity Verification (KYC/KYB) & Payment Operations Governance".',
      },
      {
        skill: 'FINRA Series 7/66 or Actuarial Underwriting License',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 9,
        rationale: 'Required only for regulated securities brokerage or insurance underwriting roles.',
        modality: 'industry_exposure_required',
        modalityLabel: '🏥 Federal/State Financial License Required',
        estimatedTimeToBridge: '6–12 Months Firm Sponsorship (Target FinTech Ops / Banking Vendor Program Roles Instead)',
        actionableSteps: ['Do not apply for licensed broker/underwriter seats without FINRA/state licenses; target FinTech Operations, Vendor Risk, or Technical Enablement.'],
        recommendedCredentialsOrResources: ['ISACA Risk & Information Systems Control (CRISC)'],
        honestProfileFraming: 'Focus on "Banking Infrastructure Operations, Vendor Governance & FinTech Enablement".',
      },
    ],
  },
  {
    vertical: 'Defense, Aerospace & Government Contracting',
    weights: [0.24, 0.30, 0.18, 0.16, 0.08, 0.04],
    domainKeywords: /defense|aerospace|govcon|government contracting|dod|federal|nist|cmmc|fedramp|clearance|military|subcontractor|itil/i,
    structuralBarrierPenalty: 16,
    barrierExplanation: 'Unclassified GovCon IT/Training/Compliance roles are bridgeable via NIST 800-171/ITIL; however, roles requiring an active DoD Secret / TS-SCI Security Clearance cannot be self-studied without employer sponsorship.',
    roleArchetypes: ['GovCon Technical Program & Compliance Manager', 'Mission Support & Infrastructure Operations Lead', 'Defense Readiness & Technical Training Specialist'],
    payBand: '$118k – $168k /yr',
    translations: [
      ['SOP & Security Compliance', 'NIST 800-171 / CMMC / FedRAMP Operational Controls', 'Process & SLA Rigor'],
      ['Vendor & Infrastructure Lead', 'Subcontractor & Mission Systems Sustainment', 'Resource & Vendor Orchestration'],
      ['Technical Training & Docs', 'Integrated Logistics Support (ILS) & Operator Readiness', 'Enablement & Knowledge Transfer'],
    ],
    bridgeSkills: [
      {
        skill: 'FedRAMP / NIST 800-171 / CMMC Compliance',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 14,
        rationale: 'Translates enterprise IT governance into federal contracting requirements.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Federal Compliance Training Bridge (2–3 Weeks)',
        estimatedTimeToBridge: '12–18 Hours',
        actionableSteps: ['Complete the free DoD CDSE CUI & NIST 800-171 training modules to understand federal contractor security controls.'],
        recommendedCredentialsOrResources: ['CDSE CUI & NIST 800-171 Free Courses (cdse.edu)', 'FedRAMP Program Basics Official Training'],
        honestProfileFraming: 'Add once you complete CDSE/FedRAMP training modules.',
      },
      {
        skill: 'ITIL v4 & Earned Value Management (EVM) Basics',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 11,
        rationale: 'Aligns enterprise service desk and program planning with federal contract milestones.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 GovCon Program & ITIL Bridge (2 Weeks)',
        estimatedTimeToBridge: '12 Hours',
        actionableSteps: ['Map your OKR and program milestone tracking to federal Contract Data Requirements Lists (CDRLs) and ITIL v4.'],
        recommendedCredentialsOrResources: ['DAU (Defense Acquisition University) EVM Overview', 'ITIL® 4 Foundation Certification'],
        honestProfileFraming: 'Frame as "ITSM Service Delivery & Program Deliverable Governance".',
      },
      {
        skill: 'Active DoD Security Clearance (Secret / TS-SCI)',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 14,
        rationale: 'Hard gate on classified defense contracts; cannot be purchased or self-studied.',
        modality: 'industry_exposure_required',
        modalityLabel: '🏥 Federal Sponsorship Required (Cannot Self-Study)',
        estimatedTimeToBridge: '3–9 Months Federal Investigation (Apply to Public-Trust / Unclassified GovCon SaaS First)',
        actionableSteps: ['REALITY CHECK: You cannot buy or self-study a Security Clearance. Filter for "Public Trust Eligible" or commercial FedRAMP SaaS vendors who sponsor clearances after hire.'],
        recommendedCredentialsOrResources: ['CDSE Security Clearance & Public Trust Orientation'],
        honestProfileFraming: 'State "US Citizen — Eligible for Federal Public Trust / Clearance Sponsorship" (never claim an active clearance unless adjudicated).',
      },
    ],
  },
  {
    vertical: 'Media, Marketing, Advertising, Gaming & Entertainment',
    weights: [0.20, 0.12, 0.10, 0.18, 0.22, 0.18],
    domainKeywords: /media|marketing|advertising|gaming|game|godot|video|ffmpeg|voiceover|content|production|social|brand|campaign|entertainment/i,
    structuralBarrierPenalty: 6,
    barrierExplanation: 'Low licensing barrier; strongly favors candidates with working media production pipelines (FFmpeg/audio/video), game engine scripting (Godot), or content program planning.',
    roleArchetypes: ['Content & Media Production Program Manager', 'Technical Marketing & Video Pipeline Producer', 'Live-Ops & Gaming Community Enablement Lead'],
    payBand: '$92k – $145k /yr',
    translations: [
      ['Senior Content & Knowledge Planner', 'Multi-Channel Content Operations & Editorial Governance', 'Enablement & Knowledge Transfer'],
      ['FFmpeg / Voiceover Video Mastering', 'Programmatic Ad-Tech & Multimodal Media Pipeline Production', 'Systems & Architecture'],
      ['Godot 4 / Multiplayer Scripting', 'Interactive Gameplay Systems & Live-Ops Prototyping', 'Systems & Architecture'],
    ],
    bridgeSkills: [
      {
        skill: 'Programmatic Video, Audio & Ad-Asset Production',
        recommendedLevel: 'Expert',
        fitLiftPoints: 15,
        rationale: 'Directly leverages your FFmpeg, voiceover mastering, and multi-format promotional pipeline work.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Direct Hands-On Portfolio Match (Immediate)',
        estimatedTimeToBridge: 'Immediate (Portfolio Documentation)',
        actionableSteps: ['Showcase your multi-aspect-ratio (16:9 / 9:16) programmatic video, captioning, and audio normalization workflows.'],
        recommendedCredentialsOrResources: ['Google Skillshop Video & Digital Media Certification'],
        honestProfileFraming: 'Safe to add immediately based on your commercial video & voiceover mastering pipeline.',
      },
      {
        skill: 'Performance Marketing Attribution & Funnel Analytics',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 11,
        rationale: 'Connects content production to customer acquisition cost (CAC) and conversion.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Fast-Track Analytics Cert (1–2 Weeks)',
        estimatedTimeToBridge: '8–10 Hours',
        actionableSteps: ['Complete Google Analytics 4 (GA4) and conversion funnel attribution modules.'],
        recommendedCredentialsOrResources: ['Google Analytics 4 (GA4) Official Skillshop Certification'],
        honestProfileFraming: 'Frame as "Content Program Planning & Conversion Funnel Production".',
      },
      {
        skill: 'Game Engine & Interactive Systems Scripting (Godot / Unity)',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 9,
        rationale: 'Applies directly to gaming studio production or technical producer roles.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Hands-On Engine Prototype Bridge (2–3 Weeks)',
        estimatedTimeToBridge: '15 Hours',
        actionableSteps: ['Package your Godot 4 2D physics, controller input mapping, and multiplayer state-sync prototypes as a playable technical producer portfolio.'],
        recommendedCredentialsOrResources: ['Godot Engine Official Documentation & Multiplayer Networking Guide'],
        honestProfileFraming: 'Frame as "Technical Producer / Godot 4 Multiplayer & Physics Prototyping".',
      },
    ],
  },
  {
    vertical: 'Government & Public Administration (Federal, State & Local)',
    weights: [0.16, 0.30, 0.16, 0.20, 0.14, 0.04],
    domainKeywords: /government|federal|state|municipal|public administration|accessibility|wcag|section 508|compliance|policy|grant|civic|agency/i,
    structuralBarrierPenalty: 10,
    barrierExplanation: 'Low licensing barrier for IT/Program/Accessibility roles, though civil service hiring uses strict KSA (Knowledge, Skills, and Abilities) point matrices and Section 508 accessibility standards.',
    roleArchetypes: ['Public Sector IT & Digital Services Program Manager', 'Digital Accessibility (Section 508 / WCAG) & Knowledge Lead', 'Municipal Vendor & Service Desk Operations Manager'],
    payBand: '$88k – $135k /yr',
    translations: [
      ['Microsoft Accessibility in Action', 'Section 508 & WCAG 2.1 AA Public Digital Compliance', 'Process & SLA Rigor'],
      ['Enterprise Content & OKR Planning', 'Agency Modernization & Citizen Service Delivery', 'Enablement & Knowledge Transfer'],
      ['Vendor Program Management', 'Public Procurement & Municipal Contractor Oversight', 'Resource & Vendor Orchestration'],
    ],
    bridgeSkills: [
      {
        skill: 'Section 508 & WCAG Digital Accessibility Compliance',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 15,
        rationale: 'Public agencies mandate strict accessibility compliance across all citizen-facing portals and training.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Direct Certification Synergy (1 Week)',
        estimatedTimeToBridge: '6–8 Hours',
        actionableSteps: ['Pair your existing Microsoft Accessibility in Action certification with federal Section 508 Trusted Tester fundamentals.'],
        recommendedCredentialsOrResources: ['W3C WAI WCAG 2.1 Official Standards Guide'],
        honestProfileFraming: 'Safe to highlight immediately via your Microsoft Accessibility in Action credential.',
      },
      {
        skill: 'Public Sector Procurement & RFP/SLA Governance',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 11,
        rationale: 'Translates corporate vendor management into state/local government contract administration.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Public Procurement Terminology Bridge (1–2 Weeks)',
        estimatedTimeToBridge: '10 Hours',
        actionableSteps: ['Learn how state/municipal agencies structure RFPs, vendor SLAs, and public audit trails.'],
        recommendedCredentialsOrResources: ['DAU / Public Procurement Fundamentals'],
        honestProfileFraming: 'Frame as "Vendor Program Governance, SLA Compliance & Accessibility Readiness".',
      },
      {
        skill: 'Federal/State Civil Service Classification Tenure',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 8,
        rationale: 'Some GS-13/14 internal agency roles require prior competitive-service status.',
        modality: 'industry_exposure_required',
        modalityLabel: '🏥 Prior Civil Service Tenure (For Internal GS Tracks Only)',
        estimatedTimeToBridge: 'Apply via "Open to the Public" or State/Local IT Modernization Tracks',
        actionableSteps: ['Filter for "Open to the Public" federal postings, municipal IT leadership, or GovTech vendors serving state/local agencies.'],
        recommendedCredentialsOrResources: ['FEMA / Federal Digital Service Readiness Guides'],
        honestProfileFraming: 'Target Open-to-Public IT Modernization & Accessibility Program roles.',
      },
    ],
  },
  {
    vertical: 'Legal, HR, Staffing, Recruiting & Management Consulting',
    weights: [0.14, 0.22, 0.12, 0.22, 0.20, 0.10],
    domainKeywords: /legal|hr|human resources|staffing|recruiting|talent|consulting|okr|onboarding|enablement|compliance|employment|shrm/i,
    structuralBarrierPenalty: 14,
    barrierExplanation: 'Management Consulting, OKR Coaching, and Talent/Recruiting Tech Operations are highly accessible; practicing law requires a J.D. + State Bar admission, and senior HR Compliance requires SHRM-CP/PHR tenure.',
    roleArchetypes: ['Management Consultant — AI & Operational Transformation', 'Talent Operations & Recruiting Platform Program Lead', 'Learning, Enablement & OKR Advisory Lead'],
    payBand: '$100k – $155k /yr',
    translations: [
      ['Certified OKR Coach & Program Planner', 'Executive Strategy Alignment & Organizational Transformation', 'Resource & Vendor Orchestration'],
      ['SpecialSauce Talent Architecture', 'Skills-Based Hiring, ATS Workflow & Verification Operations', 'Systems & Architecture'],
      ['Technical Training & Enablement', 'Workforce Readiness & Change Management Consulting', 'Enablement & Knowledge Transfer'],
    ],
    bridgeSkills: [
      {
        skill: 'OKR Strategy & Organizational Change Management',
        recommendedLevel: 'Expert',
        fitLiftPoints: 15,
        rationale: 'Directly monetizes your Certified OKR Coach credential and enterprise planning background.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Direct Credential Synergy (Immediate)',
        estimatedTimeToBridge: 'Immediate',
        actionableSteps: ['Position your Certified OKR Coach credential and Microsoft/Anthropic enablement tenure as client-facing transformation consulting.'],
        recommendedCredentialsOrResources: ['WhatMatters OKR Coaching & Transformation Framework'],
        honestProfileFraming: 'Safe to add immediately based on your Certified OKR Coach credential.',
      },
      {
        skill: 'HRIS / ATS Workflow & Talent Operations (Greenhouse / Workday)',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 12,
        rationale: 'Connects your talent platform engineering to enterprise People Operations.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Platform Equivalence Bridge (1–2 Weeks)',
        estimatedTimeToBridge: '8–12 Hours',
        actionableSteps: ['Map your Greenhouse HMAC-SHA256 webhook integration and structured skills-matching architecture to Talent Operations terminology.'],
        recommendedCredentialsOrResources: ['SHRM Talent Acquisition & HR Technology Resources'],
        honestProfileFraming: 'Frame as "Talent Systems Architecture, ATS Integration & Skills-Based Hiring Ops".',
      },
      {
        skill: 'Multi-State Employment Law / State Bar Licensure',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 12,
        rationale: 'Hard gate for practicing attorneys (J.D./Bar) or dedicated Employee Relations legal counsel.',
        modality: 'industry_exposure_required',
        modalityLabel: '🏥 Law Degree / SHRM-CP Tenure Required',
        estimatedTimeToBridge: '1–3 Years (Target Management Consulting, Enablement, or Talent Ops Instead)',
        actionableSteps: ['REALITY CHECK: Do not apply for Legal Counsel or ER Employment Law Specialist roles without a law degree or SHRM-CP/PHR tenure. Target Management Consulting, OKR Advisory, or Talent Tech Operations instead.'],
        recommendedCredentialsOrResources: ['SHRM Official Certification Portal'],
        honestProfileFraming: 'Focus on "Management Consulting, OKR Enablement & Talent Systems Operations".',
      },
    ],
  },
  {
    vertical: 'Non-Profit, Philanthropy & Civic Organizations',
    weights: [0.14, 0.18, 0.12, 0.24, 0.22, 0.10],
    domainKeywords: /non-profit|nonprofit|philanthropy|foundation|grant|civic|community|program|outreach|education|accessibility|volunteer/i,
    structuralBarrierPenalty: 6,
    barrierExplanation: 'Low licensing barrier; high operational transferability for Program Directors, Digital Enablement Leads, and Operations Managers, though major-gift fundraising roles require prior donor-relations tenure.',
    roleArchetypes: ['Director of Programs & Operational Enablement', 'Non-Profit Technology & Digital Transformation Lead', 'Workforce Readiness & Community Training Manager'],
    payBand: '$82k – $125k /yr',
    translations: [
      ['Content & Knowledge Program Planner', 'Mission Program Design & Impact Telemetry', 'Resource & Vendor Orchestration'],
      ['Technical Training & Enablement', 'Community Workforce Enablement & Digital Literacy', 'Enablement & Knowledge Transfer'],
      ['OKR & KPI Tracking', 'Grant Outcome Reporting & Board Accountability', 'Process & SLA Rigor'],
    ],
    bridgeSkills: [
      {
        skill: 'Grant Outcome Telemetry & Program Impact OKRs',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 14,
        rationale: 'Translates corporate OKRs into foundation grant reporting and impact measurement.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 OKR-to-Impact Metric Translation (1 Week)',
        estimatedTimeToBridge: '6–8 Hours',
        actionableSteps: ['Map your OKR coaching and KPI reporting experience to Logic Models (Inputs, Outputs, Short/Long-Term Outcomes) used by foundations.'],
        recommendedCredentialsOrResources: ['WhatMatters OKR Framework for Non-Profits'],
        honestProfileFraming: 'Frame as "Program Impact Measurement, OKRs & Stakeholder Reporting".',
      },
      {
        skill: 'Non-Profit CRM & Digital Operations',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 11,
        rationale: 'Connects SaaS/database administration to non-profit constituent systems.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 CRM Sandbox Bridge (1–2 Weeks)',
        estimatedTimeToBridge: '8–10 Hours',
        actionableSteps: ['Review Salesforce Nonprofit Cloud or HubSpot CRM constituent tracking workflows.'],
        recommendedCredentialsOrResources: ['Coursera Non-Profit Management & Digital Operations'],
        honestProfileFraming: 'Frame as "Digital Systems, Accessibility & Program Operations".',
      },
      {
        skill: 'Major Gifts & Capital Campaign Fundraising',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 9,
        rationale: 'Required only for Chief Development Officer / Major Gift Officer roles.',
        modality: 'industry_exposure_required',
        modalityLabel: '🏥 Direct Donor Portfolio Tenure Required',
        estimatedTimeToBridge: '1–3 Years (Target Program Operations, IT, or Training Director Roles Instead)',
        actionableSteps: ['Skip fundraising/development officer postings; target Program Operations, Digital Transformation, or Training & Enablement leadership.'],
        recommendedCredentialsOrResources: ['Coursera Non-Profit Governance Catalog'],
        honestProfileFraming: 'Focus on "Program Operations, Digital Enablement & Impact Governance".',
      },
    ],
  },
  {
    vertical: 'Healthcare, Biotech, Pharma & Life Sciences',
    weights: [0.18, 0.30, 0.18, 0.16, 0.12, 0.06],
    domainKeywords: /health|medical|biotech|pharma|clinical|hospital|hipaa|hitrust|ehr|hl7|fhir|patient|revcycle|nursing|fda|gxp/i,
    structuralBarrierPenalty: 20,
    barrierExplanation: 'Split sector: HealthTech SaaS, Clinical IT Enablement, and Vendor Ops are bridgeable via HIPAA + HL7/FHIR study; direct patient care (RN/MD) and clinical wet-lab roles have strict state medical licensing barriers.',
    roleArchetypes: ['HealthTech Implementation & Clinical Enablement Lead', 'Healthcare IT Operations & Vendor Program Manager', 'Patient Access & Support Systems Program Manager'],
    payBand: '$105k – $150k /yr',
    translations: [
      ['PII Privacy & Security Controls', 'HIPAA / HITRUST Data Privacy & Audit Governance', 'Process & SLA Rigor'],
      ['Enterprise Software Rollout', 'EHR / HealthTech Clinical Workflow Enablement', 'Enablement & Knowledge Transfer'],
      ['Priority Incident Triage', 'Mission-Critical Clinical Support Escalation', 'Escalation & Crisis Triage'],
    ],
    bridgeSkills: [
      {
        skill: 'HIPAA / Healthcare Data Privacy Compliance',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 14,
        rationale: 'Unlocks non-clinical HealthTech operations and IT roles using your existing security discipline.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Fast-Track Certification Bridge (1–2 Weeks)',
        estimatedTimeToBridge: '8–12 Hours',
        actionableSteps: ['Complete an accredited HIPAA Privacy & Security compliance training module covering PHI handling, BAAs, and breach triage.'],
        recommendedCredentialsOrResources: ['HHS.gov Official HIPAA for Professionals Training Modules (Free)', 'HITRUST CSF Foundations Self-Paced Course'],
        honestProfileFraming: 'Once completed, add "HIPAA Privacy & Security Rule Compliance (Trained)" alongside your PII governance experience.',
      },
      {
        skill: 'EHR / Digital Health Workflow Interoperability (HL7 / FHIR)',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 11,
        rationale: 'Translates enterprise SaaS onboarding into HealthTech software deployment.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Domain Equivalence + Interoperability Study (2–3 Weeks)',
        estimatedTimeToBridge: '15–25 Hours',
        actionableSteps: ['Study HL7 FHIR API interoperability fundamentals and how HealthTech SaaS tools integrate with clinical workflows without claiming bedside charting.'],
        recommendedCredentialsOrResources: ['HL7® FHIR® Fundamentals Orientation', 'HealthIT.gov Clinical Workflow Playbooks'],
        honestProfileFraming: 'Frame honestly as "Enterprise SaaS Rollout & HealthTech Workflow Enablement".',
      },
      {
        skill: 'Clinical Licensure (RN/MD) or Hospital RevCycle Coding',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 14,
        rationale: 'Hard barrier for clinical care, bedside nursing, or certified medical coding (ICD-10/CPT) roles.',
        modality: 'industry_exposure_required',
        modalityLabel: '🏥 Clinical License / Direct Hospital Tenure Required',
        estimatedTimeToBridge: '1–4 Years (Target Non-Clinical HealthTech SaaS / Vendor Ops Instead)',
        actionableSteps: ['REALITY CHECK: Short-term courses will NOT qualify you for clinical nursing, biotech lab benchwork, or senior hospital RevCycle coding. Target non-clinical HealthTech SaaS Enablement, IT Support Leadership, or Vendor Operations first.'],
        recommendedCredentialsOrResources: ['HFMA Certified Revenue Cycle Representative (CRCR) Overview', 'CMS.gov Medicare Learning Network (MLN)'],
        honestProfileFraming: 'Keep profile focused on "HealthTech SaaS Enablement, Vendor SLA & IT Support Operations".',
      },
    ],
  },
  {
    vertical: 'Other / Multi-Industry',
    weights: [0.20, 0.20, 0.16, 0.20, 0.14, 0.10],
    domainKeywords: /operations|program|project|vendor|training|enablement|support|strategy|okr|cross-functional|management/i,
    structuralBarrierPenalty: 4,
    barrierExplanation: 'Generalist cross-functional operations and program management roles with high portability across conglomerates and holding companies.',
    roleArchetypes: ['Cross-Functional Program & Operations Lead', 'Enterprise Vendor & Enablement Manager', 'Chief of Staff / Strategic Operations Planner'],
    payBand: '$95k – $145k /yr',
    translations: [
      ['Program & Vendor Lead', 'Cross-Portfolio Operations & SLA Governance', 'Resource & Vendor Orchestration'],
      ['OKR & Content Planning', 'Executive Operating Rhythm & Knowledge Architecture', 'Process & SLA Rigor'],
      ['Technical Enablement', 'Enterprise Change Management & Tooling Adoption', 'Enablement & Knowledge Transfer'],
    ],
    bridgeSkills: [
      {
        skill: 'Cross-Functional Program & OKR Governance',
        recommendedLevel: 'Expert',
        fitLiftPoints: 15,
        rationale: 'Unifies multi-department initiatives under measurable quarterly objectives.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Direct OKR & Program Synergy (Immediate)',
        estimatedTimeToBridge: 'Immediate',
        actionableSteps: ['Highlight your Certified OKR Coach credential and multi-company program planning track record.'],
        recommendedCredentialsOrResources: ['WhatMatters OKR Certification'],
        honestProfileFraming: 'Safe to add immediately.',
      },
      {
        skill: 'Executive KPI Dashboards & Financial Acumen',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 11,
        rationale: 'Connects operational throughput to P&L budget accountability.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Business Case Reframing (1 Week)',
        estimatedTimeToBridge: '6–8 Hours',
        actionableSteps: ['Document cost-savings, vendor budget efficiency, and headcount utilization metrics across your prior roles.'],
        recommendedCredentialsOrResources: ['Corporate Finance Institute (CFI): Operational Economics'],
        honestProfileFraming: 'Frame as "Operational KPI Telemetry & Vendor Budget Governance".',
      },
    ],
  },
  {
    vertical: 'Arts, Design, Photography & Creative Studios',
    weights: [0.16, 0.10, 0.08, 0.18, 0.28, 0.20],
    domainKeywords: /design|ui|ux|figma|creative|art|photography|video|animation|3d|cgi|studio|brand|visual|accessibility/i,
    structuralBarrierPenalty: 18,
    barrierExplanation: 'Creative Producer, Studio Operations, and Accessibility roles transfer well; Principal Product Designer (UI/UX) or Fine Art Director roles require a multi-year visual design/Figma portfolio that cannot be faked with a quick certificate.',
    roleArchetypes: ['Creative Operations & Studio Production Manager', 'Digital Media & CGI/Video Pipeline Producer', 'Accessibility (WCAG) & Design Systems Coordinator'],
    payBand: '$85k – $135k /yr',
    translations: [
      ['Programmatic Video & CGI Character Prompts', 'Creative Asset Pipeline & Multimodal Production Management', 'Systems & Architecture'],
      ['Microsoft Accessibility in Action', 'Inclusive Design & WCAG 2.1 AA Compliance Auditing', 'Process & SLA Rigor'],
      ['Content Program Planning', 'Creative Studio Traffic, Deadlines & Vendor Orchestration', 'Resource & Vendor Orchestration'],
    ],
    bridgeSkills: [
      {
        skill: 'WCAG 2.1 AA Accessible Design Governance',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 13,
        rationale: 'Design studios and product teams increasingly need accessibility compliance leads.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Direct Accessibility Credential Synergy (1 Week)',
        estimatedTimeToBridge: '6 Hours',
        actionableSteps: ['Leverage your Microsoft Accessibility in Action certification to audit UI contrast, keyboard navigation, and screen-reader flows.'],
        recommendedCredentialsOrResources: ['W3C WAI WCAG 2.1 Official Standards Guide'],
        honestProfileFraming: 'Frame as "Digital Accessibility (WCAG 2.1 AA) & Creative Production Governance".',
      },
      {
        skill: 'Figma & Design Systems Operations (DesignOps)',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 10,
        rationale: 'Allows a technical program manager to coordinate design-to-engineering handoffs.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 DesignOps Tooling Lab (2 Weeks)',
        estimatedTimeToBridge: '12–15 Hours',
        actionableSteps: ['Learn Figma component library organization and developer handoff inspection for DesignOps program management.'],
        recommendedCredentialsOrResources: ['Figma Learn Official Design Systems Guide'],
        honestProfileFraming: 'Frame as "DesignOps Program Coordination & Dev Handoff Workflows" (do not claim Principal Visual Designer tenure).',
      },
      {
        skill: 'Senior UI/UX Visual Portfolio & Brand Art Direction',
        recommendedLevel: 'Expert',
        fitLiftPoints: 15,
        rationale: 'Hard gate for Principal Product Designer or Art Director roles.',
        modality: 'industry_exposure_required',
        modalityLabel: '🏥 Multi-Year Visual Design Portfolio Required',
        estimatedTimeToBridge: '1–3 Years Portfolio Building (Target Creative Ops / Producer Roles Instead)',
        actionableSteps: ['REALITY CHECK: Employers hiring Principal UI/UX Designers judge 90% on a multi-year visual case-study portfolio. Target Creative Operations, Video/Media Production Management, or DesignOps instead.'],
        recommendedCredentialsOrResources: ['Figma Learn Official Design Systems Guide'],
        honestProfileFraming: 'Target Creative Producer, Media Pipeline, or DesignOps Program roles.',
      },
    ],
  },
  {
    vertical: 'Manufacturing, Industrial & Production',
    weights: [0.18, 0.28, 0.20, 0.20, 0.08, 0.06],
    domainKeywords: /manufacturing|industrial|production|factory|plant|lean|six sigma|iso|quality|supply chain|osha|automation|erp/i,
    structuralBarrierPenalty: 22,
    barrierExplanation: 'Corporate Manufacturing IT, ERP Support, Vendor Procurement, and Safety/SOP Training are accessible; Plant Floor Superintendent or Industrial PLC Robotics Engineering require physical plant tenure or mechanical engineering degrees.',
    roleArchetypes: ['Manufacturing IT & ERP Systems Support Lead', 'Industrial Supplier & Procurement Program Manager', 'Operational Quality (ISO / Lean) & SOP Training Lead'],
    payBand: '$92k – $138k /yr',
    translations: [
      ['Process & SLA Rigor', 'Lean Six Sigma / ISO-9001 Standard Work & Quality Governance', 'Process & SLA Rigor'],
      ['Service Desk & Wholesale Support (MORSCO)', 'Plant IT / ERP Infrastructure & Uptime Support', 'Systems & Architecture'],
      ['Technical Training & SOPs', 'Operator Standard Work Instructions & Safety Enablement', 'Enablement & Knowledge Transfer'],
    ],
    bridgeSkills: [
      {
        skill: 'Lean Six Sigma (Yellow/Green Belt) & Continuous Improvement',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 13,
        rationale: 'Translates IT process optimization into manufacturing quality language.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Fast-Track Six Sigma Cert (2–3 Weeks)',
        estimatedTimeToBridge: '15–20 Hours',
        actionableSteps: ['Complete a Lean Six Sigma Yellow or Green Belt course to translate your defect-reduction and SLA rigor into DMAIC terminology.'],
        recommendedCredentialsOrResources: ['ASCM / Coursera Lean Six Sigma Foundations'],
        honestProfileFraming: 'Frame as "Process Optimization, Root-Cause Triage & SOP Standardization".',
      },
      {
        skill: 'Physical Plant Floor Management & PLC/CNC Engineering',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 16,
        rationale: 'Hard gate for onsite factory floor directors and industrial automation engineers.',
        modality: 'industry_exposure_required',
        modalityLabel: '🏥 Physical Factory / Mechanical Engineering Tenure Required',
        estimatedTimeToBridge: '2–5 Years Onsite Plant Floor (Target Manufacturing IT, Vendor Ops, or Training Instead)',
        actionableSteps: ['REALITY CHECK: Do not apply for onsite Plant Manager or CNC/PLC Engineer roles without factory floor tenure. Target Manufacturing IT Support, Vendor Program Management, or Corporate Training inside industrial companies.'],
        recommendedCredentialsOrResources: ['OSHA.gov Industrial Safety & Operations Overview'],
        honestProfileFraming: 'Target IT Infrastructure, Vendor Operations, or Training leadership within manufacturing firms.',
      },
    ],
  },
  {
    vertical: 'Energy, Oil & Gas, Utilities & CleanTech',
    weights: [0.20, 0.28, 0.22, 0.18, 0.08, 0.04],
    domainKeywords: /energy|oil|gas|utility|utilities|cleantech|solar|wind|grid|ercot|nerc|scada|safety|field|infrastructure/i,
    structuralBarrierPenalty: 24,
    barrierExplanation: 'Corporate IT, Grid Customer Operations, Vendor Management, and Technical Training transfer well; Petroleum Engineering, NERC System Operator, and High-Voltage Lineman roles require strict federal certifications or engineering degrees.',
    roleArchetypes: ['Energy / CleanTech IT & Vendor Program Manager', 'Utility Customer Operations & Billing Escalation Lead', 'Energy Infrastructure Readiness & Training Specialist'],
    payBand: '$105k – $155k /yr',
    translations: [
      ['Infrastructure & Vendor Operations', 'Utility Contractor & Grid IT Vendor Governance', 'Resource & Vendor Orchestration'],
      ['High-Severity Incident Triage', 'Outage Communications & Critical Infrastructure Escalation', 'Escalation & Crisis Triage'],
      ['Technical Training & Enablement', 'Field Technician Digital Tooling & Safety Onboarding', 'Enablement & Knowledge Transfer'],
    ],
    bridgeSkills: [
      {
        skill: 'NERC CIP Critical Infrastructure Cybersecurity & Compliance',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 13,
        rationale: 'Connects IT security and SOP governance to utility grid compliance.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Grid Compliance Orientation (2 Weeks)',
        estimatedTimeToBridge: '10–14 Hours',
        actionableSteps: ['Study NERC CIP (Critical Infrastructure Protection) fundamentals for utility IT and vendor governance roles.'],
        recommendedCredentialsOrResources: ['NIST Cybersecurity Framework for Critical Infrastructure'],
        honestProfileFraming: 'Frame as "Critical Infrastructure IT Support & Vendor Compliance Governance".',
      },
      {
        skill: 'Petroleum Engineering / NERC Certified Grid Operator License',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 16,
        rationale: 'Hard regulatory and engineering gate for control-room dispatch and reservoir engineering.',
        modality: 'industry_exposure_required',
        modalityLabel: '🏥 Engineering Degree or Federal NERC License Required',
        estimatedTimeToBridge: '2–4 Years (Target Corporate Energy IT, Customer Ops, or Vendor Management Instead)',
        actionableSteps: ['REALITY CHECK: Field engineering and grid control-room roles require specialized degrees or NERC certification exams. Target Corporate IT, Customer Operations, or Vendor Program Management inside energy/CleanTech firms.'],
        recommendedCredentialsOrResources: ['Coursera Renewable Energy & CleanTech Business Operations'],
        honestProfileFraming: 'Focus on "Enterprise IT, Vendor Program & Customer Operations" within Energy/CleanTech.',
      },
    ],
  },
  {
    vertical: 'Accounting, Tax, Audit & Advisory',
    weights: [0.16, 0.36, 0.10, 0.16, 0.10, 0.12],
    domainKeywords: /accounting|accountant|cpa|tax|audit|bookkeeping|quickbooks|gaap|sox|ledger|financial reporting|advisory|payroll/i,
    structuralBarrierPenalty: 28,
    barrierExplanation: 'IT Audit (ISACA/SOX), Advisory Consulting, and QuickBooks Operational Bookkeeping are accessible; Public Accounting (CPA), Tax Signing Authority (EA/CPA), and Financial Statement Auditing require formal accounting credit hours and state CPA licensure.',
    roleArchetypes: ['IT Audit & SOX Operational Controls Manager', 'Management & Technology Advisory Consultant', 'Business Operations & Financial Systems Specialist'],
    payBand: '$95k – $150k /yr',
    translations: [
      ['Process & SLA Audit Rigor', 'SOX IT General Controls (ITGC) & Internal Audit Readiness', 'Process & SLA Rigor'],
      ['QuickBooks & E-Commerce Accounting', 'Operational Bookkeeping, Margin Ledger & AP/AR Reconciliation', 'Commercial & Throughput Velocity'],
      ['OKR & Program Advisory', 'Client Operational Advisory & Transformation Consulting', 'Enablement & Knowledge Transfer'],
    ],
    bridgeSkills: [
      {
        skill: 'IT General Controls (ITGC) & SOX Compliance Auditing',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 13,
        rationale: 'Allows IT and operations leaders to work inside accounting/advisory firms auditing software controls.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 IT Audit Certification Bridge (2–4 Weeks)',
        estimatedTimeToBridge: '15–20 Hours',
        actionableSteps: ['Map your access control, change management, and incident logging experience to SOX IT General Controls (ITGC).'],
        recommendedCredentialsOrResources: ['ISACA Risk & Information Systems Control (CRISC) / CISA Overview'],
        honestProfileFraming: 'Frame as "IT General Controls (ITGC), Access Governance & Operational Audit Readiness".',
      },
      {
        skill: 'Licensed Certified Public Accountant (CPA) / GAAP Tax Authority',
        recommendedLevel: 'Expert',
        fitLiftPoints: 18,
        rationale: 'Mandatory statutory license for signing audits, public tax returns, and Controller roles.',
        modality: 'industry_exposure_required',
        modalityLabel: '🏥 State CPA License + 150 Accounting Credit Hours Required',
        estimatedTimeToBridge: '2–4 Years University + State Board Exam (Cannot Self-Study Quickly)',
        actionableSteps: ['REALITY CHECK: You cannot qualify for CPA, Senior Tax Accountant, or Financial Audit Manager roles via short online courses. Only target Advisory Consulting, IT Audit (ITGC), or Internal Operations roles at accounting firms.'],
        recommendedCredentialsOrResources: ['AICPA Official CPA Licensure Requirements'],
        honestProfileFraming: 'Never claim GAAP Accounting or Tax Prep without credentials; focus on "Technology Advisory, IT Controls & Operational Consulting".',
      },
    ],
  },
  {
    vertical: 'Fitness, Wellness, Sports & Personal Care Services',
    weights: [0.10, 0.16, 0.14, 0.24, 0.18, 0.18],
    domainKeywords: /fitness|wellness|gym|sports|athletic|personal trainer|nasm|salon|spa|studio|club|membership|mindbody/i,
    structuralBarrierPenalty: 26,
    barrierExplanation: 'Multi-unit franchise operations/IT/enablement has moderate overlap, but hands-on studio directing, personal training, physical therapy, or cosmetology requires NASM/ACE certifications, state licenses, and multi-club brick-and-mortar P&L tenure.',
    roleArchetypes: ['Multi-Unit Franchise Operations & Enablement Manager', 'Wellness Brand Digital & Customer Operations Lead', 'Fitness Tech / SaaS Implementation Specialist'],
    payBand: '$72k – $118k /yr',
    translations: [
      ['Retail / Store Support Management (RadioShack)', 'Multi-Unit Studio Operations & Member Experience Standards', 'Resource & Vendor Orchestration'],
      ['Training & Coach Enablement', 'Staff Onboarding & Service Consistency Playbooks', 'Enablement & Knowledge Transfer'],
      ['Subscription & Retention Logic', 'Recurring Membership Churn Deflection & CRM Operations', 'Commercial & Throughput Velocity'],
    ],
    bridgeSkills: [
      {
        skill: 'Club CRM / POS Platforms (Mindbody / ClubReady) & Membership Metrics',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 11,
        rationale: 'Translates SaaS subscription metrics into brick-and-mortar membership retention.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Subscription Metric Translation (1–2 Weeks)',
        estimatedTimeToBridge: '8–10 Hours',
        actionableSteps: ['Map your subscription churn, onboarding, and retail management experience to studio EFT (Electronic Funds Transfer) membership metrics.'],
        recommendedCredentialsOrResources: ['Coursera Franchise & Multi-Unit Retail Operations'],
        honestProfileFraming: 'Frame as "Multi-Unit Retail/Service Operations, Staff Training & Subscription Retention".',
      },
      {
        skill: 'Multi-Studio Fitness P&L Tenure & NASM/State Licensure',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 17,
        rationale: 'Required by fitness chains for Regional Studio Directors, Trainers, and Licensed Estheticians/Therapists.',
        modality: 'industry_exposure_required',
        modalityLabel: '🏥 Brick-and-Mortar Fitness Tenure / State License Required',
        estimatedTimeToBridge: '1–3 Years Onsite Studio Management or Licensing',
        actionableSteps: ['REALITY CHECK: Regional Fitness Director roles usually require prior onsite gym P&L management and trainer recruiting tenure. Unless you are targeting corporate IT/Enablement at a wellness brand, expect a steep industry-tenure barrier.'],
        recommendedCredentialsOrResources: ['NASM Official Certification Portal'],
        honestProfileFraming: 'Target corporate Operations, IT, or Training roles at wellness brands rather than onsite clinical/trainer roles.',
      },
    ],
  },
  {
    vertical: 'Hospitality, Food Service, Restaurants & Travel',
    weights: [0.10, 0.20, 0.22, 0.24, 0.12, 0.12],
    domainKeywords: /hospitality|hotel|resort|restaurant|food service|culinary|travel|tourism|guest|pos|toast|servsafe|catering/i,
    structuralBarrierPenalty: 28,
    barrierExplanation: 'Corporate Hospitality IT, POS Rollout, and Guest Support Center leadership transfer well; onsite Hotel General Manager, Executive Chef, or Restaurant Multi-Unit Director roles require years of physical food-and-beverage / RevPAR floor tenure.',
    roleArchetypes: ['Hospitality Tech / POS Implementation & Support Lead', 'Guest Experience (CX) & Contact Center Operations Manager', 'Multi-Unit Training & Franchise Enablement Lead'],
    payBand: '$75k – $125k /yr',
    translations: [
      ['Enterprise Support & Escalation Lead', 'VIP Guest Recovery & Central Reservations CX Operations', 'Escalation & Crisis Triage'],
      ['Retail & Technical Training', 'Multi-Location Franchise Onboarding & POS Rollout Enablement', 'Enablement & Knowledge Transfer'],
      ['Vendor & Inventory Operations', 'Food & Beverage Supplier SLA & Cost-of-Goods Tracking', 'Resource & Vendor Orchestration'],
    ],
    bridgeSkills: [
      {
        skill: 'Hospitality POS / Property Management Systems (Toast / Opera)',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 10,
        rationale: 'Connects IT support and rollout skills to restaurant/hotel technology stacks.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Hospitality Tech Equivalency (1–2 Weeks)',
        estimatedTimeToBridge: '8–10 Hours',
        actionableSteps: ['Position your enterprise software rollout and retail support experience for Restaurant/Hotel Tech SaaS vendors.'],
        recommendedCredentialsOrResources: ['ServSafe & Hospitality Operations Overview'],
        honestProfileFraming: 'Frame as "Enterprise POS / SaaS Rollout, Franchise Training & Support Operations".',
      },
      {
        skill: 'Onsite Food & Beverage (F&B) Floor Management & Culinary Tenure',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 18,
        rationale: 'Mandatory for onsite Restaurant GMs, Culinary Directors, and Hotel Operations Directors.',
        modality: 'industry_exposure_required',
        modalityLabel: '🏥 Years of Physical F&B / Hotel Floor Tenure Required',
        estimatedTimeToBridge: '2–5 Years Onsite Hospitality Tenure (Cannot Bridge Online)',
        actionableSteps: ['REALITY CHECK: Online courses will NOT qualify an office/tech professional to run a commercial kitchen or hotel property. Only target Corporate IT, Guest Support Center, or Hospitality SaaS roles in this vertical.'],
        recommendedCredentialsOrResources: ['ServSafe Official Food & Alcohol Safety Certification'],
        honestProfileFraming: 'Target Hospitality SaaS, Corporate IT, or Central Guest Operations only.',
      },
    ],
  },
  {
    vertical: 'Real Estate, Construction, Facilities & Skilled Trades',
    weights: [0.12, 0.24, 0.18, 0.26, 0.08, 0.12],
    domainKeywords: /real estate|construction|property|facilities|skilled trade|hvac|plumbing|electrical|carpentry|osha|general contractor|procore|lease/i,
    structuralBarrierPenalty: 34,
    barrierExplanation: 'Hard licensure and apprenticeship wall: Master Electrician, HVAC, Plumbing, Commercial Superintendent, and Real Estate Brokerage require state licenses or 4-year physical apprenticeships. Only PropTech SaaS, Facilities Vendor Coordination, or Corporate Operations transfer directly.',
    roleArchetypes: ['Facilities Vendor Program & SLA Coordinator', 'PropTech / Construction SaaS Implementation Lead', 'Real Estate Operations & Asset Systems Coordinator'],
    payBand: '$80k – $130k /yr',
    translations: [
      ['Vendor Infrastructure Lead (Citi)', 'Facilities Maintenance Vendor & Contractor SLA Governance', 'Resource & Vendor Orchestration'],
      ['SaaS & Database Operations', 'PropTech / Construction Management Software (Procore) Enablement', 'Systems & Architecture'],
      ['Process & Compliance Rigor', 'Work-Order Triage, Lease Compliance & Safety Documentation', 'Process & SLA Rigor'],
    ],
    bridgeSkills: [
      {
        skill: 'OSHA 10/30 Safety & Construction Software (Procore) Literacy',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 10,
        rationale: 'Helps vendor/program managers coordinate with facilities and construction teams.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 OSHA & PropTech Orientation (1–2 Weeks)',
        estimatedTimeToBridge: '10–15 Hours',
        actionableSteps: ['If targeting Facilities Vendor Management or PropTech SaaS, review CMMS work-order systems and OSHA general safety standards.'],
        recommendedCredentialsOrResources: ['OSHA.gov Official Outreach Training'],
        honestProfileFraming: 'Frame as "Facilities Vendor SLA Coordination & Work-Order Systems Governance".',
      },
      {
        skill: 'State Trade License (HVAC/Electrical/Plumbing) or Commercial GC Tenure',
        recommendedLevel: 'Expert',
        fitLiftPoints: 22,
        rationale: 'Strict statutory requirement for skilled trades, field superintendents, and licensed brokers.',
        modality: 'industry_exposure_required',
        modalityLabel: '🛑 Hard Barrier: Multi-Year Apprenticeship / State License Required',
        estimatedTimeToBridge: '2–5 Years Apprenticeship / State Exam (Not Self-Study Bridgeable)',
        actionableSteps: ['REALITY CHECK: You cannot bridge into Skilled Trades, Commercial Construction Superintendent, or Licensed Real Estate Broker roles through software/ops transferability alone. Only pursue PropTech SaaS or Corporate Vendor Operations in this sector.'],
        recommendedCredentialsOrResources: ['OSHA.gov Training & Trade Apprenticeship Directories'],
        honestProfileFraming: 'Do not apply for licensed trade/superintendent roles without state credentials.',
      },
    ],
  },
  {
    vertical: 'Automotive, Aviation, Marine & Transportation',
    weights: [0.16, 0.28, 0.24, 0.20, 0.08, 0.04],
    domainKeywords: /automotive|aviation|airline|aircraft|faa|pilot|a&p|marine|transportation|trucking|cdl|dot|fleet|dispatch/i,
    structuralBarrierPenalty: 36,
    barrierExplanation: 'Severe regulatory wall: Commercial Pilots (FAA ATP), Aircraft Mechanics (FAA A&P), Commercial Drivers (CDL-A), and Marine Officers require federal physical certifications and thousands of logged hours. Only Fleet Telematics SaaS, Dispatch Systems Support, or Corporate Training transfer without federal licenses.',
    roleArchetypes: ['Fleet Telematics & Transportation Systems Program Lead', 'Aviation / Logistics IT Support & Vendor Manager', 'Safety & Technical Training Documentation Lead'],
    payBand: '$85k – $138k /yr',
    translations: [
      ['Incident & Escalation Triage', 'NOC / Fleet Operations Center Exception Triage', 'Escalation & Crisis Triage'],
      ['Technical Training & Manuals', 'FAA / DOT Operator Readiness & Maintenance Documentation', 'Enablement & Knowledge Transfer'],
      ['Vendor & Infrastructure Ops', 'Fleet Technology & Third-Party Carrier SLA Governance', 'Resource & Vendor Orchestration'],
    ],
    bridgeSkills: [
      {
        skill: 'DOT / FAA Regulatory Documentation & Telematics Systems',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 9,
        rationale: 'Supports corporate IT, training, and telematics software roles in transportation.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Transportation Tech Terminology Study (2 Weeks)',
        estimatedTimeToBridge: '10–12 Hours',
        actionableSteps: ['Study how ELD (Electronic Logging Devices), fleet telematics SaaS, and FAA/DOT compliance documentation operate.'],
        recommendedCredentialsOrResources: ['FAA.gov Training & Aviation Maintenance Documentation Guides'],
        honestProfileFraming: 'Frame as "Transportation IT Systems, Telematics Support & Technical Documentation".',
      },
      {
        skill: 'FAA Pilot / A&P Mechanic Certificate or Class-A CDL License',
        recommendedLevel: 'Expert',
        fitLiftPoints: 24,
        rationale: 'Mandatory federal licensing for operating or repairing aircraft, commercial trucks, or marine vessels.',
        modality: 'industry_exposure_required',
        modalityLabel: '🛑 Hard Federal License Barrier (FAA / DOT / USCG)',
        estimatedTimeToBridge: '6 Months – 4 Years Federal Licensing School',
        actionableSteps: ['REALITY CHECK: No online software course can qualify you for FAA Aviation Maintenance, Pilot, or CDL transportation roles. Only target corporate IT, Telematics SaaS, or Training Program roles in this sector.'],
        recommendedCredentialsOrResources: ['FAA.gov Official Licensing & Training Portal'],
        honestProfileFraming: 'Never apply to licensed FAA/DOT operating roles without active federal certificates.',
      },
    ],
  },
  {
    vertical: 'Architecture, Civil Engineering & Environmental Services',
    weights: [0.22, 0.32, 0.12, 0.18, 0.10, 0.06],
    domainKeywords: /architecture|architect|civil engineer|structural|pe license|autocad|revit|bim|environmental|surveying|geotechnical|nepa/i,
    structuralBarrierPenalty: 42,
    barrierExplanation: 'Hard statutory barrier: Civil/Structural Engineers and Architects require ABET/NAAB accredited university degrees plus multi-year state Professional Engineer (PE) or Registered Architect (RA) licensure. Non-degreed transfer is strictly limited to corporate IT, BIM software support, or project administration.',
    roleArchetypes: ['AEC Technology & BIM/IT Support Program Manager', 'Engineering Firm Operations & Vendor Coordinator', 'Technical Documentation & Proposal Enablement Lead'],
    payBand: '$90k – $142k /yr',
    translations: [
      ['Enterprise IT & Systems Support', 'AEC Firm IT Infrastructure & Cloud Collaboration Support', 'Systems & Architecture'],
      ['Content & Proposal Planning', 'Engineering RFP / Deliverable Documentation Governance', 'Enablement & Knowledge Transfer'],
      ['Vendor & SLA Coordination', 'Subconsultant & Field Vendor Schedule Tracking', 'Resource & Vendor Orchestration'],
    ],
    bridgeSkills: [
      {
        skill: 'AEC Project Coordination & CAD/BIM IT Support',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 8,
        rationale: 'Allows IT and program managers to support engineering firm operations.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 AEC IT & Project Admin Orientation (2 Weeks)',
        estimatedTimeToBridge: '10 Hours',
        actionableSteps: ['Understand how Autodesk Construction Cloud / Revit servers and subconsultant deliverables are managed in AEC firms.'],
        recommendedCredentialsOrResources: ['Coursera Construction & Engineering Project Management'],
        honestProfileFraming: 'Frame strictly as "IT Infrastructure & Project Operations Support for AEC Teams".',
      },
      {
        skill: 'Professional Engineer (PE) / Registered Architect (RA) State Stamp',
        recommendedLevel: 'Expert',
        fitLiftPoints: 28,
        rationale: 'Statutory requirement for designing, stamping, or approving civil, structural, or architectural plans.',
        modality: 'industry_exposure_required',
        modalityLabel: '🛑 Hard Statutory Barrier: 4–6 Yr Accredited Degree + PE/RA Exam',
        estimatedTimeToBridge: '4–8 Years University + State Licensure (Full Career Rebuild)',
        actionableSteps: ['REALITY CHECK: You cannot bridge into Civil Engineering, Architecture, or Environmental Science practitioner roles without an accredited degree and state PE/RA license. Only corporate IT/Operations roles inside AEC firms are accessible.'],
        recommendedCredentialsOrResources: ['edX Civil Engineering & Architecture University Catalog'],
        honestProfileFraming: 'Do not pursue technical engineering/architecture practitioner roles without PE/RA credentials.',
      },
    ],
  },
  {
    vertical: 'Agriculture, Forestry, Conservation & Outdoor',
    weights: [0.12, 0.22, 0.18, 0.24, 0.10, 0.14],
    domainKeywords: /agriculture|agritech|farm|ranch|forestry|conservation|wildlife|horticulture|agronomy|usda|environmental|landscaping|veterinary/i,
    structuralBarrierPenalty: 38,
    barrierExplanation: 'High physical/scientific barrier: Agronomy, Forestry, Veterinary Medicine, and Commercial Ranch/Farm Management require specialized biological degrees or years of field/equipment tenure. Corporate transfer is limited to AgTech SaaS, Supply Chain Procurement, or Equipment Dealer IT/Support.',
    roleArchetypes: ['AgTech SaaS & Precision Agriculture Support Lead', 'Agricultural Supply Chain & Vendor Operations Manager', 'Conservation / Outdoor Brand E-Commerce & Ops Lead'],
    payBand: '$75k – $122k /yr',
    translations: [
      ['Wholesale & Inventory Operations', 'Agricultural Input Supply Chain & Dealer Network Operations', 'Resource & Vendor Orchestration'],
      ['IoT / SaaS Technical Support', 'Precision AgTech Telemetry & Dealer Enablement', 'Systems & Architecture'],
      ['E-Commerce & Merchandising', 'Direct-to-Consumer Outdoor & Ag Equipment Merchandising', 'Commercial & Throughput Velocity'],
    ],
    bridgeSkills: [
      {
        skill: 'AgTech Telemetry & Agricultural Supply Chain Operations',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 9,
        rationale: 'Connects SaaS/wholesale operations to AgTech software and equipment distribution.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 AgTech & Dealer Network Orientation (2 Weeks)',
        estimatedTimeToBridge: '8–10 Hours',
        actionableSteps: ['Target software, dealer support, or supply chain roles at AgTech and outdoor equipment companies.'],
        recommendedCredentialsOrResources: ['USDA Farmers.gov & AgTech Innovation Resources'],
        honestProfileFraming: 'Frame as "SaaS Enablement, Supply Chain & Dealer Support Operations".',
      },
      {
        skill: 'Agronomy / Forestry Science Degree or Commercial Farm Tenure',
        recommendedLevel: 'Expert',
        fitLiftPoints: 25,
        rationale: 'Required for field agronomists, foresters, veterinarians, and commercial farm managers.',
        modality: 'industry_exposure_required',
        modalityLabel: '🛑 Hard Barrier: Biological Science Degree or Field Tenure Required',
        estimatedTimeToBridge: '2–4 Years Field / University Study',
        actionableSteps: ['REALITY CHECK: Field agronomy, forestry, and veterinary roles require specialized biological degrees and field tenure. Stick to AgTech SaaS, Supply Chain, or Corporate Operations if exploring this vertical.'],
        recommendedCredentialsOrResources: ['Coursera Sustainable Agriculture & AgTech Catalog'],
        honestProfileFraming: 'Only target AgTech software, vendor operations, or e-commerce roles.',
      },
    ],
  },
  {
    vertical: 'Public Safety, Law Enforcement, Fire & Emergency Services',
    weights: [0.14, 0.28, 0.34, 0.14, 0.08, 0.02],
    domainKeywords: /public safety|law enforcement|police|firefighter|ems|paramedic|emergency|911|cad|dispatch|fema|cjis|physical security/i,
    structuralBarrierPenalty: 44,
    barrierExplanation: 'Strict statutory barrier: Sworn Law Enforcement, Fire, and EMS roles require Police/Fire Academy graduation, state POST certification, or Paramedic licensure. Non-sworn transfer is strictly limited to 911/CAD Public Safety IT Software, CJIS Compliance, or Emergency Management Training.',
    roleArchetypes: ['Public Safety Tech (911 CAD / RMS) Implementation Lead', 'CJIS Security & Municipal Public Safety IT Manager', 'Emergency Preparedness Training & Crisis Triage Coordinator'],
    payBand: '$82k – $132k /yr',
    translations: [
      ['Critical Incident Escalation Triage', '911 CAD / Emergency Communications Systems Triage', 'Escalation & Crisis Triage'],
      ['Security & Privacy Controls', 'FBI CJIS (Criminal Justice Information Services) Security Policy', 'Process & SLA Rigor'],
      ['Technical Training & Enablement', 'First-Responder Software (CAD/RMS) Rollout & Training', 'Enablement & Knowledge Transfer'],
    ],
    bridgeSkills: [
      {
        skill: 'FEMA NIMS / ICS-100/200 & CJIS Security Policy Orientation',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 10,
        rationale: 'Required for civilian IT, software implementation, and emergency preparedness roles serving public safety agencies.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Free FEMA & CJIS Orientation (1–2 Weeks)',
        estimatedTimeToBridge: '8–12 Hours',
        actionableSteps: ['Complete FEMA Independent Study IS-100/IS-200 (free online) and review FBI CJIS Security Policy requirements for GovTech/Public Safety SaaS roles.'],
        recommendedCredentialsOrResources: ['FEMA Emergency Management Institute Free IS Courses (training.fema.gov)'],
        honestProfileFraming: 'Frame as "Public Safety SaaS (CAD/RMS) Implementation & Crisis Triage Systems".',
      },
      {
        skill: 'State POST Peace Officer / Fire Academy / Paramedic License',
        recommendedLevel: 'Expert',
        fitLiftPoints: 28,
        rationale: 'Mandatory statutory certification for sworn police, fire, and EMS field personnel.',
        modality: 'industry_exposure_required',
        modalityLabel: '🛑 Hard Statutory Barrier: Police/Fire Academy or EMS License',
        estimatedTimeToBridge: '6–24 Months Full-Time Academy + Physical/Medical Qualification',
        actionableSteps: ['REALITY CHECK: You cannot transfer into sworn law enforcement, firefighting, or paramedic roles without completing a state academy or EMS clinical license. Only target civilian Public Safety SaaS (e.g., Axon, Motorola, Tyler Tech) or Municipal IT roles.'],
        recommendedCredentialsOrResources: ['FEMA Emergency Management Institute'],
        honestProfileFraming: 'Strictly target civilian Public Safety Technology, Training, or Municipal IT roles.',
      },
    ],
  },
]

function clampScore(val: number, min = 0, max = 98): number {
  return Math.max(min, Math.min(max, Math.round(val)))
}

function extractCandidateCorpus(profile: any): {
  corpus: string
  candSkillNames: string[]
  expYears: number
} {
  const rawSkills = Array.isArray(profile?.structured_skills)
    ? profile.structured_skills.filter(
        (s: any) =>
          s &&
          typeof s === 'object' &&
          !s._ss_candidate_prefs &&
          !s._ss_pref_meta &&
          (s.skill || s.name)
      )
    : []

  const candSkillNames = rawSkills.map((s: any) =>
    String(s.skill || s.name).toLowerCase().trim()
  )
  const skillText = rawSkills
    .map((s: any) => `${s.skill || s.name} (${s.level || 'Intermediate'}, ${s.years || 2}y)`)
    .join(' | ')
  const corpus = `${skillText} ${profile?.skills || ''} ${profile?.bio || ''} ${
    profile?.certifications || ''
  } ${profile?.education_level || ''}`.toLowerCase()

  const expYears = Math.max(1, Number(profile?.experience_years) || 5)
  return { corpus, candSkillNames, expYears }
}

function classifyLiveJobSkillBridge(
  skillName: string,
  requiredLevel: string,
  jobIndustry: string
): {
  isSelfStudyBridgeable: boolean
  modality: BridgeAcquisitionModality
  modalityLabel: string
  estimatedTimeToBridge: string
  howToBridgeSummary: string
  recommendedResource: string
} {
  const lower = skillName.toLowerCase()

  const stopWords = new Set([
    'and',
    'the',
    'for',
    'with',
    'operations',
    'management',
    'governance',
    'program',
    'systems',
    'lead',
    'specialist',
  ])
  const skillTokens = lower
    .split(/[\s,/&-]+/)
    .filter((t) => t.length >= 4 && !stopWords.has(t))

  for (const vert of VERTICAL_ARCHETYPE_MATRIX) {
    for (const bs of vert.bridgeSkills) {
      const bsLower = bs.skill.toLowerCase()
      const bsTokens = bsLower
        .split(/[\s,/&-]+/)
        .filter((t) => t.length >= 4 && !stopWords.has(t))
      const sharedSpecificTokens = skillTokens.filter((t) => bsTokens.includes(t))
      if (bsLower === lower || sharedSpecificTokens.length >= 2) {
        const isSelfStudy = bs.modality !== 'industry_exposure_required'
        return {
          isSelfStudyBridgeable: isSelfStudy,
          modality: bs.modality,
          modalityLabel: bs.modalityLabel,
          estimatedTimeToBridge: bs.estimatedTimeToBridge,
          howToBridgeSummary: bs.actionableSteps[0] || bs.rationale,
          recommendedResource:
            bs.recommendedCredentialsOrResources[0] ||
            'Accredited Industry Micro-Credential',
        }
      }
    }
  }

  if (
    /clinical|bedside|nursing|rn\b|md\b|surgical|cdl|licensed|bar exam|attorney|cpa\b|gaap|revcycle|medical coding|clearance|ts\/sci|post cert|firefighter|paramedic|pe license|civil engineer|hvac|plumbing|electrician|multi-club p&l|multi-studio|culinary|chef|hotel gm|pilot|faa a&p|agronom/i.test(
      lower
    )
  ) {
    return {
      isSelfStudyBridgeable: false,
      modality: 'industry_exposure_required',
      modalityLabel: '🛑 Requires Direct Industry Tenure or License (Not Self-Study Bridgeable)',
      estimatedTimeToBridge: '1–4 Years Field Tenure / Statutory Licensure',
      howToBridgeSummary: `REALITY CHECK: "${skillName}" requires verifiable ${jobIndustry.split(',')[0]} field tenure or state/federal licensing. Short-term online courses will NOT satisfy this requirement.`,
      recommendedResource: `Requires Prior ${jobIndustry.split(',')[0]} Tenure or Formal Licensure`,
    }
  }

  if (
    /hipaa|soc2|nist|iso|fedramp|cmmc|itil|pmp|scrum|agile|aws|azure|comptia|cert|compliance|gdpr|kyc|aml|wcag|section 508|six sigma|osha|fema/i.test(
      lower
    )
  ) {
    return {
      isSelfStudyBridgeable: true,
      modality: 'credential_fast_track',
      modalityLabel: '🎓 Fast-Track Certification Bridge (1–3 Weeks)',
      estimatedTimeToBridge: '10–18 Hours (Self-Paced Cert)',
      howToBridgeSummary: `Complete an accredited foundational certification in ${skillName} before adding it to your verified profile.`,
      recommendedResource: `Official ${skillName} Foundational Certification`,
    }
  }

  if (String(requiredLevel).toLowerCase() === 'expert') {
    return {
      isSelfStudyBridgeable: true,
      modality: 'sandbox_and_terminology',
      modalityLabel: '🔄 Sandbox Lab Reaches Intermediate Only (Role Asks for Expert)',
      estimatedTimeToBridge: '12–20 Hours (Partial Bridge)',
      howToBridgeSummary: `Map your adjacent operational experience to ${skillName} and build a hands-on workflow lab. Note: Self-study bridges to Beginner/Intermediate, while this role requests Expert tenure.`,
      recommendedResource: `Hands-On ${skillName} Workflow Lab & Documentation`,
    }
  }

  return {
    isSelfStudyBridgeable: true,
    modality: 'sandbox_and_terminology',
    modalityLabel: '🔄 Guided Sandbox Lab + Terminology Bridge (1–2 Weeks)',
    estimatedTimeToBridge: '8–14 Hours (Hands-On Practice)',
    howToBridgeSummary: `Map your existing operational experience to ${skillName} terminology and complete a hands-on sandbox project to validate ${requiredLevel} readiness.`,
    recommendedResource: `Hands-On ${skillName} Sandbox Project`,
  }
}

export function computeOperationalVector6D(profile: any): OperationalAxisScore[] {
  const { corpus, expYears } = extractCandidateCorpus(profile)
  const maturityBonus = Math.min(18, Math.round(expYears * 1.15))

  const countMatches = (patterns: RegExp[]): [number, string[]] => {
    let hits = 0
    const matchedLabels: string[] = []
    for (const pat of patterns) {
      const m = corpus.match(pat)
      if (m) {
        hits += 1
        matchedLabels.push(m[0])
      }
    }
    return [hits, Array.from(new Set(matchedLabels)).slice(0, 3)]
  }

  const [sysHits, sysWords] = countMatches([
    /python|typescript|javascript|sql|next\.?js|supabase|api|automation|script/i,
    /cloud|azure|aws|office 365|m365|infrastructure|network|hardware|comptia/i,
    /ai|llm|genai|generative ai|prompt|model|telemetry|architecture|system/i,
    /troubleshooting|diagnostics|configuration|deployment|integration|saas/i,
  ])
  const sysScore = clampScore(32 + sysHits * 12.5 + maturityBonus * 0.8, 18, 96)

  const [procHits, procWords] = countMatches([
    /sla|sop|quality|qa|audit|compliance|governance|policy|standard/i,
    /okr|kpi|metric|calibration|verification|security|privacy|accessibility/i,
    /process|workflow|documentation|knowledge|framework|itil|iso/i,
    /accuracy|consistency|risk|control|tier|escalation/i,
  ])
  const procScore = clampScore(34 + procHits * 12 + maturityBonus * 0.85, 18, 96)

  const [triageHits, triageWords] = countMatches([
    /escalation|triage|incident|crisis|root[- ]cause|outage|critical/i,
    /support|service desk|help desk|tier 2|tier 3|resolution|troubleshooting/i,
    /high[- ]volume|fast[- ]paced|turnaround|backlog|bottleneck|recovery/i,
    /customer|client|retention|de-escalation|specialist|lead/i,
  ])
  const triageScore = clampScore(30 + triageHits * 12.5 + maturityBonus * 0.85, 18, 96)

  const [orchHits, orchWords] = countMatches([
    /vendor|bpo|partner|supplier|contract|procurement|outsourc/i,
    /program manager|project|planner|operations lead|supervisor|manager|director/i,
    /cross[- ]functional|stakeholder|global|schedule|capacity|budget|headcount/i,
    /onboarding|rollout|launch|coordination|governance|okr/i,
  ])
  const orchScore = clampScore(31 + orchHits * 12.5 + maturityBonus * 0.9, 18, 96)

  const [enabHits, enabWords] = countMatches([
    /training|enablement|coach|curriculum|instruction|learning|workshop/i,
    /content|knowledge|playbook|documentation|guide|communication/i,
    /adoption|readiness|mentoring|presentation|executive|facilitat/i,
    /ai enablement|certif|educat|onboarding/i,
  ])
  const enabScore = clampScore(29 + enabHits * 13 + maturityBonus * 0.85, 18, 96)

  const [commHits, commWords] = countMatches([
    /e-commerce|ecommerce|retail|arbitrage|margin|revenue|sales|commercial/i,
    /pricing|conversion|growth|roi|cost|efficiency|throughput|productivity/i,
    /founder|saas|marketplace|sourcing|inventory|account|client/i,
    /\d+%|\$\d+|million|thousand|saved|accelerated|reduced/i,
  ])
  const commScore = clampScore(28 + commHits * 12.5 + maturityBonus * 0.75, 18, 96)

  return [
    {
      axis: 'Systems & Architecture',
      shortLabel: 'Systems & Tech',
      score: sysScore,
      evidence:
        sysWords.length > 0
          ? `Verified signals: ${sysWords.join(', ')}`
          : 'Core technical tooling & systems execution',
    },
    {
      axis: 'Process & SLA Rigor',
      shortLabel: 'Process & SLA',
      score: procScore,
      evidence:
        procWords.length > 0
          ? `Verified signals: ${procWords.join(', ')}`
          : 'Structured SOP, SLA & governance adherence',
    },
    {
      axis: 'Escalation & Crisis Triage',
      shortLabel: 'Crisis Triage',
      score: triageScore,
      evidence:
        triageWords.length > 0
          ? `Verified signals: ${triageWords.join(', ')}`
          : 'High-stakes issue resolution & diagnostics',
    },
    {
      axis: 'Resource & Vendor Orchestration',
      shortLabel: 'Orchestration',
      score: orchScore,
      evidence:
        orchWords.length > 0
          ? `Verified signals: ${orchWords.join(', ')}`
          : 'Program, vendor & cross-functional coordination',
    },
    {
      axis: 'Enablement & Knowledge Transfer',
      shortLabel: 'Enablement',
      score: enabScore,
      evidence:
        enabWords.length > 0
          ? `Verified signals: ${enabWords.join(', ')}`
          : 'Training, documentation & stakeholder alignment',
    },
    {
      axis: 'Commercial & Throughput Velocity',
      shortLabel: 'Commercial Velocity',
      score: commScore,
      evidence:
        commWords.length > 0
          ? `Verified signals: ${commWords.join(', ')}`
          : 'Operational throughput, margin & delivery velocity',
    },
  ]
}

export function projectCrossIndustryHorizons(
  profile: any,
  operationalRadar: OperationalAxisScore[]
): HorizonVerticalProjection[] {
  const currentPrimary = normalizeIndustryVertical(profile?.industry_vertical || '')
  const { corpus } = extractCandidateCorpus(profile)
  const scores = operationalRadar.map((a) => a.score)

  const projections: HorizonVerticalProjection[] = VERTICAL_ARCHETYPE_MATRIX.map((spec) => {
    const isCurrentPrimary =
      spec.vertical.toLowerCase() === currentPrimary.toLowerCase()

    let weightedSum = 0
    for (let i = 0; i < 6; i++) {
      weightedSum += (scores[i] || 50) * spec.weights[i]
    }

    const globalRegex = new RegExp(spec.domainKeywords.source, 'gi')
    const domainMatches = Array.from(new Set(corpus.match(globalRegex) || []))
    const domainHitCount = domainMatches.length

    const domainCoverageRatio = Math.min(1, domainHitCount / 4)
    const effectiveBarrierPenalty = Math.round(
      spec.structuralBarrierPenalty * (1 - domainCoverageRatio * 0.75)
    )

    const transferabilityScore = clampScore(
      weightedSum - effectiveBarrierPenalty + domainHitCount * 2.5,
      18,
      95
    )

    const rawBase =
      domainHitCount === 0
        ? Math.max(4, Math.round(14 - spec.structuralBarrierPenalty * 0.22))
        : 14 + domainHitCount * 9.5 + (weightedSum - 50) * 0.25 - effectiveBarrierPenalty * 0.35

    const currentDirectFitEstimate = isCurrentPrimary
      ? clampScore(Math.max(58, rawBase + 18), 45, 92)
      : clampScore(rawBase, 4, 78)

    const enrichedBridgeSkills: BridgeDeltaSkillSpec[] = spec.bridgeSkills.map((b) => ({
      ...b,
      isSelfStudyBridgeable: b.modality !== 'industry_exposure_required',
    }))

    const selfStudyLift = enrichedBridgeSkills
      .filter((b) => b.isSelfStudyBridgeable)
      .reduce((acc, b) => acc + b.fitLiftPoints, 0)

    const allLift = enrichedBridgeSkills.reduce((acc, b) => acc + b.fitLiftPoints, 0)

    const shortTermSelfStudyCeiling = clampScore(
      currentDirectFitEstimate + selfStudyLift,
      6,
      94
    )

    const projectedBridgedFitScore = clampScore(
      currentDirectFitEstimate + allLift,
      12,
      96
    )

    let feasibilityTier: HorizonFeasibilityTier = 'high_fast_track'
    let feasibilityLabel = '🟢 High Feasibility • Fast-Track Bridgeable (2–6 Weeks)'

    if (shortTermSelfStudyCeiling < 40 || transferabilityScore < 45 || spec.structuralBarrierPenalty >= 30) {
      feasibilityTier = 'low_structural_barrier'
      feasibilityLabel = '🔴 Low Feasibility • Hard Licensure / Industry Tenure Barrier'
    } else if (shortTermSelfStudyCeiling < 58 || transferabilityScore < 64 || spec.structuralBarrierPenalty >= 15) {
      feasibilityTier = 'moderate_stepping_stone'
      feasibilityLabel = '🟡 Moderate Feasibility • Enter via Adjacent Ops / Tech Role'
    }

    const rankedAxes = operationalRadar
      .map((axisObj, idx) => ({
        name: axisObj.axis,
        contribution: axisObj.score * spec.weights[idx],
        score: axisObj.score,
      }))
      .sort((a, b) => b.contribution - a.contribution)

    const dominantSharedAxes = rankedAxes.slice(0, 2).map((r) => `${r.name} (${r.score}%)`)

    const executiveSummary =
      feasibilityTier === 'low_structural_barrier'
        ? `HONEST REALITY CHECK: While your ${rankedAxes[0].name} (${rankedAxes[0].score}%) provides general operational structure, ${spec.vertical} carries a steep structural/licensure barrier. Your current Raw Keyword Fit is ${currentDirectFitEstimate}%, and short-term self-study alone caps out at ${shortTermSelfStudyCeiling}%. ${spec.barrierExplanation}`
        : feasibilityTier === 'moderate_stepping_stone'
        ? `STEPPING-STONE SECTOR: Your ${rankedAxes[0].name} (${rankedAxes[0].score}%) and ${rankedAxes[1].name} (${rankedAxes[1].score}%) transfer at ${transferabilityScore}% operational compatibility. Self-paced certifications lift your fit from ${currentDirectFitEstimate}% to ${shortTermSelfStudyCeiling}%, while reaching ${projectedBridgedFitScore}% requires entering via an adjacent IT/Operations/Vendor role first. ${spec.barrierExplanation}`
        : `HIGH-TRANSFERABILITY SECTOR: Your ${rankedAxes[0].name} (${rankedAxes[0].score}%) and ${rankedAxes[1].name} (${rankedAxes[1].score}%) align at ${transferabilityScore}% structural compatibility with ${spec.vertical}. Completing the self-paced ${enrichedBridgeSkills[0]?.skill} bridge lifts your TrueFit Score™ from ${currentDirectFitEstimate}% to ${shortTermSelfStudyCeiling}% without needing a career restart.`

    return {
      vertical: spec.vertical,
      isCurrentPrimary,
      feasibilityTier,
      feasibilityLabel,
      realityCheckWarning: spec.barrierExplanation,
      transferabilityScore,
      currentDirectFitEstimate,
      shortTermSelfStudyCeiling,
      projectedBridgedFitScore,
      dominantSharedAxes,
      targetRoleArchetypes: spec.roleArchetypes,
      estimatedPayBand: spec.payBand,
      terminologyTranslations: spec.translations.map(
        ([legacyTerm, targetVerticalTerm, operationalPrimitive]) => ({
          legacyTerm,
          targetVerticalTerm,
          operationalPrimitive,
        })
      ),
      bridgeDeltaSkills: enrichedBridgeSkills,
      executiveSummary,
    }
  })

  return projections
    .filter((p) => !p.isCurrentPrimary)
    .sort((a, b) => {
      const scoreA = a.transferabilityScore * 0.6 + a.shortTermSelfStudyCeiling * 0.4
      const scoreB = b.transferabilityScore * 0.6 + b.shortTermSelfStudyCeiling * 0.4
      return scoreB - scoreA
    })
}

export function evaluateLiveJobHorizonBridges(
  profile: any,
  jobs: any[],
  operationalRadar: OperationalAxisScore[],
  verticalProjections: HorizonVerticalProjection[]
): LiveJobHorizonBridge[] {
  const { corpus: candCorpus, candSkillNames } = extractCandidateCorpus(profile)
  const avgOpScore =
    operationalRadar.reduce((sum, a) => sum + a.score, 0) / Math.max(1, operationalRadar.length)

  const vertMap = new Map<string, HorizonVerticalProjection>()
  for (const vp of verticalProjections) {
    vertMap.set(vp.vertical.toLowerCase(), vp)
  }

  const bridges: LiveJobHorizonBridge[] = []

  for (const job of jobs || []) {
    if (!job || String(job.title || '').startsWith('[CALIBRATION]')) continue

    const rawReqs = Array.isArray(job.structured_requirements) ? job.structured_requirements : []
    const metaItem = rawReqs.find((r: any) => r && r._ss_job_meta === true) || job.job_meta || {}
    const visibleReqs = rawReqs.filter(
      (r: any) =>
        r &&
        typeof r === 'object' &&
        !r._ss_job_meta &&
        (r.skill || r.name) &&
        !String(r.skill || r.name).startsWith('__SS_')
    )

    if (visibleReqs.length === 0) continue

    const matchedCoreSkills: string[] = []
    const missingReqs: { skill: string; requiredLevel: string }[] = []

    const stopTokens = new Set(['and', 'the', 'for', 'with', 'operations', 'management', 'program', 'systems', 'lead'])

    for (const req of visibleReqs) {
      const reqName = String(req.skill || req.name).trim()
      const reqLower = reqName.toLowerCase()
      const meaningfulTokens = reqLower
        .split(/[\s,/&-]+/)
        .filter((t) => t.length >= 3 && !stopTokens.has(t))

      const isMatched =
        candCorpus.includes(reqLower) ||
        candSkillNames.some((cs: string) => cs.includes(reqLower) || reqLower.includes(cs)) ||
        (meaningfulTokens.length > 0 &&
          meaningfulTokens.filter((t) => candCorpus.includes(t)).length >=
            Math.max(1, Math.ceil(meaningfulTokens.length * 0.65)))

      if (isMatched) {
        matchedCoreSkills.push(reqName)
      } else {
        missingReqs.push({
          skill: reqName,
          requiredLevel: String(req.level || 'Intermediate'),
        })
      }
    }

    const totalReqs = visibleReqs.length
    const matchRatio = matchedCoreSkills.length / Math.max(1, totalReqs)

    const jobIndustry = normalizeIndustryVertical(job.industry || metaItem.industry || '')
    const vertProj = vertMap.get(jobIndustry.toLowerCase())
    const vertDna = vertProj ? vertProj.transferabilityScore : clampScore(avgOpScore * 0.75, 25, 85)
    const vertRawFit = vertProj ? vertProj.currentDirectFitEstimate : 35

    const rawSkillScore = matchRatio * 68
    const verticalContextBonus = vertRawFit * 0.24
    const currentTrueFitScore = clampScore(
      rawSkillScore + verticalContextBonus,
      6,
      94
    )

    const horizonTransferabilityScore = clampScore(
      vertDna * 0.65 + matchRatio * 28 + (avgOpScore - 50) * 0.2,
      16,
      94
    )

    const topMissing = missingReqs.slice(0, 3)
    const perSkillPointValue = Math.round(54 / Math.max(1, totalReqs))

    const bridgeDeltaSkills = topMissing.map((m) => {
      const bridgeMeta = classifyLiveJobSkillBridge(m.skill, m.requiredLevel, jobIndustry)
      const lift = bridgeMeta.isSelfStudyBridgeable
        ? clampScore(perSkillPointValue, 6, 16)
        : clampScore(perSkillPointValue + 3, 10, 20)
      return {
        skill: m.skill,
        requiredLevel: m.requiredLevel,
        fitLiftPoints: lift,
        ...bridgeMeta,
      }
    })

    const selfStudyLift = bridgeDeltaSkills
      .filter((b) => b.isSelfStudyBridgeable)
      .reduce((acc, b) => acc + b.fitLiftPoints, 0)

    const totalLift = bridgeDeltaSkills.reduce((acc, b) => acc + b.fitLiftPoints, 0)

    const shortTermSelfStudyCeiling = clampScore(
      currentTrueFitScore + selfStudyLift,
      currentTrueFitScore,
      94
    )

    const projectedBridgedTrueFitScore = clampScore(
      currentTrueFitScore + totalLift,
      currentTrueFitScore,
      96
    )

    const unbridgeableCount = bridgeDeltaSkills.filter((b) => !b.isSelfStudyBridgeable).length

    let feasibilityTier: HorizonFeasibilityTier = 'high_fast_track'
    let feasibilityBadge = '🟢 Self-Study Bridgeable (Reaches ≥40% TrueFit™)'

    if (shortTermSelfStudyCeiling < 40) {
      feasibilityTier = 'low_structural_barrier'
      feasibilityBadge = `🛑 Below 40% Firewall After Self-Study (Max ${shortTermSelfStudyCeiling}%) — Requires Industry Tenure`
    } else if (unbridgeableCount > 0 || shortTermSelfStudyCeiling < 58) {
      feasibilityTier = 'moderate_stepping_stone'
      feasibilityBadge = `🟡 Partial Self-Study Bridge (${shortTermSelfStudyCeiling}% Ceiling) — Has Industry Tenure Gate`
    }

    const payType =
      job.pay_type === 'hourly' ||
      metaItem.pay_type === 'hourly' ||
      (job.salary_max && job.salary_max > 0 && job.salary_max <= 500)
        ? 'hourly'
        : 'annual'
    const minVal = Number(job.salary_min) || 0
    const maxVal = Number(job.salary_max) || 0
    let formattedPay = 'Compensation Open'
    if (minVal > 0 && maxVal > 0) {
      formattedPay =
        payType === 'hourly'
          ? `$${minVal} – $${maxVal} /hr`
          : `$${Math.round(minVal / 1000)}k – $${Math.round(maxVal / 1000)}k /yr`
    }

    const topAxes = [...operationalRadar].sort((a, b) => b.score - a.score).slice(0, 2)

    const whyOperationalDnaFits =
      feasibilityTier === 'low_structural_barrier'
        ? `HONEST ASSESSMENT: You currently match ${matchedCoreSkills.length} of ${totalReqs} required skills (${currentTrueFitScore}% Raw Fit). Even if you complete all self-paced bridges, your score caps at ${shortTermSelfStudyCeiling}% (below the 40% TrueFit™ application threshold) because this role requires direct ${jobIndustry.split(',')[0]} tenure or licensing.`
        : `You match ${matchedCoreSkills.length} of ${totalReqs} core requirements (${currentTrueFitScore}% Raw Fit), backed by ${horizonTransferabilityScore}% Operational DNA in ${topAxes[0]?.axis}. Self-paced bridging lifts your readiness to ${shortTermSelfStudyCeiling}%${
            projectedBridgedTrueFitScore > shortTermSelfStudyCeiling
              ? ` (and ${projectedBridgedTrueFitScore}% with direct industry tenure).`
              : '.'
          }`

    bridges.push({
      jobId: job.id,
      title: job.title,
      industry: jobIndustry,
      location: job.location || metaItem.location || 'Remote / Flexible',
      workModel: String(job.work_model || 'remote').toUpperCase(),
      formattedPay,
      feasibilityTier,
      feasibilityBadge,
      currentTrueFitScore,
      horizonTransferabilityScore,
      shortTermSelfStudyCeiling,
      projectedBridgedTrueFitScore,
      matchedCoreSkills,
      totalRequiredSkills: totalReqs,
      bridgeDeltaSkills,
      whyOperationalDnaFits,
    })
  }

  return bridges.sort((a, b) => {
    const scoreA = a.shortTermSelfStudyCeiling * 0.6 + a.horizonTransferabilityScore * 0.4
    const scoreB = b.shortTermSelfStudyCeiling * 0.6 + b.horizonTransferabilityScore * 0.4
    return scoreB - scoreA
  })
}

export function buildCompleteTrueHorizonAnalysis(
  profile: any,
  jobs: any[]
): TrueHorizonAnalysisResult {
  const operationalRadar = computeOperationalVector6D(profile)
  const topHorizonVerticals = projectCrossIndustryHorizons(profile, operationalRadar)
  const liveJobBridges = evaluateLiveJobHorizonBridges(
    profile,
    jobs,
    operationalRadar,
    topHorizonVerticals
  )

  const overallTransferabilityIndex = clampScore(
    topHorizonVerticals
      .slice(0, 5)
      .reduce((acc, v) => acc + v.transferabilityScore, 0) /
      Math.max(1, Math.min(5, topHorizonVerticals.length)),
    25,
    95
  )

  return {
    generatedAt: new Date().toISOString(),
    primaryIndustry: normalizeIndustryVertical(profile?.industry_vertical || ''),
    overallTransferabilityIndex,
    operationalRadar,
    topHorizonVerticals,
    liveJobBridges,
  }
}

export function computeEmployerCandidateHorizonFit(
  candidate: any,
  targetIndustryFilter?: string
): {
  overallDnaScore: number
  targetVerticalScore: number
  topSharedAxes: string[]
  isAdjacentHorizonMatch: boolean
} {
  const radar = computeOperationalVector6D(candidate)
  const avgDna = Math.round(
    radar.reduce((acc, r) => acc + r.score, 0) / Math.max(1, radar.length)
  )
  const sortedAxes = [...radar].sort((a, b) => b.score - a.score)
  const topSharedAxes = sortedAxes.slice(0, 2).map((a) => a.shortLabel)

  if (!targetIndustryFilter || targetIndustryFilter === 'all') {
    return {
      overallDnaScore: clampScore(avgDna, 25, 95),
      targetVerticalScore: clampScore(avgDna, 25, 95),
      topSharedAxes,
      isAdjacentHorizonMatch: false,
    }
  }

  const normalizedTarget = normalizeIndustryVertical(targetIndustryFilter)
  const rawSkills = Array.isArray(candidate?.structured_skills)
    ? candidate.structured_skills
    : []
  const metaEntry = rawSkills.find(
    (item: any) => item && (item._ss_pref_meta === true || item._ss_candidate_prefs === true)
  )
  const candIndustryRaw =
    candidate?.industry_vertical || metaEntry?.industry_vertical || ''
  const candIndustry = candIndustryRaw ? normalizeIndustryVertical(candIndustryRaw) : ''

  const isExactIndustry =
    candIndustry.toLowerCase() === normalizedTarget.toLowerCase()

  const spec = VERTICAL_ARCHETYPE_MATRIX.find(
    (v) => v.vertical.toLowerCase() === normalizedTarget.toLowerCase()
  )

  let weightedScore = avgDna
  if (spec) {
    let sum = 0
    for (let i = 0; i < 6; i++) {
      sum += (radar[i]?.score || 50) * spec.weights[i]
    }
    const { corpus } = extractCandidateCorpus(candidate)
    const globalRegex = new RegExp(spec.domainKeywords.source, 'gi')
    const domainHits = Array.from(new Set(corpus.match(globalRegex) || [])).length
    const domainRatio = Math.min(1, domainHits / 4)
    const penalty = Math.round(spec.structuralBarrierPenalty * (1 - domainRatio * 0.75))
    weightedScore = sum - penalty + domainHits * 2.5
  }

  const targetVerticalScore = clampScore(weightedScore, 18, 95)

  return {
    overallDnaScore: clampScore(avgDna, 25, 95),
    targetVerticalScore,
    topSharedAxes,
    isAdjacentHorizonMatch: !isExactIndustry && targetVerticalScore >= 68,
  }
}
