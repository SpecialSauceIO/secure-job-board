export const CANDIDATE_EDUCATION_LEVELS = [
  'Practical Experience & Industry Certifications',
  'High School Equivalency (GED / HiSET)',
  'High School Diploma',
  'Undergraduate Coursework / Degree in Progress',
  'Associate Degree (AA / AS / AAS)',
  "Bachelor's Degree (BA / BS / BBA)",
  "Master's Degree / MBA (MA / MS / MBA)",
  'Doctorate / Terminal Degree (PhD / JD / MD)',
] as const

export const JOB_EDUCATION_REQUIREMENTS = [
  'No Degree Required (Skills & Experience First)',
  'High School Diploma or Equivalency (GED)',
  'Active Industry Certifications Required',
  'Associate Degree OR Equivalent Experience',
  "Bachelor's Degree OR Equivalent Practical Experience",
  "Bachelor's Degree Required (Strict)",
  "Master's / Advanced Degree Preferred or Required",
] as const

export function normalizeCandidateEducation(raw?: string | null): string {
  if (!raw || !raw.trim()) {
    return 'Practical Experience & Industry Certifications'
  }
  const v = raw.trim()
  const exact = CANDIDATE_EDUCATION_LEVELS.find(
    (item) => item.toLowerCase() === v.toLowerCase()
  )
  if (exact) return exact

  const lower = v.toLowerCase()
  if (
    lower.includes('phd') ||
    lower.includes('doctor') ||
    lower.includes('jd') ||
    lower.includes('md')
  ) {
    return 'Doctorate / Terminal Degree (PhD / JD / MD)'
  }
  if (
    lower.includes('master') ||
    lower.includes('mba') ||
    lower.includes('m.s') ||
    lower.includes('m.a')
  ) {
    return "Master's Degree / MBA (MA / MS / MBA)"
  }
  if (
    lower.includes('progress') ||
    lower.includes('pursuing') ||
    lower.includes('coursework') ||
    lower.includes('expected') ||
    lower.includes('some college')
  ) {
    return 'Undergraduate Coursework / Degree in Progress'
  }
  if (
    lower.includes('bachelor') ||
    lower.includes('b.s') ||
    lower.includes('b.a') ||
    lower.includes('bba') ||
    lower.includes('undergrad')
  ) {
    return "Bachelor's Degree (BA / BS / BBA)"
  }
  if (
    lower.includes('associate') ||
    lower.includes('a.a') ||
    lower.includes('a.s') ||
    lower.includes('aas')
  ) {
    return 'Associate Degree (AA / AS / AAS)'
  }
  if (
    lower === 'high school diploma / ged' ||
    lower.includes('high school diploma')
  ) {
    return 'High School Diploma'
  }
  if (
    lower.includes('ged') ||
    lower.includes('hiset') ||
    lower.includes('equivalency')
  ) {
    return 'High School Equivalency (GED / HiSET)'
  }
  if (lower.includes('high school') || lower.includes('secondary school')) {
    return 'High School Diploma'
  }

  return 'Practical Experience & Industry Certifications'
}

export function normalizeJobEducationReq(raw?: string | null): string {
  if (!raw || !raw.trim()) {
    return "Bachelor's Degree OR Equivalent Practical Experience"
  }
  const v = raw.trim()
  const exact = JOB_EDUCATION_REQUIREMENTS.find(
    (item) => item.toLowerCase() === v.toLowerCase()
  )
  if (exact) return exact

  const lower = v.toLowerCase()
  if (
    lower.includes('no degree') ||
    lower.includes('skills first') ||
    lower.includes('none')
  ) {
    return 'No Degree Required (Skills & Experience First)'
  }
  if (
    lower.includes('high school') ||
    lower.includes('ged') ||
    lower.includes('equivalency')
  ) {
    return 'High School Diploma or Equivalency (GED)'
  }
  if (
    lower.includes('master') ||
    lower.includes('mba') ||
    lower.includes('phd') ||
    lower.includes('advanced')
  ) {
    return "Master's / Advanced Degree Preferred or Required"
  }
  if (lower.includes('certif') || lower.includes('license')) {
    return 'Active Industry Certifications Required'
  }
  if (lower.includes('associate')) {
    return 'Associate Degree OR Equivalent Experience'
  }
  if (
    lower.includes('strict') ||
    (lower.includes('bachelor') &&
      !lower.includes('equivalent') &&
      !lower.includes('or experience'))
  ) {
    return "Bachelor's Degree Required (Strict)"
  }

  return "Bachelor's Degree OR Equivalent Practical Experience"
}
