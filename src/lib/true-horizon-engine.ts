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

export interface BridgeDeltaSkillSpec {
  skill: string
  recommendedLevel: 'Beginner' | 'Intermediate' | 'Expert'
  fitLiftPoints: number
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
  transferabilityScore: number
  currentDirectFitEstimate: number
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
  currentTrueFitScore: number
  horizonTransferabilityScore: number
  projectedBridgedTrueFitScore: number
  matchedCoreSkills: string[]
  bridgeDeltaSkills: {
    skill: string
    requiredLevel: string
    fitLiftPoints: number
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

interface VerticalArchetypeSpec {
  vertical: string
  weights: [number, number, number, number, number, number]
  roleArchetypes: string[]
  payBand: string
  translations: [string, string, string][]
  bridgeSkills: BridgeDeltaSkillSpec[]
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
      {
        skill: 'Prompt Engineering & LLM Evaluation',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 18,
        rationale: 'Translates existing QA and training rigor directly into AI model readiness.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Fast-Track Credential + Lab (1–2 Weeks)',
        estimatedTimeToBridge: '10–15 Hours (Self-Paced)',
        actionableSteps: [
          'Complete a structured LLM evaluation & prompt architecture course covering rubric grading, hallucination auditing, and JSON schema enforcement.',
          'Build a 1-page evaluation scorecard comparing outputs from two models (e.g., GPT-OSS vs. Claude) on a real support/knowledge task.',
        ],
        recommendedCredentialsOrResources: [
          'Anthropic Prompt Engineering Interactive Tutorial / Claude Enablement Track',
          'Microsoft & LinkedIn Career Essentials in Generative AI',
          'DeepLearning.AI: Evaluating and Debugging Generative AI',
        ],
        honestProfileFraming:
          'Frame as "LLM Output Evaluation & Prompt Guardrail Design" backed by your existing QA/rubric governance tenure.',
      },
      {
        skill: 'RAG Knowledge Architecture',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 14,
        rationale: 'Bridges enterprise documentation management into vector-grounded AI workflows.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Technical Sandbox Bridge (2–3 Weeks)',
        estimatedTimeToBridge: '15–20 Hours (Hands-On Lab)',
        actionableSteps: [
          'Learn how enterprise documentation is chunked, embedded, and retrieved in a Vector Database (e.g., Supabase pgvector or Pinecone).',
          'Audit a sample knowledge base for AI retrieval readiness (removing contradictory SOPs, adding structured metadata headers).',
        ],
        recommendedCredentialsOrResources: [
          'Supabase pgvector & RAG Architecture Documentation Lab',
          'DeepLearning.AI: Building and Evaluating Advanced RAG Applications',
        ],
        honestProfileFraming:
          'Frame as "AI-Ready Knowledge Architecture & RAG Corpus Governance" leveraging your enterprise content planning background.',
      },
      {
        skill: 'Python / API Workflow Automation',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 10,
        rationale: 'Connects systems troubleshooting to automated model evaluation pipelines.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Practical Scripting Bridge (2–4 Weeks)',
        estimatedTimeToBridge: '20 Hours (Project-Based)',
        actionableSteps: [
          'Write and run Python scripts that call REST APIs, parse JSON payloads, and export automated CSV/telemetry reports.',
          'Use AI-assisted coding workflows to automate batch data validation tasks.',
        ],
        recommendedCredentialsOrResources: [
          'Automate the Boring Stuff with Python (API & JSON Modules)',
          'Groq / OpenAI API Quickstart & Batch Evaluation Scripts',
        ],
        honestProfileFraming:
          'List at "Beginner / Intermediate (1–2 yrs)" specifically for API scripting and workflow automation.',
      },
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
      {
        skill: 'HIPAA / Healthcare Data Privacy Compliance',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 18,
        rationale: 'Unlocks regulated HealthTech operations roles using your existing security & PII discipline.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Fast-Track Certification Bridge (1–2 Weeks)',
        estimatedTimeToBridge: '8–12 Hours (Exam / Cert)',
        actionableSteps: [
          'Do NOT claim this without formal training—healthcare employers strictly audit HIPAA Privacy & Security Rule knowledge.',
          'Complete an accredited HIPAA Privacy & Security compliance certification covering PHI handling, Business Associate Agreements (BAAs), and breach triage.',
        ],
        recommendedCredentialsOrResources: [
          'HHS.gov Official HIPAA for Professionals Training Modules (Free)',
          'Certified HIPAA Privacy Security Expert (CHPSE) or Accountable HQ HIPAA Cert',
          'HITRUST CSF Foundations Self-Paced Course',
        ],
        honestProfileFraming:
          'Once certified, add "HIPAA Privacy & Security Rule Compliance (Certified)" alongside your existing PII/security governance experience.',
      },
      {
        skill: 'EHR / Digital Health Workflow Implementation',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 15,
        rationale: 'Translates enterprise SaaS onboarding into clinical software deployment.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Domain Equivalence + Interoperability Study (2–3 Weeks)',
        estimatedTimeToBridge: '15–25 Hours (Concept & Workflow Lab)',
        actionableSteps: [
          'You already own 80% of this skill via enterprise software rollouts; the 20% healthcare gap is understanding clinical data exchange (HL7 / FHIR) and provider intake workflows.',
          'Study HL7 FHIR interoperability fundamentals and how SaaS tools integrate with Epic/Oracle Cerner without claiming hands-on hospital bedside charting.',
        ],
        recommendedCredentialsOrResources: [
          'HL7® FHIR® Fundamentals Orientation (HL7 International / Coursera)',
          'HealthIT.gov Clinical Workflow & EHR Implementation Playbooks',
        ],
        honestProfileFraming:
          'Frame honestly as "Enterprise SaaS Rollout & Digital Health Workflow Enablement" rather than claiming years of hospital EHR administration.',
      },
      {
        skill: 'Healthcare Vendor & RevCycle Operations',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 10,
        rationale: 'Bridges BPO and billing operations into healthcare administration.',
        modality: 'industry_exposure_required',
        modalityLabel: '🏥 Direct Industry Exposure Required (Enter via Adjacent Role)',
        estimatedTimeToBridge: '3–6 Months On-the-Job (Or Entry via HealthTech Vendor Ops)',
        actionableSteps: [
          'WARNING: True Revenue Cycle Management (ICD-10/CPT coding, payer claims adjudication) requires direct healthcare billing exposure—do not add this to your profile purely from a weekend article.',
          'HOW TO BRIDGE: Target a Vendor Program Manager or Technical Support Lead role at a HealthTech SaaS company first, where your BPO/SLA governance carries the role while you gain payer/RevCycle exposure on the job.',
          'If you want foundational literacy before interviewing, review HFMA Certified Revenue Cycle Representative (CRCR) study materials.',
        ],
        recommendedCredentialsOrResources: [
          'HFMA Certified Revenue Cycle Representative (CRCR) Overview',
          'CMS.gov Medicare Learning Network (MLN) Billing & Claims Fundamentals',
        ],
        honestProfileFraming:
          'Keep your profile focused on "Vendor Program & Billing SLA Operations" until you complete CRCR or gain direct HealthTech vendor exposure.',
      },
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
      {
        skill: 'SaaS Product Operations & Agile Delivery',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 16,
        rationale: 'Maps operational cadence to recurring software release cycles.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Fast-Track Framework Bridge (1–2 Weeks)',
        estimatedTimeToBridge: '10–14 Hours',
        actionableSteps: [
          'Map your existing program planning and escalation review cadences to Agile sprint ceremonies, release readiness checklists, and feature adoption telemetry.',
          'Complete a Product Operations or Agile Program Management micro-credential.',
        ],
        recommendedCredentialsOrResources: [
          'Product School / Mind the Product: Product Operations Fundamentals',
          'Atlassian Agile with Jira & Release Governance Track',
        ],
        honestProfileFraming:
          'Frame as "SaaS Release Readiness & Cross-Functional Program Operations" tied to your existing Microsoft/enterprise program tenure.',
      },
      {
        skill: 'Enterprise Customer Onboarding & Retention',
        recommendedLevel: 'Expert',
        fitLiftPoints: 14,
        rationale: 'Converts support escalation mastery into proactive NRR expansion.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Direct Equivalence Translation (Immediate – 1 Week)',
        estimatedTimeToBridge: '4–6 Hours (Metric Reframing)',
        actionableSteps: [
          'You already have the operational mechanics from enterprise support coaching and onboarding.',
          'Translate your support metrics (CSAT, First-Contact Resolution, Time-to-Onboard) into SaaS Customer Success metrics (Time-to-Value, Net Dollar Retention, Churn Deflection).',
        ],
        recommendedCredentialsOrResources: [
          'SuccessHacker / Gainsight Customer Success Leadership Playbook',
        ],
        honestProfileFraming:
          'Safe to add immediately if you have led enterprise client onboarding, adoption workshops, or escalation retention.',
      },
      {
        skill: 'SQL / Telemetry Analytics',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 9,
        rationale: 'Links KPI reporting directly to product adoption telemetry.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Technical Sandbox Lab (1–2 Weeks)',
        estimatedTimeToBridge: '12 Hours (Hands-On SQL Queries)',
        actionableSteps: [
          'Practice writing SELECT, JOIN, GROUP BY, and cohort aggregation queries in your Supabase SQL Editor.',
        ],
        recommendedCredentialsOrResources: [
          'SQLBolt / Mode Analytics SQL Tutorial for Product & Ops Managers',
        ],
        honestProfileFraming:
          'Add at "Beginner / Intermediate" once you can comfortably query user adoption and funnel tables.',
      },
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
      {
        skill: 'IAM & Zero-Trust Access Governance',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 17,
        rationale: 'Extends system administration into enterprise security architecture.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Technical Equivalence + Security Lab (1–2 Weeks)',
        estimatedTimeToBridge: '12–16 Hours',
        actionableSteps: [
          'Connect your existing Microsoft 365 / Entra ID / Supabase RLS & role-based access experience to formal Zero-Trust IAM terminology (Least Privilege, RBAC, MFA enforcement).',
        ],
        recommendedCredentialsOrResources: [
          'Microsoft Certified: Security, Compliance, and Identity Fundamentals (SC-900)',
          'Okta / Microsoft Entra ID Zero-Trust Access Architecture Labs',
        ],
        honestProfileFraming:
          'Frame as "Identity & Access Governance (RBAC / MFA / Zero-Trust Controls)" grounded in your M365 and platform security work.',
      },
      {
        skill: 'NIST / SOC2 Compliance Frameworks',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 15,
        rationale: 'Formalizes operational SOP auditing into regulatory security controls.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Fast-Track GRC Certification (2–3 Weeks)',
        estimatedTimeToBridge: '15–20 Hours',
        actionableSteps: [
          'Study the 5 SOC2 Trust Services Criteria (Security, Availability, Processing Integrity, Confidentiality, Privacy) and NIST CSF 2.0 functions.',
          'Map how your existing audit logs, incident response playbooks, and vendor reviews satisfy SOC2 controls.',
        ],
        recommendedCredentialsOrResources: [
          'ISC2 Certified in Cybersecurity (CC) — Free Training & Exam Initiative',
          'NIST Cybersecurity Framework (CSF 2.0) Official Quick-Start Guide',
        ],
        honestProfileFraming:
          'Add once you complete ISC2 CC or SC-900 and can map operational SOPs to SOC2/NIST control families.',
      },
      {
        skill: 'Cloud Security Posture (AWS / Azure)',
        recommendedLevel: 'Beginner',
        fitLiftPoints: 11,
        rationale: 'Maps infrastructure support to cloud-native defense.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Cloud Security Foundational Cert (2–4 Weeks)',
        estimatedTimeToBridge: '20–25 Hours',
        actionableSteps: [
          'Complete Azure Fundamentals (AZ-900) or Security Fundamentals (SC-900) to validate cloud security posture concepts.',
        ],
        recommendedCredentialsOrResources: [
          'Microsoft Learn: SC-900 / AZ-900 Free Interactive Learning Paths',
          'CompTIA Security+ (SY0-701) Domain 3 & 4 Review',
        ],
        honestProfileFraming:
          'List at "Beginner / Intermediate" alongside your Microsoft enterprise support heritage.',
      },
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
      {
        skill: 'Vendor SLA & MSA Governance',
        recommendedLevel: 'Expert',
        fitLiftPoints: 16,
        rationale: 'Formalizes partner oversight into executive vendor program management.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Direct Experience Reframing (Immediate)',
        estimatedTimeToBridge: '2–4 Hours (Portfolio Alignment)',
        actionableSteps: [
          'If you have managed BPO/vendor teams (e.g., at Citi or Microsoft), ensure your profile explicitly names SLA penalty/reward structures, QBRs (Quarterly Business Reviews), and vendor scorecards.',
        ],
        recommendedCredentialsOrResources: [
          'COPC® Customer Experience Standard / Vendor Management Framework Overview',
        ],
        honestProfileFraming:
          'Safe to add immediately if you have overseen external vendor/BPO queues, SLAs, or partner enablement.',
      },
      {
        skill: 'Workforce Capacity & Deflection Modeling',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 14,
        rationale: 'Connects ticket volume tracking to unit-cost economics.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Operational Math Reframing (1 Week)',
        estimatedTimeToBridge: '6–8 Hours',
        actionableSteps: [
          'Review Erlang-C staffing basics, shrinkage calculation, and how knowledge base / AI self-service reduces cost-per-contact.',
        ],
        recommendedCredentialsOrResources: [
          'ICMI Workforce Management (WFM) & Contact Center Economics Guide',
        ],
        honestProfileFraming:
          'Frame as "Queue Capacity Planning & Self-Service Ticket Deflection" tied to your service desk leadership.',
      },
      {
        skill: 'AI Ticket Deflection & Copilot Rollout',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 11,
        rationale: 'Modernizes legacy support queues with automated triage.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Direct AI Enablement Synergy (Immediate)',
        estimatedTimeToBridge: 'Immediate (Already in Your Wheelhouse)',
        actionableSteps: [
          'Combine your AI Enablement background with support operations to show how agent-assist copilots reduce Average Handle Time (AHT).',
        ],
        recommendedCredentialsOrResources: [
          'Microsoft Copilot for Service / AI Contact Center Deployment Playbooks',
        ],
        honestProfileFraming:
          'High-integrity match for anyone combining technical support leadership with generative AI enablement.',
      },
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
      {
        skill: 'Third-Party Risk Management (TPRM)',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 17,
        rationale: 'Maps vendor program leadership directly to regulated financial standards.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Regulatory Framework Bridge (1–2 Weeks)',
        estimatedTimeToBridge: '10–14 Hours',
        actionableSteps: [
          'Review OCC / Federal Reserve Interagency Guidance on Third-Party Relationships (how banks audit vendor SLAs, business continuity, and data security).',
          'Connect your prior financial-sector vendor infrastructure experience directly to TPRM lifecycle terminology.',
        ],
        recommendedCredentialsOrResources: [
          'Shared Assessments CTPRP (Certified Third-Party Risk Professional) Study Guide',
          'OCC Bulletin 2023-17: Third-Party Relationships Risk Management',
        ],
        honestProfileFraming:
          'Frame as "Vendor Program Governance & Operational Risk Controls" leveraging enterprise/banking vendor ops.',
      },
      {
        skill: 'KYC / AML & Payment Operations Compliance',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 15,
        rationale: 'Connects identity verification workflows to FinTech regulatory gates.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 FinTech Compliance Micro-Credential (1–2 Weeks)',
        estimatedTimeToBridge: '10–12 Hours',
        actionableSteps: [
          'Combine your hands-on Stripe Identity / biometric verification & payment escrow implementation with formal KYC (Know Your Customer) and KYB (Know Your Business) compliance principles.',
        ],
        recommendedCredentialsOrResources: [
          'ACAMS AML / KYC Foundations Certificate',
          'Stripe Identity & Radar Fraud Prevention Architecture Docs',
        ],
        honestProfileFraming:
          'Frame as "Identity Verification (KYC/KYB) & Payment Fraud Prevention Workflows".',
      },
      {
        skill: 'Operational Risk & Audit Controls',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 10,
        rationale: 'Translates QA governance into banking examination readiness.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Audit Terminology Alignment (1 Week)',
        estimatedTimeToBridge: '6–8 Hours',
        actionableSteps: [
          'Map your QA scorecards, change-management logs, and incident post-mortems to RCSA (Risk and Control Self-Assessment) terminology.',
        ],
        recommendedCredentialsOrResources: [
          'ISACA Risk & Information Systems Control (CRISC) Domain Overview',
        ],
        honestProfileFraming:
          'Frame as "Operational QA, Change Control & Audit Readiness".',
      },
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
      {
        skill: '3PL & Supplier SLA Governance',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 16,
        rationale: 'Applies vendor management mechanics to physical distribution networks.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Vendor SLA Translation (1–2 Weeks)',
        estimatedTimeToBridge: '8–12 Hours',
        actionableSteps: [
          'Translate service-level vendor governance (fill rate, OTIF — On-Time In-Full, lead-time variance) from your IT/BPO vendor management and wholesale distribution experience.',
        ],
        recommendedCredentialsOrResources: [
          'ASCM (APICS) Supply Chain Procurement & Supplier Relationship Certificate',
        ],
        honestProfileFraming:
          'Frame as "Supplier SLA Governance & Fulfillment Exception Management".',
      },
      {
        skill: 'ERP / WMS Inventory Telemetry',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 14,
        rationale: 'Bridges technical database comfort into supply chain tracking systems.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Systems & ERP Bridge Course (2 Weeks)',
        estimatedTimeToBridge: '12–16 Hours',
        actionableSteps: [
          'Connect your automated inventory monitoring scripts and wholesale service-desk background (e.g., MORSCO) with modern ERP/WMS inventory ledger concepts.',
        ],
        recommendedCredentialsOrResources: [
          'Coursera / Rutgers Supply Chain Operations & ERP Systems Specialization',
        ],
        honestProfileFraming:
          'Frame as "Inventory Telemetry Automation & Enterprise Distribution Systems Support".',
      },
      {
        skill: 'Unit-Economics & Margin Optimization',
        recommendedLevel: 'Expert',
        fitLiftPoints: 12,
        rationale: 'Converts arbitrage pricing discipline into enterprise procurement savings.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Direct Commercial Equivalence (Immediate)',
        estimatedTimeToBridge: '3–5 Hours',
        actionableSteps: [
          'Document your landed-cost calculation, fee/shipping margin protection, and inventory turn velocity from e-commerce arbitrage in standard corporate unit-economics terms.',
        ],
        recommendedCredentialsOrResources: [
          'Corporate Finance Institute (CFI): Unit Economics & Margin Analysis',
        ],
        honestProfileFraming:
          'Safe to add immediately if you actively manage SKU sourcing, landed cost, and net margin targets.',
      },
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
      {
        skill: 'Marketplace Channel Management (eBay / Amazon / D2C)',
        recommendedLevel: 'Expert',
        fitLiftPoints: 18,
        rationale: 'Directly monetizes hands-on listing, sourcing, and conversion expertise.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Direct Hands-On Experience (Immediate)',
        estimatedTimeToBridge: 'Immediate (Portfolio Documentation)',
        actionableSteps: [
          'Translate your active e-commerce reselling & retail arbitrage operation into enterprise marketplace KPIs: sell-through rate, gross margin return on investment (GMROI), and defect-free fulfillment rate.',
        ],
        recommendedCredentialsOrResources: [
          'Marketplace Pulse / eBay Seller Hub Performance & Analytics Benchmarks',
        ],
        honestProfileFraming:
          'Add immediately if you actively run marketplace sourcing, listing optimization, and fulfillment.',
      },
      {
        skill: 'Inventory Turnover & GMV Analytics',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 14,
        rationale: 'Formalizes high-margin product selection into CPG merchandising metrics.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Merchandising Metric Translation (1 Week)',
        estimatedTimeToBridge: '5–8 Hours',
        actionableSteps: [
          'Structure your product acquisition and holding-period ROI tracking into formal GMV (Gross Merchandise Value), COGS, and inventory turn ratios.',
        ],
        recommendedCredentialsOrResources: [
          'Google Analytics 4 for E-Commerce & Merchandising Attribution',
        ],
        honestProfileFraming:
          'Frame as "SKU Margin Analysis, Sourcing & Inventory Velocity Management".',
      },
      {
        skill: 'Catalog Automation & Feed Operations',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 10,
        rationale: 'Combines scripting/data skills with large-scale SKU management.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Technical Scripting Bridge (1–2 Weeks)',
        estimatedTimeToBridge: '10 Hours',
        actionableSteps: [
          'Use your Python inventory-tracking scripts to demonstrate automated stock monitoring, price-drop alerts, and structured catalog hygiene.',
        ],
        recommendedCredentialsOrResources: [
          'Python REST API & Automated Inventory Feed Scripting',
        ],
        honestProfileFraming:
          'Frame as "Programmatic Inventory Monitoring & Catalog Operations".',
      },
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
      {
        skill: 'Instructional Design (ADDIE / SAM) & LMS Governance',
        recommendedLevel: 'Expert',
        fitLiftPoints: 18,
        rationale: 'Validates hands-on training creation for executive L&D roles.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Formal Framework Alignment (1–2 Weeks)',
        estimatedTimeToBridge: '8–12 Hours',
        actionableSteps: [
          'Map the technical training programs and onboarding bootcamps you built at Anthropic, Microsoft, and RadioShack into formal ADDIE (Analysis, Design, Development, Implementation, Evaluation) and SAM terminology.',
        ],
        recommendedCredentialsOrResources: [
          'ATD (Association for Talent Development) Instructional Design Foundations',
          'LinkedIn Learning: ADDIE & Agile Instructional Design (SAM) for Enterprise Enablement',
        ],
        honestProfileFraming:
          'Safe to add immediately given your extensive Technical Training & Enablement track record.',
      },
      {
        skill: 'Time-to-Productivity & Enablement OKRs',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 14,
        rationale: 'Links training programs directly to measurable business outcomes.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Direct OKR Certification Synergy (Immediate)',
        estimatedTimeToBridge: 'Immediate (Certified OKR Coach Synergy)',
        actionableSteps: [
          'Combine your Certified OKR Coach credential with your training metrics (ramp time reduction, ticket quality lift, certification pass rates).',
        ],
        recommendedCredentialsOrResources: [
          'Kirkpatrick Four Levels of Training Evaluation + OKR Alignment',
        ],
        honestProfileFraming:
          'Frame as "Enablement OKR Design & Time-to-Productivity Telemetry".',
      },
      {
        skill: 'AI-Assisted Curriculum Generation',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 10,
        rationale: 'Positions enablement leaders at the forefront of modern EdTech.',
        modality: 'sandbox_and_terminology',
        modalityLabel: '🔄 Direct AI Enablement Synergy (Immediate)',
        estimatedTimeToBridge: 'Immediate',
        actionableSteps: [
          'Showcase your programmatic video/voiceover pipelines and AI-assisted training workflows as modern EdTech production capabilities.',
        ],
        recommendedCredentialsOrResources: [
          'AI Enablement & Programmatic Multimodal Learning Production',
        ],
        honestProfileFraming:
          'Frame as "AI-Accelerated Curriculum & Multimodal Training Production".',
      },
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
      {
        skill: 'FedRAMP / NIST 800-171 / CMMC Compliance',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 19,
        rationale: 'Translates enterprise IT governance into federal contracting requirements.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 Federal Compliance Training Bridge (2–3 Weeks)',
        estimatedTimeToBridge: '12–18 Hours',
        actionableSteps: [
          'Complete a CMMC 2.0 / NIST SP 800-171 awareness course to understand Controlled Unclassified Information (CUI) handling and federal cloud security controls.',
        ],
        recommendedCredentialsOrResources: [
          'CDSE (Center for Development of Security Excellence) CUI & NIST 800-171 Free Courses (stepp.cdse.edu)',
          'FedRAMP Program Basics Official Training (fedramp.gov)',
        ],
        honestProfileFraming:
          'Add once you complete CDSE/FedRAMP training modules and map your security/SOP experience to NIST 800-171 domains.',
      },
      {
        skill: 'Earned Value Management (EVM) & GovCon Deliverables',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 14,
        rationale: 'Maps program planning to federal contract milestone tracking.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 GovCon Program Management Course (2 Weeks)',
        estimatedTimeToBridge: '10–15 Hours',
        actionableSteps: [
          'Learn how federal contractors track schedule variance (SV), cost variance (CV), and Contract Data Requirements Lists (CDRLs).',
        ],
        recommendedCredentialsOrResources: [
          'PMI / DAU (Defense Acquisition University) EVM & Contract Deliverables Overview',
        ],
        honestProfileFraming:
          'Frame as "Program Milestone Governance, OKRs & Deliverable Compliance".',
      },
      {
        skill: 'ITIL / Mission Service Delivery',
        recommendedLevel: 'Intermediate',
        fitLiftPoints: 10,
        rationale: 'Aligns enterprise service desk leadership with federal IT standards.',
        modality: 'credential_fast_track',
        modalityLabel: '🎓 ITIL v4 Certification Bridge (1–2 Weeks)',
        estimatedTimeToBridge: '10–14 Hours',
        actionableSteps: [
          'Your enterprise service desk and escalation leadership already follows ITIL mechanics (Incident, Problem, Change, and Release Management); formalizing ITIL v4 Foundation checks the strict GovCon box.',
        ],
        recommendedCredentialsOrResources: [
          'ITIL® 4 Foundation Certification / Dion Training ITIL Prep',
        ],
        honestProfileFraming:
          'Frame as "ITSM / ITIL Service Delivery & Escalation Governance".',
      },
    ],
  },
]

function clampScore(val: number, min = 18, max = 98): number {
  return Math.max(min, Math.min(max, Math.round(val)))
}

/**
 * Helper to classify any live job's missing skill into a concrete "How to Bridge" prescription
 */
function classifyLiveJobSkillBridge(
  skillName: string,
  requiredLevel: string,
  jobIndustry: string
): {
  modality: BridgeAcquisitionModality
  modalityLabel: string
  estimatedTimeToBridge: string
  howToBridgeSummary: string
  recommendedResource: string
} {
  const lower = skillName.toLowerCase()

  // Check if it matches any curated skill in VERTICAL_ARCHETYPE_MATRIX first
  for (const vert of VERTICAL_ARCHETYPE_MATRIX) {
    for (const bs of vert.bridgeSkills) {
      if (
        bs.skill.toLowerCase().includes(lower) ||
        lower.includes(bs.skill.toLowerCase().split(' ')[0])
      ) {
        return {
          modality: bs.modality,
          modalityLabel: bs.modalityLabel,
          estimatedTimeToBridge: bs.estimatedTimeToBridge,
          howToBridgeSummary: bs.actionableSteps[0] || bs.rationale,
          recommendedResource: bs.recommendedCredentialsOrResources[0] || 'Accredited Industry Micro-Credential',
        }
      }
    }
  }

  if (
    /hipaa|soc2|nist|iso|fedramp|cmmc|itil|pmp|scrum|agile|aws|azure|comptia|cert|compliance|gdpr|kyc|aml/i.test(
      lower
    )
  ) {
    return {
      modality: 'credential_fast_track',
      modalityLabel: '🎓 Fast-Track Certification Bridge (1–3 Weeks)',
      estimatedTimeToBridge: '10–18 Hours (Self-Paced Cert)',
      howToBridgeSummary: `Complete an accredited foundational course or certification in ${skillName} before adding it to your verified profile.`,
      recommendedResource: `Official ${skillName} Foundational Certification / Coursera / Microsoft Learn`,
    }
  }

  if (
    /clinical|bedside|nursing|surgical|cdl|licensed|bar exam|cpa|revcycle|medical coding|clearance|ts\/sci/i.test(
      lower
    )
  ) {
    return {
      modality: 'industry_exposure_required',
      modalityLabel: '🏥 Direct Industry Exposure or License Required',
      estimatedTimeToBridge: 'On-the-Job / Formal Licensing',
      howToBridgeSummary: `${skillName} requires direct ${jobIndustry.split(',')[0]} field exposure or licensing. Target adjacent operations/enablement roles in this sector first rather than claiming unverified tenure.`,
      recommendedResource: `Enter via Adjacent Operations / Enablement Role in ${jobIndustry.split(',')[0]}`,
    }
  }

  return {
    modality: 'sandbox_and_terminology',
    modalityLabel: '🔄 Guided Sandbox Lab + Terminology Bridge (1–2 Weeks)',
    estimatedTimeToBridge: '8–14 Hours (Hands-On Practice)',
    howToBridgeSummary: `Map your existing operational experience to ${skillName} workflows and complete a hands-on sandbox project to validate ${requiredLevel} readiness.`,
    recommendedResource: `Hands-On ${skillName} Sandbox Project + Industry Playbook`,
  }
}

export function computeOperationalVector6D(profile: any): OperationalAxisScore[] {
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

  const [sysHits, sysWords] = countMatches([
    /python|typescript|javascript|sql|next\.?js|supabase|api|automation|script/i,
    /cloud|azure|aws|office 365|m365|infrastructure|network|hardware|comptia/i,
    /ai|llm|genai|generative ai|prompt|model|telemetry|architecture|system/i,
    /troubleshooting|diagnostics|configuration|deployment|integration|saas/i,
  ])
  const sysScore = clampScore(38 + sysHits * 11 + maturityBonus * 0.8)

  const [procHits, procWords] = countMatches([
    /sla|sop|quality|qa|audit|compliance|governance|policy|standard/i,
    /okr|kpi|metric|calibration|verification|security|privacy|accessibility/i,
    /process|workflow|documentation|knowledge|framework|itil|iso/i,
    /accuracy|consistency|risk|control|tier|escalation/i,
  ])
  const procScore = clampScore(40 + procHits * 11 + maturityBonus * 0.85)

  const [triageHits, triageWords] = countMatches([
    /escalation|triage|incident|crisis|root[- ]cause|outage|critical/i,
    /support|service desk|help desk|tier 2|tier 3|resolution|troubleshooting/i,
    /high[- ]volume|fast[- ]paced|turnaround|backlog|bottleneck|recovery/i,
    /customer|client|retention|de-escalation|specialist|lead/i,
  ])
  const triageScore = clampScore(36 + triageHits * 11.5 + maturityBonus * 0.85)

  const [orchHits, orchWords] = countMatches([
    /vendor|bpo|partner|supplier|contract|procurement|outsourc/i,
    /program manager|project|planner|operations lead|supervisor|manager|director/i,
    /cross[- ]functional|stakeholder|global|schedule|capacity|budget|headcount/i,
    /onboarding|rollout|launch|coordination|governance|okr/i,
  ])
  const orchScore = clampScore(37 + orchHits * 11.5 + maturityBonus * 0.9)

  const [enabHits, enabWords] = countMatches([
    /training|enablement|coach|curriculum|instruction|learning|workshop/i,
    /content|knowledge|playbook|documentation|guide|communication/i,
    /adoption|readiness|mentoring|presentation|executive|facilitat/i,
    /ai enablement|certif|educat|onboarding/i,
  ])
  const enabScore = clampScore(35 + enabHits * 12 + maturityBonus * 0.85)

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

export function projectCrossIndustryHorizons(
  profile: any,
  operationalRadar: OperationalAxisScore[]
): HorizonVerticalProjection[] {
  const currentPrimary = normalizeIndustryVertical(profile?.industry_vertical || '')
  const scores = operationalRadar.map((a) => a.score)

  const projections: HorizonVerticalProjection[] = VERTICAL_ARCHETYPE_MATRIX.map((spec) => {
    const isCurrentPrimary =
      spec.vertical.toLowerCase() === currentPrimary.toLowerCase()

    let weightedSum = 0
    for (let i = 0; i < 6; i++) {
      weightedSum += (scores[i] || 60) * spec.weights[i]
    }

    const transferabilityScore = clampScore(weightedSum + 4, 52, 96)

    const currentDirectFitEstimate = isCurrentPrimary
      ? clampScore(transferabilityScore - 6, 65, 92)
      : clampScore(transferabilityScore * 0.46, 28, 49)

    const bridgeLift = spec.bridgeSkills.reduce((acc, b) => acc + b.fitLiftPoints, 0)
    const projectedBridgedFitScore = clampScore(
      Math.max(transferabilityScore, currentDirectFitEstimate + bridgeLift),
      74,
      96
    )

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
      terminologyTranslations: spec.translations.map(
        ([legacyTerm, targetVerticalTerm, operationalPrimitive]) => ({
          legacyTerm,
          targetVerticalTerm,
          operationalPrimitive,
        })
      ),
      bridgeDeltaSkills: spec.bridgeSkills,
      executiveSummary: `Your operational DNA in ${rankedAxes[0].name} (${rankedAxes[0].score}%) and ${rankedAxes[1].name} (${rankedAxes[1].score}%) transfers at ${transferabilityScore}% structural compatibility into ${spec.vertical}. Completing the ${spec.bridgeSkills[0].skill} bridge lifts your vertical TrueFit Score™ from ~${currentDirectFitEstimate}% to ${projectedBridgedFitScore}%.`,
    }
  })

  const crossIndustry = projections
    .filter((p) => !p.isCurrentPrimary)
    .sort((a, b) => b.transferabilityScore - a.transferabilityScore)

  return crossIndustry.slice(0, 5)
}

export function evaluateLiveJobHorizonBridges(
  profile: any,
  jobs: any[],
  operationalRadar: OperationalAxisScore[]
): LiveJobHorizonBridge[] {
  const rawCandSkills = Array.isArray(profile?.structured_skills)
    ? profile.structured_skills.filter(
        (s: any) =>
          s &&
          typeof s === 'object' &&
          !s._ss_candidate_prefs &&
          !s._ss_pref_meta &&
          (s.skill || s.name)
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

    const currentTrueFitScore = clampScore(
      24 + matchRatio * 58 + (avgOpScore - 60) * 0.25,
      22,
      88
    )

    const jobIndustry = normalizeIndustryVertical(job.industry || metaItem.industry || '')
    const horizonTransferabilityScore = clampScore(
      avgOpScore * 0.72 + matchRatio * 24 + 14,
      64,
      95
    )

    if (missingReqs.length === 0 && currentTrueFitScore >= 82) continue

    const topMissing = missingReqs.slice(0, 3)
    const gapToBridge = Math.max(16, horizonTransferabilityScore - currentTrueFitScore)
    const perSkillLift = Math.max(
      6,
      Math.min(18, Math.round(gapToBridge / Math.max(1, topMissing.length)))
    )

    const bridgeDeltaSkills = topMissing.map((m, idx) => {
      const bridgeMeta = classifyLiveJobSkillBridge(m.skill, m.requiredLevel, jobIndustry)
      return {
        skill: m.skill,
        requiredLevel: m.requiredLevel,
        fitLiftPoints: idx === 0 ? perSkillLift + 2 : perSkillLift,
        ...bridgeMeta,
      }
    })

    const totalLift = bridgeDeltaSkills.reduce((acc, b) => acc + b.fitLiftPoints, 0)
    const projectedBridgedTrueFitScore = clampScore(
      currentTrueFitScore + totalLift,
      Math.max(currentTrueFitScore + 8, 68),
      96
    )

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
      whyOperationalDnaFits: `Your ${topAxes[0]?.axis} (${topAxes[0]?.score}%) and ${topAxes[1]?.axis} (${topAxes[1]?.score}%) align at ${horizonTransferabilityScore}% operational compatibility with this ${jobIndustry} role. Bridging ${
        bridgeDeltaSkills.map((b) => b.skill).join(' & ') || 'domain keywords'
      } elevates your vertical readiness from ${currentTrueFitScore}% to ${projectedBridgedTrueFitScore}%.`,
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
