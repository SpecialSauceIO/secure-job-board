export interface TrueFitBaselineResult {
  competencyScore: number
  tenureScore: number
  logisticsScore: number
  industryScore: number
  commScore: number
  reqMatchCount: number
  totalReqCount: number
  weightedCoverageFactor: number
  combinedSkillSignal: number
  exactIndustryMatch: boolean
  deterministicOverall: number
}

export function normalizeRadarSubjectLabel(raw: any): string {
  const s = String(raw || "").toLowerCase().trim()
  if (s.includes("competenc") || s.includes("core") || (s.includes("skill") && !s.includes("tenure"))) return "Core Competencies"
  if (s.includes("tenure") || s.includes("experience") || s.includes("depth")) return "Skill Tenure"
  if (s.includes("logistic") || s.includes("pay") || s.includes("comp") || s.includes("location")) return "Logistics & Pay"
  if (s.includes("industry") || s.includes("cred") || s.includes("cert") || s.includes("educat")) return "Industry & Creds"
  if (s.includes("exec") || s.includes("comm") || s.includes("leader")) return "Execution & Comm."
  return String(raw || "").trim()
}

export function stemToken(word: string): string {
  const w = word.toLowerCase().replace(/[^a-z0-9+#_]/g, "")
  if (w.startsWith("phrase_") || w.length <= 3) return w
  return w
    .replace(/(?:ing|tion|sion|ment|ness|able|ible|ship|ries|ry|ies|es|ed|er|or|al|ic|ly|s)$/, "")
    .slice(0, 8)
}

const CANONICAL_PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\b(?:program\s+manag(?:ement|er)|pgmp|portfolio\s+manag(?:ement|er))\b/g, "phrase_program_mgmt"],
  [/\b(?:project\s+manag(?:ement|er)|pmp|prince2|technical\s+project\s+manag(?:ement|er))\b/g, "phrase_project_mgmt"],
  [/\b(?:product\s+manag(?:ement|er)|product\s+owner|cspo)\b/g, "phrase_product_mgmt"],
  [/\b(?:change\s+manag(?:ement|er)|prosci|adkar)\b/g, "phrase_change_mgmt"],
  [/\b(?:account\s+manag(?:ement|er)|client\s+success|customer\s+success)\b/g, "phrase_account_mgmt"],
  [/\b(?:sales\s+operations|revenue\s+operations|revops)\b/g, "phrase_rev_ops"],
  [/\b(?:people\s+operations|human\s+resources|hris)\b/g, "phrase_people_ops"],
  [/\b(?:security\s+operations|secops|soc\s+analyst)\b/g, "phrase_sec_ops"],
  [/\b(?:devops|site\s+reliability|sre|platform\s+engineering)\b/g, "phrase_devops"],
  [/\b(?:microsoft\s*365|office\s*365|m365|o365)\b/g, "m365"],
  [/\b(?:amazon\s+web\s+services|aws)\b/g, "aws"],
  [/\b(?:google\s+cloud(?:\s+platform)?|gcp)\b/g, "gcp"],
  [/\b(?:microsoft\s+azure|azure)\b/g, "azure"],
  [/\b(?:kubernetes|k8s)\b/g, "kubernetes"],
  [/\b(?:ci\s*\/\s*cd|continuous\s+integration|continuous\s+delivery)\b/g, "cicd"],
  [/\b(?:generative\s+ai|gen\s+ai|genai)\b/g, "genai"],
  [/\b(?:machine\s+learning|ml\s+engineering)\b/g, "machinelearning"],
  [/\b(?:large\s+language\s+models?|llms?)\b/g, "llm"],
  [/\b(?:learning\s+management\s+systems?|lms)\b/g, "lms"],
  [/\b(?:standard\s+operating\s+procedures?|sops?)\b/g, "sop"],
  [/\b(?:objectives\s+and\s+key\s+results|okrs?)\b/g, "okr"],
  [/\b(?:go\s*-?\s*to\s*-?\s*market|gtm)\b/g, "gtm"],
  [/\b(?:tier\s*3\s+support|escalation\s+engineering|l3\s+support)\b/g, "phrase_tier3_support"],
  [/\b(?:service\s+desk|help\s+desk|it\s+support|technical\s+support)\b/g, "servicedesk"],
  [/\b(?:design\s+systems?)\b/g, "phrase_design_systems"],
  [/\b(?:supply\s+chain)\b/g, "supplychain"],
  [/\b(?:next\.?js)\b/g, "nextjs"],
  [/\b(?:node\.?js)\b/g, "nodejs"],
  [/\b(?:react\.?js|reactjs)\b/g, "react"],
  [/\b(?:vue\.?js|vuejs)\b/g, "vuejs"],
  [/\b(?:postgres|postgresql)\b/g, "postgresql"],
  [/\b(?:iac|infrastructure\s+as\s+code)\b/g, "terraform"],
]

const DIRECTIONAL_PHRASE_ADJACENCY: Array<{ have: string; need: string; score: number; tenureFactor: number }> = [
  { have: "phrase_program_mgmt", need: "phrase_project_mgmt", score: 0.88, tenureFactor: 0.90 },
  { have: "phrase_project_mgmt", need: "phrase_program_mgmt", score: 0.75, tenureFactor: 0.75 },
  { have: "phrase_product_mgmt", need: "phrase_program_mgmt", score: 0.62, tenureFactor: 0.60 },
  { have: "phrase_program_mgmt", need: "phrase_product_mgmt", score: 0.62, tenureFactor: 0.60 },
  { have: "phrase_product_mgmt", need: "phrase_project_mgmt", score: 0.62, tenureFactor: 0.60 },
  { have: "phrase_project_mgmt", need: "phrase_product_mgmt", score: 0.58, tenureFactor: 0.55 },
  { have: "phrase_program_mgmt", need: "phrase_change_mgmt", score: 0.76, tenureFactor: 0.75 },
  { have: "phrase_change_mgmt", need: "phrase_program_mgmt", score: 0.68, tenureFactor: 0.65 },
  { have: "phrase_tier3_support", need: "servicedesk", score: 0.90, tenureFactor: 0.95 },
  { have: "servicedesk", need: "phrase_tier3_support", score: 0.68, tenureFactor: 0.65 },
  { have: "aws", need: "azure", score: 0.58, tenureFactor: 0.55 },
  { have: "azure", need: "aws", score: 0.58, tenureFactor: 0.55 },
  { have: "aws", need: "gcp", score: 0.58, tenureFactor: 0.55 },
  { have: "gcp", need: "aws", score: 0.58, tenureFactor: 0.55 },
  { have: "azure", need: "m365", score: 0.68, tenureFactor: 0.65 },
  { have: "m365", need: "azure", score: 0.52, tenureFactor: 0.50 },
  { have: "react", need: "nextjs", score: 0.72, tenureFactor: 0.75 },
  { have: "nextjs", need: "react", score: 0.90, tenureFactor: 0.90 },
  { have: "typescript", need: "nodejs", score: 0.65, tenureFactor: 0.65 },
  { have: "javascript", need: "nodejs", score: 0.62, tenureFactor: 0.60 },
  { have: "nodejs", need: "typescript", score: 0.65, tenureFactor: 0.65 },
  { have: "nodejs", need: "javascript", score: 0.85, tenureFactor: 0.85 },
  { have: "postgresql", need: "sql", score: 0.90, tenureFactor: 0.90 },
  { have: "sql", need: "postgresql", score: 0.72, tenureFactor: 0.70 },
  { have: "postgresql", need: "mysql", score: 0.78, tenureFactor: 0.80 },
  { have: "mysql", need: "postgresql", score: 0.78, tenureFactor: 0.80 },
  { have: "kubernetes", need: "docker", score: 0.85, tenureFactor: 0.85 },
  { have: "docker", need: "kubernetes", score: 0.58, tenureFactor: 0.55 },
]

export const DOMAIN_SYNONYM_GROUPS: string[][] = [
  ["lms", "learning", "training", "curriculum", "instructional", "enablement", "onboarding", "courseware", "pedagogy", "facilitation"],
  ["knowledge", "playbook", "documentation", "wiki", "sop", "governance"],
  ["escalation", "troubleshooting", "incident", "servicedesk", "csat", "phrase_tier3_support"],
  ["ai", "llm", "genai", "prompt", "copilot", "claude", "openai", "gemini", "machinelearning"],
  ["sales", "meddic", "pipeline", "revenue", "closing", "crm", "salesforce", "quota", "b2b", "phrase_rev_ops"],
  ["agile", "scrum", "kanban", "sprint", "jira"],
  ["supplychain", "warehouse", "3pl", "distribution", "freight", "procurement", "sap"],
  ["construction", "procore", "primavera", "subcontractor", "osha", "estimating"],
  ["culinary", "baker", "baking", "pastry", "sourdough", "fermentation", "dough", "oven", "servsafe", "foodservice", "kitchen"],
  ["legal", "paralegal", "redline", "gdpr", "ccpa", "litigation", "ironclad"],
]

const STOP_WORDS = new Set([
  "and", "the", "for", "with", "from", "that", "this", "into", "over", "across",
  "high", "full", "role", "work", "team", "year", "years", "experience", "using",
  "level", "senior", "junior", "lead", "manager", "specialist", "general", "daily",
  "ability", "strong", "proven", "manage", "managing", "management", "operations",
  "production", "quality", "schedule", "process", "system", "systems", "support",
])

export function canonicalizeSkillText(raw: string): string {
  let s = String(raw || "").toLowerCase().trim()
  for (const [pattern, replacement] of CANONICAL_PHRASE_REPLACEMENTS) {
    s = s.replace(pattern, replacement)
  }
  s = s.replace(/\bjs\b/g, "javascript").replace(/\bts\b/g, "typescript")
  return s
}

export function tokenizeSkillText(raw: string): string[] {
  const canon = canonicalizeSkillText(raw)
  return canon
    .split(/[^a-z0-9+#_]+/)
    .filter((w) => (w.startsWith("phrase_") || w.length >= 3 || w === "ai") && !STOP_WORDS.has(w))
}

export function expandTokenWithSynonyms(token: string): string[] {
  const t = token.toLowerCase().trim()
  if (t.length < 3 && t !== "ai") return [t]
  const s = stemToken(t)
  const expanded = new Set<string>([t, s])
  for (const group of DOMAIN_SYNONYM_GROUPS) {
    if (group.some((g) => g === t || (s.length >= 4 && stemToken(g) === s))) {
      for (const g of group) {
        expanded.add(g)
        expanded.add(stemToken(g))
      }
    }
  }
  return Array.from(expanded)
}

function lookupDirectionalAdjacency(candTokens: Iterable<string>, reqToken: string): { score: number; tenureFactor: number } | null {
  let best: { score: number; tenureFactor: number } | null = null
  for (const ct of candTokens) {
    for (const edge of DIRECTIONAL_PHRASE_ADJACENCY) {
      if (edge.have === ct && edge.need === reqToken) {
        if (!best || edge.score > best.score) best = { score: edge.score, tenureFactor: edge.tenureFactor }
      }
    }
  }
  return best
}

const CERT_VENDOR_FAMILIES: RegExp[] = [
  /\baws\s+certified\b/,
  /\b(?:microsoft\s+certified|az-\d+|ms-\d+)\b/,
  /\b(?:google\s+cloud\s+certified|professional\s+cloud)\b/,
  /\b(?:pmp|pgmp|capm|pmi)\b/,
  /\b(?:comptia|security\+|network\+|a\+)\b/,
  /\b(?:cissp|cism|cisa|sec\+)\b/,
  /\b(?:csm|cspo|psm|safe\s+agilist)\b/,
]

export function evaluateCertificationMatch(
  candCertsLower: string,
  candFullCorpusLower: string,
  reqCertsRaw: string
): { matchedCount: number; totalRequired: number } {
  const reqItems = String(reqCertsRaw || "")
    .split(/[,;/|\n]+/)
    .map((x) => x.trim().toLowerCase())
    .filter((x) => x && x !== "none" && x !== "none specified" && x !== "n/a")
  if (reqItems.length === 0) return { matchedCount: 0, totalRequired: 0 }
  let matched = 0
  const rawCandCombined = (candCertsLower + " " + candFullCorpusLower).toLowerCase()
  const combinedCand = canonicalizeSkillText(rawCandCombined)
  for (const reqItem of reqItems) {
    const canonReq = canonicalizeSkillText(reqItem)
    const reqTokens = canonReq.split(/[^a-z0-9+#_]+/).filter((w) => w.length >= 2)
    if (combinedCand.includes(canonReq) || (reqTokens.length > 0 && reqTokens.every((rt) => combinedCand.includes(rt)))) {
      matched += 1.0
    } else if (CERT_VENDOR_FAMILIES.some((rx) => rx.test(reqItem) && rx.test(rawCandCombined))) {
      matched += 0.75
    }
  }
  return { matchedCount: matched, totalRequired: reqItems.length }
}

function resolveReqWeightAndTargetYears(levelRaw: string, explicitYears: number, roleTargetYears: number): { weight: number; reqTargetYears: number; isExpert: boolean } {
  const lv = String(levelRaw || "intermediate").toLowerCase().trim()
  if (lv.includes("expert") || lv.includes("advanced") || lv.includes("lead") || lv.includes("principal")) {
    return { weight: 2.0, reqTargetYears: explicitYears > 0 ? explicitYears : Math.max(roleTargetYears, 6.0), isExpert: true }
  }
  if (lv.includes("begin") || lv.includes("entry") || lv.includes("basic") || lv.includes("foundat") || lv.includes("junior")) {
    return { weight: 1.0, reqTargetYears: explicitYears > 0 ? explicitYears : 1.5, isExpert: false }
  }
  return { weight: 1.5, reqTargetYears: explicitYears > 0 ? explicitYears : Math.min(roleTargetYears, 3.5), isExpert: false }
}

export function computeMultiVariablePillarBaseline(rawProfile: any, rawJob: any): TrueFitBaselineResult {
  const prefMeta = Array.isArray(rawProfile?.structured_skills)
    ? rawProfile.structured_skills.find((s: any) => s && typeof s === "object" && s._ss_pref_meta === true) || {}
    : {}
  const jobMeta = Array.isArray(rawJob?.structured_requirements)
    ? rawJob.structured_requirements.find((r: any) => r && typeof r === "object" && r._ss_job_meta === true) || {}
    : (rawJob?.job_meta || {})
  const profile = { ...prefMeta, ...rawProfile, industry_vertical: rawProfile?.industry_vertical || prefMeta?.industry_vertical, education_level: rawProfile?.education_level || prefMeta?.education_level, certifications: rawProfile?.certifications || prefMeta?.certifications, availability_window: rawProfile?.availability_window || prefMeta?.availability_window, languages: rawProfile?.languages || prefMeta?.languages }
  const job = { ...jobMeta, ...rawJob, industry: rawJob?.industry || jobMeta?.industry, experience_level: rawJob?.experience_level || jobMeta?.experience_level, education_req: rawJob?.education_req || jobMeta?.education_req, required_certifications: rawJob?.required_certifications || jobMeta?.required_certifications, required_languages: rawJob?.required_languages || jobMeta?.required_languages, pay_type: rawJob?.pay_type || jobMeta?.pay_type }
  const expLevelRaw = String(job?.experience_level || job?.job_meta?.experience_level || "Senior (5-8 yrs)").toLowerCase()
  let roleTargetYears = 5.0
  if (expLevelRaw.includes("entry") || expLevelRaw.includes("0-2") || expLevelRaw.includes("0–2")) roleTargetYears = 1.5
  else if (expLevelRaw.includes("mid") || expLevelRaw.includes("3-5") || expLevelRaw.includes("3–5")) roleTargetYears = 3.5
  else if (expLevelRaw.includes("senior") || expLevelRaw.includes("5-8") || expLevelRaw.includes("5–8")) roleTargetYears = 6.0
  else if (expLevelRaw.includes("lead") || expLevelRaw.includes("staff") || expLevelRaw.includes("8+")) roleTargetYears = 8.0
  else if (expLevelRaw.includes("executive") || expLevelRaw.includes("director")) roleTargetYears = 10.0

  const structuredSkills = Array.isArray(profile?.structured_skills)
    ? profile.structured_skills.filter((s: any) => !s?._ss_pref_meta && !s?._ss_meta && (s?.skill || s?.name))
    : []

  const candSkillEntries = structuredSkills.map((s: any) => {
    const rawName = String(s?.skill || s?.name || "").toLowerCase().trim()
    const canonName = canonicalizeSkillText(rawName)
    const tokens = tokenizeSkillText(rawName)
    return {
      name: rawName,
      canonName,
      tokens,
      stems: tokens.map(stemToken),
      years: Math.max(1, Number(s?.years) || Number(profile?.experience_years) || 2),
    }
  })

  if (candSkillEntries.length === 0 && profile?.skills) {
    String(profile.skills)
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean)
      .forEach((name: string) => {
        const lower = name.toLowerCase()
        const tokens = tokenizeSkillText(lower)
        candSkillEntries.push({
          name: lower,
          canonName: canonicalizeSkillText(lower),
          tokens,
          stems: tokens.map(stemToken),
          years: Math.max(1, Number(profile?.experience_years) || 3),
        })
      })
  }

  const candBio = String(profile?.bio || "").toLowerCase()
  const candCerts = String(profile?.certifications || "").toLowerCase()
  const candFullCorpus = [...candSkillEntries.map((e: any) => e.name), candBio, candCerts].join(" ")
  const candTokens = new Set(tokenizeSkillText(candFullCorpus))
  const candStems = new Set(Array.from(candTokens).map(stemToken))

  const jobReqs: Array<{ name: string; level: string; years: number }> = Array.isArray(job?.structured_requirements)
    ? job.structured_requirements
        .filter((r: any) => !r?._ss_job_meta && !String(r?.skill || r?.name || "").startsWith("__SS_") && (r?.skill || r?.name))
        .map((r: any) => ({
          name: String(r?.skill || r?.name || "").toLowerCase().trim(),
          level: String(r?.level || "Intermediate"),
          years: Number(r?.years) || 0,
        }))
    : []

  const jobTitle = String(job?.title || "").toLowerCase()
  const jobDesc = String(job?.description || "").toLowerCase()

  const reqSpecs = jobReqs.length > 0
    ? jobReqs
    : [jobTitle, jobDesc].filter(Boolean).map((txt) => ({ name: txt, level: "Intermediate", years: 0 }))

  let totalReqCount = 0
  let totalReqWeight = 0
  let earnedWeightedUnits = 0
  let matchedWeightSum = 0
  let reqMatchCount = 0
  const matchedDepthEntries: Array<{ weight: number; depthRatio: number }> = []

  for (const spec of reqSpecs) {
    const reqCanon = canonicalizeSkillText(spec.name)
    const reqWords = tokenizeSkillText(spec.name)
    if (reqWords.length === 0) continue

    const { weight, reqTargetYears, isExpert } = resolveReqWeightAndTargetYears(spec.level, spec.years, roleTargetYears)
    totalReqCount += 1
    totalReqWeight += weight

    let bestSkillScore = 0
    let bestEffectiveYears = 0

    for (const ce of candSkillEntries) {
      if (ce.name === spec.name || (ce.canonName && ce.canonName === reqCanon)) {
        bestSkillScore = 1.0
        bestEffectiveYears = Math.max(bestEffectiveYears, ce.years)
        break
      }

      let wordHits = 0
      let tenureTransferSum = 0
      let matchedWordCount = 0
      for (const rw of reqWords) {
        const rwStem = stemToken(rw)
        const rwSyns = expandTokenWithSynonyms(rw)
        if (ce.tokens.includes(rw) || ce.stems.includes(rwStem)) {
          wordHits += 1.0
          tenureTransferSum += 1.0
          matchedWordCount += 1
        } else {
          const adj = lookupDirectionalAdjacency(ce.tokens, rw)
          if (adj) {
            wordHits += adj.score
            tenureTransferSum += adj.tenureFactor
            matchedWordCount += 1
          } else if (rwSyns.some((syn) => ce.tokens.includes(syn) || ce.stems.includes(syn))) {
            wordHits += 0.75
            tenureTransferSum += 0.80
            matchedWordCount += 1
          }
        }
      }

      const ratio = wordHits / reqWords.length
      const avgTransfer = matchedWordCount > 0 ? tenureTransferSum / matchedWordCount : 0.8
      const candidateEffectiveYears = Math.max(0.5, Number((ce.years * avgTransfer).toFixed(2)))
      if (ratio > bestSkillScore || (ratio === bestSkillScore && candidateEffectiveYears > bestEffectiveYears)) {
        bestSkillScore = ratio
        bestEffectiveYears = candidateEffectiveYears
      }
    }

    if (bestSkillScore < 0.5) {
      let corpusHits = 0
      for (const rw of reqWords) {
        const rwStem = stemToken(rw)
        const rwSyns = expandTokenWithSynonyms(rw)
        if (candTokens.has(rw) || candStems.has(rwStem)) {
          corpusHits += 0.75
        } else {
          const adj = lookupDirectionalAdjacency(candTokens, rw)
          if (adj) {
            corpusHits += Number((adj.score * 0.8).toFixed(2))
          } else if (rwSyns.some((syn) => candTokens.has(syn) || candStems.has(syn))) {
            corpusHits += 0.45
          }
        }
      }
      const corpusRatio = Math.min(0.85, corpusHits / reqWords.length)
      if (corpusRatio > bestSkillScore) {
        bestSkillScore = corpusRatio
        bestEffectiveYears = Math.min(4, Number(profile?.experience_years) || 2.5)
      }
    }

    let cappedReqScore = Math.min(1.0, bestSkillScore)
    if (isExpert && reqTargetYears >= 6 && cappedReqScore > 0.75 && bestEffectiveYears > 0 && bestEffectiveYears < reqTargetYears * 0.35) {
      cappedReqScore = 0.75
    }

    if (cappedReqScore >= 0.45) {
      earnedWeightedUnits += weight * cappedReqScore
      matchedWeightSum += weight * (cappedReqScore >= 0.85 ? 1.0 : cappedReqScore)
      reqMatchCount += 1
      if (bestEffectiveYears > 0) {
        const skillDepthRatio = Math.min(1.15, bestEffectiveYears / Math.max(1.0, reqTargetYears))
        matchedDepthEntries.push({ weight, depthRatio: skillDepthRatio })
      }
    } else if (cappedReqScore >= 0.25) {
      earnedWeightedUnits += weight * cappedReqScore * 0.5
    }
  }

  const reqRatio = totalReqWeight > 0 ? earnedWeightedUnits / totalReqWeight : 0
  const weightedCoverageFactor = totalReqWeight > 0 ? matchedWeightSum / totalReqWeight : 0

  const titleWords = tokenizeSkillText(jobTitle)
  let titleHits = 0
  for (const tw of titleWords) {
    const twStem = stemToken(tw)
    const syns = expandTokenWithSynonyms(tw)
    const adj = lookupDirectionalAdjacency(candTokens, tw)
    if (candTokens.has(tw) || candStems.has(twStem) || Boolean(adj) || syns.some((s) => candTokens.has(s) || candStems.has(s))) {
      titleHits += 1
    }
  }
  const titleRatio = titleWords.length > 0 ? titleHits / titleWords.length : 0

  const candInd = String(profile?.industry_vertical || "").toLowerCase().trim()
  const jobInd = String(job?.industry || job?.job_meta?.industry || "").toLowerCase().trim()
  const exactIndustryMatch = Boolean(candInd && jobInd) && (candInd === jobInd || candInd.includes(jobInd) || jobInd.includes(candInd))

  const combinedSkillSignal = totalReqCount > 0 ? reqRatio * 0.85 + titleRatio * 0.15 : titleRatio

  let competencyScore = Math.round(combinedSkillSignal * 94 + (exactIndustryMatch ? 5 : 0))
  if (reqMatchCount === 0 && combinedSkillSignal < 0.15) {
    competencyScore = Math.max(8, Math.min(18, Math.round(8 + combinedSkillSignal * 40)))
  }
  competencyScore = Math.max(8, Math.min(99, competencyScore))

  const totalCareerYears = Math.max(0, Number(profile?.experience_years) || 0)
  let tenureScore = 12
  if (reqMatchCount > 0 && matchedDepthEntries.length > 0) {
    const depthWeightTotal = matchedDepthEntries.reduce((acc, d) => acc + d.weight, 0)
    const weightedDepthRatio = depthWeightTotal > 0
      ? matchedDepthEntries.reduce((acc, d) => acc + d.weight * d.depthRatio, 0) / depthWeightTotal
      : 0
    const coverageFactor = totalReqWeight > 0 ? weightedCoverageFactor : 0.5
    const maturityBonus = Math.min(12, Math.round(Math.min(totalCareerYears, 12) * 1.0))
    tenureScore = Math.round(Math.min(98, weightedDepthRatio * 55 + coverageFactor * 33 + maturityBonus * coverageFactor))
  } else {
    tenureScore = Math.max(10, Math.min(20, 10 + (exactIndustryMatch ? 8 : 2)))
  }

  const jobWorkModel = String(job?.work_model || "remote").toLowerCase()
  const candWorkModel = String(profile?.preferred_work_model || "any").toLowerCase()
  const jobLoc = String(job?.location || "").toLowerCase()
  const candLoc = String(profile?.location || "").toLowerCase()
  const stateTokens = ["tx", "texas", "dfw", "dallas", "fort worth", "cleburne", "arlington", "ny", "new york", "fl", "miami", "il", "chicago", "co", "denver", "tn", "memphis", "ca", "wa"]
  const sameLocation = Boolean(candLoc && jobLoc) && (candLoc === jobLoc || stateTokens.some((st) => candLoc.includes(st) && jobLoc.includes(st)))

  let workModelPoints = 38
  if (jobWorkModel.includes("remote")) {
    workModelPoints = candWorkModel.includes("onsite") ? 38 : 48
  } else if (jobWorkModel.includes("hybrid")) {
    workModelPoints = sameLocation ? 46 : candWorkModel.includes("remote") ? 18 : 26
  } else {
    workModelPoints = sameLocation ? 46 : candWorkModel.includes("remote") ? 12 : 20
  }

  const candMinSal = Number(profile?.min_salary_expectation) || 0
  const rawJobMax = Number(job?.salary_max) || Number(job?.salary_min) || 0
  const isHourly = job?.pay_type === "hourly" || (rawJobMax > 0 && rawJobMax <= 500)
  const jobAnnualMax = isHourly ? rawJobMax * 2080 : rawJobMax

  let payPoints = 30
  if (candMinSal > 0 && jobAnnualMax > 0) {
    if (jobAnnualMax >= candMinSal) payPoints = 36
    else if (jobAnnualMax >= candMinSal * 0.85) payPoints = 24
    else payPoints = Math.max(6, Math.round((jobAnnualMax / candMinSal) * 22))
  } else {
    payPoints = 32
  }

  const availRaw = String(profile?.availability_window || "Standard (2 Weeks Notice)").toLowerCase()
  const availPoints = availRaw.includes("immediate") ? 15 : availRaw.includes("2 weeks") ? 14 : 11
  const logisticsScore = Math.max(20, Math.min(99, workModelPoints + payPoints + availPoints))

  let industryPoints = 8
  if (exactIndustryMatch) industryPoints = 52
  else if (combinedSkillSignal >= 0.5) industryPoints = 38
  else if (combinedSkillSignal >= 0.25) industryPoints = 22
  else industryPoints = 8

  const jobEdu = String(job?.education_req || job?.job_meta?.education_req || "Equivalent Practical Experience").toLowerCase()
  const candEdu = String(profile?.education_level || "Practical Experience & Industry Certifications").toLowerCase()
  let eduPoints = 22
  if (jobEdu.includes("strict")) {
    const hasDegree = candEdu.includes("bachelor") || candEdu.includes("master") || candEdu.includes("doctor") || candEdu.includes("associate")
    eduPoints = hasDegree ? 25 : 8
  } else {
    eduPoints = 23
  }
  if (!exactIndustryMatch && combinedSkillSignal < 0.2) eduPoints = Math.min(eduPoints, 8)

  const reqCertsRaw = String(job?.required_certifications || job?.job_meta?.required_certifications || "").trim()
  let certPoints = 10
  if (!reqCertsRaw || reqCertsRaw.toLowerCase() === "none" || reqCertsRaw.toLowerCase() === "none specified") {
    certPoints = exactIndustryMatch || combinedSkillSignal >= 0.4 ? 18 : 6
  } else {
    const certEval = evaluateCertificationMatch(candCerts, candFullCorpus, reqCertsRaw)
    certPoints = certEval.matchedCount > 0 && certEval.totalRequired > 0
      ? Math.round(10 + (certEval.matchedCount / certEval.totalRequired) * 10)
      : 4
  }
  const industryScore = Math.max(12, Math.min(98, industryPoints + eduPoints + certPoints))

  const candLangs = Array.isArray(profile?.languages) ? profile.languages : []
  const jobLangs = Array.isArray(job?.required_languages)
    ? job.required_languages
    : Array.isArray(job?.job_meta?.required_languages)
    ? job.job_meta.required_languages
    : []

  let langPoints = 40
  if (jobLangs.length > 0) {
    let matchedLangs = 0
    for (const jl of jobLangs) {
      const reqLangName = String(jl?.language || "english").toLowerCase().trim()
      const foundLang = candLangs.find((cl: any) => String(cl?.language || "").toLowerCase().trim() === reqLangName)
      if (foundLang || reqLangName === "english") matchedLangs += 1
    }
    langPoints = Math.round((matchedLangs / jobLangs.length) * 45)
  }

  const hasMetrics = /\d+%|\d{3,}/.test(candBio)
  const hasLeadership = /lead|manager|director|architect|global|enterprise|strategy|cross-functional|onboarding/.test(candBio)
  const roleExecPoints = Math.round(
    ((hasMetrics ? 16 : 8) + (hasLeadership ? 16 : 8)) * Math.max(0.25, combinedSkillSignal) +
      Math.min(20, Math.round(combinedSkillSignal * 20))
  )
  const commScore = Math.max(25, Math.min(97, langPoints + roleExecPoints))

  const isZero = reqMatchCount === 0 && combinedSkillSignal < 0.18
  let detOverall = Math.round(
    competencyScore * 0.50 + tenureScore * 0.25 + industryScore * 0.15 + logisticsScore * 0.05 + commScore * 0.05
  )
  if (isZero) detOverall = Math.min(detOverall, competencyScore + 4, 20)
  else if (competencyScore < 48) detOverall = Math.min(detOverall, competencyScore + 6, 46)
  else if (competencyScore < 62) detOverall = Math.min(detOverall, competencyScore + 10)
  detOverall = Math.max(8, Math.min(99, detOverall))

  return {
    competencyScore,
    tenureScore,
    logisticsScore,
    industryScore,
    commScore,
    reqMatchCount,
    totalReqCount,
    weightedCoverageFactor,
    combinedSkillSignal,
    exactIndustryMatch,
    deterministicOverall: detOverall,
  }
}

function calibrateBoundedPillar(baseScore: number, aiScore: number, maxDrop: number, maxLift: number, minValid: number, maxValid: number): number {
  const blended = Math.round(baseScore * 0.75 + aiScore * 0.25)
  const floorAllowed = aiScore <= baseScore - 12 ? baseScore - maxDrop : baseScore
  const ceilAllowed = baseScore + maxLift
  const clamped = Math.max(floorAllowed, Math.min(ceilAllowed, blended))
  return Math.max(minValid, Math.min(maxValid, clamped))
}

export function normalizeTrueFitScores(rawMatchData: any, profile?: any, job?: any) {
  const baseline = computeMultiVariablePillarBaseline(profile, job)
  let rawRadarList: Array<{ subject: string; score: number }> = []
  if (Array.isArray(rawMatchData?.radar_data)) {
    rawRadarList = rawMatchData.radar_data.map((item: any) => ({
      subject: normalizeRadarSubjectLabel(item?.subject),
      score: Math.max(0, Math.min(100, Math.round(Number(item?.score) || 0))),
    }))
  } else if (rawMatchData?.radar_data && typeof rawMatchData.radar_data === "object") {
    rawRadarList = Object.entries(rawMatchData.radar_data).map(([k, v]) => ({
      subject: normalizeRadarSubjectLabel(k),
      score: Math.max(0, Math.min(100, Math.round(Number(v) || 0))),
    }))
  }

  const findAiScore = (label: string, fallback: number) => {
    const found = rawRadarList.find((r) => r.subject === label)
    return found && Number(found.score) > 0 ? found.score : fallback
  }

  const rawAiCore = findAiScore("Core Competencies", baseline.competencyScore)
  const rawAiTenure = findAiScore("Skill Tenure", baseline.tenureScore)
  const rawAiLogistics = findAiScore("Logistics & Pay", baseline.logisticsScore)
  const rawAiIndustry = findAiScore("Industry & Creds", baseline.industryScore)
  const rawAiComm = findAiScore("Execution & Comm.", baseline.commScore)

  const isZeroSkillMismatch = baseline.reqMatchCount === 0 && baseline.combinedSkillSignal < 0.18
  const minCoreFloor = baseline.reqMatchCount > 0 ? Math.round(baseline.weightedCoverageFactor * 96) : 8
  const adjustedCoreFloor = rawAiCore <= baseline.competencyScore - 12 ? Math.max(8, minCoreFloor - 6) : minCoreFloor

  const coreScore = isZeroSkillMismatch
    ? Math.max(8, Math.min(rawAiCore, baseline.competencyScore, 16))
    : Math.max(adjustedCoreFloor, calibrateBoundedPillar(baseline.competencyScore, rawAiCore, 6, 15, 8, 99))

  const calibratedTenure = isZeroSkillMismatch
    ? Math.max(10, Math.min(rawAiTenure, baseline.tenureScore, 14))
    : calibrateBoundedPillar(baseline.tenureScore, rawAiTenure, 6, 15, 10, 98)

  const industryScore = isZeroSkillMismatch && !baseline.exactIndustryMatch
    ? Math.max(12, Math.min(rawAiIndustry, baseline.industryScore, 18))
    : calibrateBoundedPillar(baseline.industryScore, rawAiIndustry, 4, 15, 12, 98)

  const logisticsScore = calibrateBoundedPillar(baseline.logisticsScore, rawAiLogistics, 4, 15, 20, 99)

  const commScore = isZeroSkillMismatch
    ? Math.max(25, Math.min(rawAiComm, baseline.commScore, 35))
    : calibrateBoundedPillar(baseline.commScore, rawAiComm, 4, 15, 25, 97)

  const finalRadar = [
    { subject: "Core Competencies", score: coreScore },
    { subject: "Skill Tenure", score: calibratedTenure },
    { subject: "Logistics & Pay", score: logisticsScore },
    { subject: "Industry & Creds", score: industryScore },
    { subject: "Execution & Comm.", score: commScore },
  ]

  let weightedOverall = Math.round(
    coreScore * 0.50 +
    calibratedTenure * 0.25 +
    industryScore * 0.15 +
    logisticsScore * 0.05 +
    commScore * 0.05
  )

  if (isZeroSkillMismatch) {
    weightedOverall = Math.min(weightedOverall, coreScore + 4, 20)
  } else if (coreScore < 48) {
    weightedOverall = Math.min(weightedOverall, coreScore + 6, 46)
  } else if (coreScore < 62) {
    weightedOverall = Math.min(weightedOverall, coreScore + 10)
  }

  if (!isZeroSkillMismatch && baseline.deterministicOverall >= 40 && rawAiCore >= 35 && weightedOverall < 40) {
    weightedOverall = 40
  }

  const finalOverall = Math.max(8, Math.min(99, weightedOverall))
  return { baseline, finalRadar, coreScore, calibratedTenure, industryScore, logisticsScore, commScore, finalOverall, isZeroSkillMismatch }
}
