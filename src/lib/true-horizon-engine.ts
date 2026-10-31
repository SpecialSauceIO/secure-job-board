
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

import { STANDARD_INDUSTRY_VERTICALS, normalizeIndustryVertical } from '@/constants/industries'

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
  transferabilityScore: number
  currentDirectFitEstimate: number
  projectedBridgedFitScore: number
  dominantSharedAxes: string[]
  targetRoleArchetypes: string[]
  estimatedPayBand: string
  terminologyTranslations: TerminologyTranslation[]
  bridgeDeltaSkills: {
    skill: string
    recommendedLevel: 'Beginner' | 'Intermediate' | 'Expert'
    fitLiftPoints: number
    rationale: string
  }[]
  executiveSummary: string
}

export interface LiveJobHorizonBridge {
  jobId: string
  title: string
  industry: string
  location: string
  workModel: string
  formattedPay: string
  currentTrueFitScore: number
  horizonTransferabilityScore: number
  projectedBridgedTrueFitScore: number
  matchedCoreSkills: string[]
  bridgeDeltaSkills: {
    skill: string
    requiredLevel: string
    fitLiftPoints: number
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

interface VerticalArchetypeSpec {
  vertical: string
  weights: [number, number, number, number, number, number] // Systems, Process, Triage, Orchestration, Enablement, Commercial
  roleArchetypes: string[]
  payBand: string
  translations: [string, string, string][]
  bridgeSkills: [string, 'Beginner' | 'Intermediate' | 'Expert', number, string][]
}

const VERTICAL_ARCHETYPE_MATRIX: VerticalArchetypeSpec[] = [
  {
    vertical: 'Artificial Intelligence, Data & Analytics',
    weights: [0.28, 0.14, 0.10, 0.16, 0.22, 0.10],
    roleArchetypes: [
      'AI Enablement & Knowledge Program Lead',
      'LLM Operations & Evaluation Specialist',
      'Technical AI Deployment Program Manager',
    ],
    payBand: '$125k – $175k /yr',
    translations: [
      ['Knowledge Base / SOP Authoring', 'RAG Corpus Curation & Prompt Grounding', 'Enablement & Knowledge Transfer'],
      ['Escalation QA & Ticket Audits', 'RLHF / Model Output Evaluation & Guardrails', 'Process & SLA Rigor'],
      ['Support Tooling & Scripting', 'Agentic Workflow & Pipeline Automation', 'Systems & Architecture'],
    ],
    bridgeSkills: [
      ['Prompt Engineering & LLM Evaluation', 'Intermediate', 18, 'Translates existing QA and training rigor directly into AI model readiness.'],
      ['RAG Knowledge Architecture', 'Intermediate', 14, 'Bridges enterprise documentation management into vector-grounded AI workflows.'],
      ['Python / API Workflow Automation', 'Beginner', 10, 'Connects systems troubleshooting to automated model evaluation pipelines.'],
    ],
  },
  {
    vertical: 'Technology, Software & SaaS',
    weights: [0.26, 0.15, 0.16, 0.18, 0.15, 0.10],
    roleArchetypes: [
      'Senior Technical Program Manager (SaaS)',
      'Enterprise Customer Success & Enablement Lead',
      'Product Operations & Release Readiness Manager',
    ],
    payBand: '$115k – $160k /yr',
    translations: [
      ['Service Desk / Escalation Lead', 'Incident Response & Release Readiness Lead', 'Escalation & Crisis Triage'],
      ['Vendor / BPO Supervision', 'Cross-Functional Engineering & Ops Orchestration', 'Resource & Vendor Orchestration'],
      ['End-User Training', 'Enterprise SaaS Adoption & Technical Enablement', 'Enablement & Knowledge Transfer'],
    ],
    bridgeSkills: [
      ['SaaS Product Operations & Agile Delivery', 'Intermediate', 16, 'Maps operational cadence to recurring software release cycles.'],
      ['Enterprise Customer Onboarding & Retention', 'Expert', 14, 'Converts support escalation mastery into proactive NRR expansion.'],
      ['SQL / Telemetry Analytics', 'Beginner', 9, 'Links KPI reporting directly to product adoption telemetry.'],
    ],
  },
  {
    vertical: 'Cybersecurity & Cloud Infrastructure',
    weights: [0.30, 0.24, 0.22, 0.10, 0.08, 0.06],
    roleArchetypes: [
      'Security Operations (SecOps) Program Lead',
      'Cloud Governance, Risk & Compliance (GRC) Manager',
      'Identity & Access Governance Specialist',
    ],
    payBand: '$120k – $170k /yr',
    translations: [
      ['Tier-3 Incident Escalation', 'SOC Incident Triage & Threat Containment', 'Escalation & Crisis Triage'],
      ['Access Control & Account Provisioning', 'Zero-Trust IAM & Identity Governance', 'Systems & Architecture'],
      ['Audit & Policy Adherence', 'SOC2 / ISO27001 / NIST Compliance Rigor', 'Process & SLA Rigor'],
    ],
    bridgeSkills: [
      ['IAM & Zero-Trust Access Governance', 'Intermediate', 17, 'Extends system administration into enterprise security architecture.'],
      ['NIST / SOC2 Compliance Frameworks', 'Intermediate', 15, 'Formalizes operational SOP auditing into regulatory security controls.'],
      ['Cloud Security Posture (AWS / Azure)', 'Beginner', 11, 'Maps infrastructure support to cloud-native defense.'],
    ],
  },
  {
    vertical: 'BPO, Contact Center & Customer Operations',
    weights: [0.14, 0.24, 0.22, 0.22, 0.12, 0.06],
    roleArchetypes: [
      'Global Vendor Program & BPO Operations Director',
      'Workforce & Service Delivery Optimization Lead',
      'Customer Experience (CX) Transformation Manager',
    ],
    payBand: '$105k – $145k /yr',
    translations: [
      ['Team Supervision & Coaching', 'Multi-Site BPO Partner Governance & SLA Enforcement', 'Resource & Vendor Orchestration'],
      ['Issue Resolution', 'High-Severity Escalation & Root-Cause Governance', 'Escalation & Crisis Triage'],
      ['Process Documentation', 'Global Playbook Standardization & AHT Optimization', 'Process & SLA Rigor'],
    ],
    bridgeSkills: [
      ['Vendor SLA & MSA Governance', 'Expert', 16, 'Formalizes partner oversight into executive vendor program management.'],
      ['Workforce Capacity & Deflection Modeling', 'Intermediate', 14, 'Connects ticket volume tracking to unit-cost economics.'],
      ['AI Ticket Deflection & Copilot Rollout', 'Intermediate', 11, 'Modernizes legacy support queues with automated triage.'],
    ],
  },
  {
    vertical: 'Finance, Banking, FinTech & Insurance',
    weights: [0.18, 0.28, 0.16, 0.16, 0.10, 0.12],
    roleArchetypes: [
      'FinTech Operations & Fraud Triage Lead',
      'Enterprise Vendor & Operational Risk Manager',
      'Payment Systems & Compliance Program Manager',
    ],
    payBand: '$115k – $165k /yr',
    translations: [
      ['Identity & Account Verification', 'KYC / KYB & Anti-Fraud Operations', 'Process & SLA Rigor'],
      ['Vendor Infrastructure Operations', 'Third-Party Risk Management (TPRM) & Resilience', 'Resource & Vendor Orchestration'],
      ['System Outage Escalations', 'High-Availability Transaction Incident Governance', 'Escalation & Crisis Triage'],
    ],
    bridgeSkills: [
      ['Third-Party Risk Management (TPRM)', 'Intermediate', 17, 'Maps vendor program leadership directly to regulated financial standards.'],
      ['KYC / AML & Payment Operations Compliance', 'Intermediate', 15, 'Connects identity verification workflows to FinTech regulatory gates.'],
      ['Operational Risk & Audit Controls', 'Intermediate', 10, 'Translates QA governance into banking examination readiness.'],
    ],
  },
  {
    vertical: 'Wholesale Trade, Supply Chain, Logistics & Distribution',
    weights: [0.16, 0.24, 0.18, 0.22, 0.06, 0.14],
    roleArchetypes: [
      'Supply Chain Systems & Inventory Operations Lead',
      'Vendor Procurement & Fulfillment Program Manager',
      'Distribution Logistics & Exception Triage Manager',
    ],
    payBand: '$98k – $140k /yr',
    translations: [
      ['Inventory Tracking & Retail Arbitrage', 'Demand Forecasting & SKU Velocity Optimization', 'Commercial & Throughput Velocity'],
      ['Ticket Queue Prioritization', 'Fulfillment Exception & Bottleneck Triage', 'Escalation & Crisis Triage'],
      ['Vendor Coordination', 'Supplier Lead-Time & 3PL SLA Orchestration', 'Resource & Vendor Orchestration'],
    ],
    bridgeSkills: [
      ['3PL & Supplier SLA Governance', 'Intermediate', 16, 'Applies vendor management mechanics to physical distribution networks.'],
      ['ERP / WMS Inventory Telemetry', 'Intermediate', 14, 'Bridges technical database comfort into supply chain tracking systems.'],
      ['Unit-Economics & Margin Optimization', 'Expert', 12, 'Converts arbitrage pricing discipline into enterprise procurement savings.'],
    ],
  },
  {
    vertical: 'E-Commerce, Retail & Consumer Goods (CPG)',
    weights: [0.18, 0.16, 0.12, 0.18, 0.10, 0.26],
    roleArchetypes: [
      'E-Commerce Marketplace & Merchandising Operations Lead',
      'Digital Catalog & Pricing Arbitrage Manager',
      'Omnichannel Fulfillment & Vendor Program Manager',
    ],
    payBand: '$95k – $142k /yr',
    translations: [
      ['Marketplace Reselling & Sourcing', 'Assortment Strategy & Margin Yield Management', 'Commercial & Throughput Velocity'],
      ['Automated Stock Monitoring', 'Programmatic Pricing & Inventory Intelligence', 'Systems & Architecture'],
      ['Customer Dispute Handling', 'Marketplace Trust, Post-Purchase CX & Chargeback Defense', 'Process & SLA Rigor'],
    ],
    bridgeSkills: [
      ['Marketplace Channel Management (eBay / Amazon / D2C)', 'Expert', 18, 'Directly monetizes hands-on listing, sourcing, and conversion expertise.'],
      ['Inventory Turnover & GMV Analytics', 'Intermediate', 14, 'Formalizes high-margin product selection into CPG merchandising metrics.'],
      ['Catalog Automation & Feed Operations', 'Intermediate', 10, 'Combines scripting/data skills with large-scale SKU management.'],
    ],
  },
  {
    vertical: 'Education, EdTech, K-12, Higher Ed & Corporate Training',
    weights: [0.16, 0.14, 0.08, 0.16, 0.38, 0.08],
    roleArchetypes: [
      'Director of Technical Enablement & Learning Architecture',
      'Enterprise Instructional Systems & Readiness Lead',
      'EdTech Curriculum & Knowledge Program Manager',
    ],
    payBand: '$95k – $138k /yr',
    translations: [
      ['Support Agent Coaching & Onboarding', 'Competency-Based Learning Architecture & Bootcamp Design', 'Enablement & Knowledge Transfer'],
      ['Internal Wiki / KB Maintenance', 'Enterprise LMS & Knowledge Graph Governance', 'Systems & Architecture'],
      ['Quality Scorecards', 'Learner Competency & Time-to-Productivity Telemetry', 'Process & SLA Rigor'],
    ],
    bridgeSkills: [
      ['Instructional Design (ADDIE / SAM) & LMS Governance', 'Expert', 18, 'Validates hands-on training creation for executive L&D roles.'],
      ['Time-to-Productivity & Enablement OKRs', 'Intermediate', 14, 'Links training programs directly to measurable business outcomes.'],
      ['AI-Assisted Curriculum Generation', 'Intermediate', 10, 'Positions enablement leaders at the forefront of modern EdTech.'],
    ],
  },
  {
    vertical: 'Healthcare, Biotech, Pharma & Life Sciences',
    weights: [0.18, 0.30, 0.18, 0.16, 0.12, 0.06],
    roleArchetypes: [
      'HealthTech Implementation & Clinical Enablement Lead',
      'Healthcare Operations & Regulatory Compliance Manager',
      'Patient Access & Support Systems Program Manager',
    ],
    payBand: '$105k – $150k /yr',
    translations: [
      ['PII Privacy & Security Controls', 'HIPAA / HITRUST Data Privacy & Audit Governance', 'Process & SLA Rigor'],
      ['Enterprise Software Rollout', 'EHR / HealthTech Clinical Workflow Enablement', 'Enablement & Knowledge Transfer'],
      ['Priority Incident Triage', 'Mission-Critical Clinical Support Escalation', 'Escalation & Crisis Triage'],
    ],
    bridgeSkills: [
      ['HIPAA / Healthcare Data Privacy Compliance', 'Intermediate', 18, 'Unlocks regulated HealthTech operations roles using existing security discipline.'],
      ['EHR / Digital Health Workflow Implementation', 'Intermediate', 15, 'Translates SaaS onboarding into clinical software deployment.'],
      ['Healthcare Vendor & RevCycle Operations', 'Beginner', 10, 'Bridges BPO and billing operations into healthcare administration.'],
    ],
  },
  {
    vertical: 'Defense, Aerospace & Government Contracting',
    weights: [0.24, 0.30, 0.18, 0.16, 0.08, 0.04],
    roleArchetypes: [
      'GovCon Technical Program & Compliance Manager',
      'Mission Support & Infrastructure Operations Lead',
      'Defense Readiness & Technical Training Specialist',
    ],
    payBand: '$118k – $168k /yr',
    translations: [
      ['SOP & Security Compliance', 'NIST 800-171 / CMMC / FedRAMP Operational Controls', 'Process & SLA Rigor'],
      ['Vendor & Infrastructure Lead', 'Subcontractor & Mission Systems Sustainment', 'Resource & Vendor Orchestration'],
      ['Technical Training & Docs', 'Integrated Logistics Support (ILS) & Operator Readiness', 'Enablement & Knowledge Transfer'],
    ],
    bridgeSkills: [
      ['FedRAMP / NIST 800-171 / CMMC Compliance', 'Intermediate', 19, 'Translates enterprise IT governance into federal contracting requirements.'],
      ['Earned Value Management (EVM) & GovCon Deliverables', 'Intermediate', 14, 'Maps program planning to federal contract milestone tracking.'],
      ['ITIL / Mission Service Delivery', 'Intermediate', 10, 'Aligns enterprise service desk leadership with federal IT standards.'],
    ],
  },
]

function clampScore(val: number, min = 18, max = 98): number {
  return Math.max(min, Math.min(max, Math.round(val)))
}

/**
 * Stage 1 of Patent Specification:
 * Decomposes a Professional's domain-specific profile into a 6-dimensional
 * industry-agnostic Operational Competency Vector (0-100 per axis).
 */
export function computeOperationalVector6D(profile: any): OperationalAxisScore[] {
  const rawSkills = Array.isArray(profile?.structured_skills)
    ? profile.structured_skills.filter(
        (s: any) => s && typeof s === 'object' && !s._ss_candidate_prefs && !s._ss_pref_meta && (s.skill || s.name)
      )
    : []

  const skillText = rawSkills
    .map((s: any) => `${s.skill || s.name} (${s.level || 'Intermediate'}, ${s.years || 2}y)`)
    .join(' | ')
  const corpus = `${skillText} ${profile?.skills || ''} ${profile?.bio || ''} ${
    profile?.certifications || ''
  } ${profile?.education_level || ''}`.toLowerCase()

  const expYears = Math.max(1, Number(profile?.experience_years) || 5)
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

  // Axis 1: Systems & Architecture
  const [sysHits, sysWords] = countMatches([
    /python|typescript|javascript|sql|next\.?js|supabase|api|automation|script/i,
    /cloud|azure|aws|office 365|m365|infrastructure|network|hardware|comptia/i,
    /ai|llm|genai|generative ai|prompt|model|telemetry|architecture|system/i,
    /troubleshooting|diagnostics|configuration|deployment|integration|saas/i,
  ])
  const sysScore = clampScore(38 + sysHits * 11 + maturityBonus * 0.8)

  // Axis 2: Process & SLA Rigor
  const [procHits, procWords] = countMatches([
    /sla|sop|quality|qa|audit|compliance|governance|policy|standard/i,
    /okr|kpi|metric|calibration|verification|security|privacy|accessibility/i,
    /process|workflow|documentation|knowledge|framework|itil|iso/i,
    /accuracy|consistency|risk|control|tier|escalation/i,
  ])
  const procScore = clampScore(40 + procHits * 11 + maturityBonus * 0.85)

  // Axis 3: Escalation & Crisis Triage
  const [triageHits, triageWords] = countMatches([
    /escalation|triage|incident|crisis|root[- ]cause|outage|critical/i,
    /support|service desk|help desk|tier 2|tier 3|resolution|troubleshooting/i,
    /high[- ]volume|fast[- ]paced|turnaround|backlog|bottleneck|recovery/i,
    /customer|client|retention|de-escalation|specialist|lead/i,
  ])
  const triageScore = clampScore(36 + triageHits * 11.5 + maturityBonus * 0.85)

  // Axis 4: Resource & Vendor Orchestration
  const [orchHits, orchWords] = countMatches([
    /vendor|bpo|partner|supplier|contract|procurement|outsourc/i,
    /program manager|project|planner|operations lead|supervisor|manager|director/i,
    /cross[- ]functional|stakeholder|global|schedule|capacity|budget|headcount/i,
    /onboarding|rollout|launch|coordination|governance|okr/i,
  ])
  const orchScore = clampScore(37 + orchHits * 11.5 + maturityBonus * 0.9)

  // Axis 5: Enablement & Knowledge Transfer
  const [enabHits, enabWords] = countMatches([
    /training|enablement|coach|curriculum|instruction|learning|workshop/i,
    /content|knowledge|playbook|documentation|guide|communication/i,
    /adoption|readiness|mentoring|presentation|executive|facilitat/i,
    /ai enablement|certif|educat|onboarding/i,
  ])
  const enabScore = clampScore(35 + enabHits * 12 + maturityBonus * 0.85)

  // Axis 6: Commercial & Throughput Velocity
  const [commHits, commWords] = countMatches([
    /e-commerce|ecommerce|retail|arbitrage|margin|revenue|sales|commercial/i,
    /pricing|conversion|growth|roi|cost|efficiency|throughput|productivity/i,
    /founder|saas|marketplace|sourcing|inventory|account|client/i,
    /\d+%|\$\d+|million|thousand|saved|accelerated|reduced/i,
  ])
  const commScore = clampScore(34 + commHits * 11.5 + maturityBonus * 0.75)

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

/**
 * Stage 2 of Patent Specification:
 * Projects the 6D Operational Vector across standardized industry verticals
 * to identify high-transferability adjacent sectors and compute the Bridge Delta.
 */
export function projectCrossIndustryHorizons(
  profile: any,
  operationalRadar: OperationalAxisScore[]
): HorizonVerticalProjection[] {
  const currentPrimary = normalizeIndustryVertical(profile?.industry_vertical || '')
  const scores = operationalRadar.map((a) => a.score)

  const projections: HorizonVerticalProjection[] = VERTICAL_ARCHETYPE_MATRIX.map((spec) => {
    const isCurrentPrimary =
      spec.vertical.toLowerCase() === currentPrimary.toLowerCase()

    // Weighted dot product between user's 6D Operational Vector and vertical archetype weights
    let weightedSum = 0
    for (let i = 0; i < 6; i++) {
      weightedSum += (scores[i] || 60) * spec.weights[i]
    }

    const transferabilityScore = clampScore(weightedSum + 4, 52, 96)

    // Direct Fit estimate reflects how strict keyword-gated TrueFit scores them today before bridging
    const currentDirectFitEstimate = isCurrentPrimary
      ? clampScore(transferabilityScore - 6, 65, 92)
      : clampScore(transferabilityScore * 0.46, 28, 49)

    const bridgeLift = spec.bridgeSkills.reduce((acc, b) => acc + b[2], 0)
    const projectedBridgedFitScore = clampScore(
      Math.max(transferabilityScore, currentDirectFitEstimate + bridgeLift),
      74,
      96
    )

    // Top 2 dominant shared axes
    const rankedAxes = operationalRadar
      .map((axisObj, idx) => ({
        name: axisObj.axis,
        contribution: axisObj.score * spec.weights[idx],
        score: axisObj.score,
      }))
      .sort((a, b) => b.contribution - a.contribution)

    const dominantSharedAxes = rankedAxes.slice(0, 2).map((r) => `${r.name} (${r.score}%)`)

    return {
      vertical: spec.vertical,
      isCurrentPrimary,
      transferabilityScore,
      currentDirectFitEstimate,
      projectedBridgedFitScore,
      dominantSharedAxes,
      targetRoleArchetypes: spec.roleArchetypes,
      estimatedPayBand: spec.payBand,
      terminologyTranslations: spec.translations.map(([legacyTerm, targetVerticalTerm, operationalPrimitive]) => ({
        legacyTerm,
        targetVerticalTerm,
        operationalPrimitive,
      })),
      bridgeDeltaSkills: spec.bridgeSkills.map(([skill, recommendedLevel, fitLiftPoints, rationale]) => ({
        skill,
        recommendedLevel,
        fitLiftPoints,
        rationale,
      })),
      executiveSummary: `Your operational DNA in ${rankedAxes[0].name} (${rankedAxes[0].score}%) and ${rankedAxes[1].name} (${rankedAxes[1].score}%) transfers at ${transferabilityScore}% structural compatibility into ${spec.vertical}. Bridging ${spec.bridgeSkills[0][0]} lifts your vertical TrueFit Score™ from ~${currentDirectFitEstimate}% to ${projectedBridgedFitScore}%.`,
    }
  })

  // Prioritize cross-industry horizons first (sorted by transferabilityScore desc), keeping current primary visible if needed
  const crossIndustry = projections
    .filter((p) => !p.isCurrentPrimary)
    .sort((a, b) => b.transferabilityScore - a.transferabilityScore)

  return crossIndustry.slice(0, 5)
}

/**
 * Stage 3 of Patent Specification:
 * Evaluates live active jobs on the board where raw keyword/domain gating
 * under-scores a high-transferability professional, computing exact role Bridge Deltas.
 */
export function evaluateLiveJobHorizonBridges(
  profile: any,
  jobs: any[],
  operationalRadar: OperationalAxisScore[]
): LiveJobHorizonBridge[] {
  const rawCandSkills = Array.isArray(profile?.structured_skills)
    ? profile.structured_skills.filter(
        (s: any) => s && typeof s === 'object' && !s._ss_candidate_prefs && !s._ss_pref_meta && (s.skill || s.name)
      )
    : []

  const candSkillNames = rawCandSkills.map((s: any) => String(s.skill || s.name).toLowerCase().trim())
  const candCorpus = `${candSkillNames.join(' ')} ${profile?.skills || ''} ${profile?.bio || ''} ${
    profile?.certifications || ''
  }`.toLowerCase()

  const avgOpScore =
    operationalRadar.reduce((sum, a) => sum + a.score, 0) / Math.max(1, operationalRadar.length)

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

    for (const req of visibleReqs) {
      const reqName = String(req.skill || req.name).trim()
      const reqLower = reqName.toLowerCase()
      const tokens = reqLower.split(/[\s,/&-]+/).filter((t) => t.length >= 3)

      const isMatched =
        candCorpus.includes(reqLower) ||
        candSkillNames.some((cs: string) => cs.includes(reqLower) || reqLower.includes(cs)) ||
        (tokens.length > 0 && tokens.filter((t) => candCorpus.includes(t)).length >= Math.ceil(tokens.length * 0.6))

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

    // Estimate current strict TrueFit Score
    const currentTrueFitScore = clampScore(
      24 + matchRatio * 58 + (avgOpScore - 60) * 0.25,
      22,
      88
    )

    // Compute Horizon Operational Transferability for this role
    const jobIndustry = normalizeIndustryVertical(job.industry || metaItem.industry || '')
    const horizonTransferabilityScore = clampScore(
      avgOpScore * 0.72 + matchRatio * 24 + 14,
      64,
      95
    )

    // We want roles where Horizon Transferability is notably higher than raw keyword TrueFit
    // or where adding 1-3 bridge skills unlocks/elevates the role significantly
    if (missingReqs.length === 0 && currentTrueFitScore >= 82) continue

    const topMissing = missingReqs.slice(0, 3)
    const gapToBridge = Math.max(16, horizonTransferabilityScore - currentTrueFitScore)
    const perSkillLift = Math.max(
      6,
      Math.min(18, Math.round(gapToBridge / Math.max(1, topMissing.length)))
    )

    const bridgeDeltaSkills = topMissing.map((m, idx) => ({
      skill: m.skill,
      requiredLevel: m.requiredLevel,
      fitLiftPoints: idx === 0 ? perSkillLift + 2 : perSkillLift,
    }))

    const totalLift = bridgeDeltaSkills.reduce((acc, b) => acc + b.fitLiftPoints, 0)
    const projectedBridgedTrueFitScore = clampScore(
      currentTrueFitScore + totalLift,
      Math.max(currentTrueFitScore + 8, 68),
      96
    )

    // Format pay cleanly
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

    bridges.push({
      jobId: job.id,
      title: job.title,
      industry: jobIndustry,
      location: job.location || metaItem.location || 'Remote / Flexible',
      workModel: String(job.work_model || 'remote').toUpperCase(),
      formattedPay,
      currentTrueFitScore,
      horizonTransferabilityScore,
      projectedBridgedTrueFitScore,
      matchedCoreSkills,
      bridgeDeltaSkills,
      whyOperationalDnaFits: `Your ${topAxes[0]?.axis} (${topAxes[0]?.score}%) and ${topAxes[1]?.axis} (${topAxes[1]?.score}%) align at ${horizonTransferabilityScore}% operational compatibility with this ${jobIndustry} role. Adding ${
        bridgeDeltaSkills.map((b) => b.skill).join(' & ') || 'domain keywords'
      } bridges the vertical keyword filter from ${currentTrueFitScore}% to ${projectedBridgedTrueFitScore}%.`,
    })
  }

  return bridges
    .sort(
      (a, b) =>
        b.horizonTransferabilityScore -
        a.horizonTransferabilityScore +
        (b.projectedBridgedTrueFitScore - b.currentTrueFitScore) * 0.3
    )
    .slice(0, 6)
}

export function buildCompleteTrueHorizonAnalysis(
  profile: any,
  jobs: any[]
): TrueHorizonAnalysisResult {
  const operationalRadar = computeOperationalVector6D(profile)
  const topHorizonVerticals = projectCrossIndustryHorizons(profile, operationalRadar)
  const liveJobBridges = evaluateLiveJobHorizonBridges(profile, jobs, operationalRadar)

  const overallTransferabilityIndex = clampScore(
    topHorizonVerticals
      .slice(0, 3)
      .reduce((acc, v) => acc + v.transferabilityScore, 0) /
      Math.max(1, Math.min(3, topHorizonVerticals.length)),
    62,
    96
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


/**
 * Stage 4 of Patent Specification (Bilateral Employer Discovery):
 * Computes a fast deterministic 6D Operational Transferability score for an
 * anonymous candidate profile against an employer's target industry vertical.
 */
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
      overallDnaScore: clampScore(avgDna + 6, 58, 96),
      targetVerticalScore: clampScore(avgDna + 6, 58, 96),
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

  let weightedScore = avgDna + 5
  if (spec) {
    let sum = 0
    for (let i = 0; i < 6; i++) {
      sum += (radar[i]?.score || 60) * spec.weights[i]
    }
    weightedScore = sum + 5
  }

  const targetVerticalScore = clampScore(weightedScore, 54, 96)

  return {
    overallDnaScore: clampScore(avgDna + 6, 58, 96),
    targetVerticalScore,
    topSharedAxes,
    isAdjacentHorizonMatch: !isExactIndustry && targetVerticalScore >= 72,
  }
}
