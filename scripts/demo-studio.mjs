#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import os from 'os'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
const envLines = fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
for (const line of envLines) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m && !process.env[m[1].trim()]) {
    process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '')
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const CANDIDATE_EMAIL = 'alex.mercer.demo@specialsauce.io'
const EMPLOYER_EMAIL = 'apex.hiring.demo@specialsauce.io'
const DEMO_PASSWORD = 'SpecialSauce-Demo-2026!'

/**
 * Generates a valid, standards-compliant single-page PDF file with clean,
 * uncompressed text streams so both PDF viewers and AI text parsers read it cleanly.
 */
function buildCleanPdfBuffer(title, subtitle, lines) {
  const esc = (str) =>
    String(str)
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')

  const streamParts = []
  streamParts.push('BT')
  streamParts.push('/F1 16 Tf')
  streamParts.push('50 745 Td')
  streamParts.push(`(${esc(title)}) Tj`)
  streamParts.push('/F1 11 Tf')
  streamParts.push('0 -20 Td')
  streamParts.push(`(${esc(subtitle)}) Tj`)
  streamParts.push('/F1 10 Tf')
  streamParts.push('0 -10 Td')

  for (const line of lines) {
    streamParts.push('0 -15 Td')
    streamParts.push(`(${esc(line)}) Tj`)
  }
  streamParts.push('ET')

  const contentStream = streamParts.join('\n')
  const objects = []

  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n')
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n'
  )
  objects.push(
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
  )
  objects.push(
    `5 0 obj\n<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}\nendstream\nendobj\n`
  )

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += obj
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let i = 1; i < offsets.length; i++) {
    pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n'
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  return Buffer.from(pdf, 'utf8')
}

function generateDesktopPdfs() {
  const desktopDir = path.join(os.homedir(), 'Desktop', 'SpecialSauce-Demo-Assets')
  fs.mkdirSync(desktopDir, { recursive: true })

  const resumeLines = [
    'Location: Dallas-Fort Worth Metroplex, TX (Open to Remote & Hybrid)',
    'Email: alex.mercer.demo@specialsauce.io | Phone: (214) 555-0194',
    'Experience: 9 Years in Cloud Infrastructure, Kubernetes & Zero-Trust Security',
    'Minimum Compensation Target: $145,000/yr | Preferred Work Model: Remote',
    '--------------------------------------------------------------------------------',
    'EXECUTIVE SUMMARY',
    'Senior Cloud Infrastructure Architect with 9 years of experience designing, automating,',
    'and securing multi-region AWS and Kubernetes production environments for enterprise SaaS.',
    '',
    'CORE TECHNICAL SKILLS',
    '- Cloud & Infrastructure: AWS, Kubernetes (EKS), Docker, Terraform, Linux, Microservices',
    '- Security & Compliance: Zero-Trust IAM, SOC 2 Type II, ISO 27001, Vault, OIDC, TLS',
    '- Programming & Automation: Python, Go, TypeScript, Bash, GitHub Actions CI/CD, Datadog',
    '',
    'LICENSES & CERTIFICATIONS',
    '- AWS Certified Solutions Architect - Professional (Verified Active)',
    '- Certified Kubernetes Administrator (CKA - Cloud Native Computing Foundation)',
    '- CompTIA Security+ CE',
    '',
    'WRITTEN & VERBAL LANGUAGE PROFICIENCY',
    '- English: Native / Bilingual Proficiency (C2 Written & Verbal)',
    '- Spanish: Professional Working Proficiency (B2)',
    '',
    'PROFESSIONAL EXPERIENCE',
    'Principal Cloud Systems Architect | Horizon Data Cloud (2022 - 2026)',
    '- Architected multi-region AWS EKS clusters supporting 99.995% uptime for 4M+ users.',
    '- Automated infrastructure provisioning using Terraform modules, cutting deploy times 65%.',
    '- Led Zero-Trust IAM & SOC 2 Type II technical compliance across 120+ microservices.',
    '',
    'Senior DevOps & Cloud Engineer | Nimbus Enterprise Systems (2018 - 2022)',
    '- Migrated legacy monoliths to containerized Kubernetes workloads on AWS.',
    '- Built automated observability and incident telemetry pipelines with Datadog & OpenTelemetry.',
    '',
    'EDUCATION',
    '- B.S. in Computer Science, University of Texas',
  ]

  const jdLines = [
    'Organization: Apex Cloud Systems (apexcloud.io) | Industry: Technology, Software & AI',
    'Location: Dallas-Fort Worth Metro, TX | Work Arrangement: Remote (US)',
    'Verified Compensation Band: $145,000 - $165,000 / year + Founding Equity',
    'Minimum Experience Required: 7+ Years',
    '--------------------------------------------------------------------------------',
    'ROLE OVERVIEW',
    'Apex Cloud Systems is seeking a Senior Cloud Infrastructure Architect to lead our core',
    'multi-region AWS and Kubernetes platform architecture and Zero-Trust security posture.',
    '',
    'REQUIRED TECHNICAL SKILLS',
    '- Deep expertise in AWS, Kubernetes (EKS), Terraform Infrastructure-as-Code, and Docker',
    '- Strong background in Zero-Trust IAM, SOC 2 Type II, ISO 27001, and cloud network security',
    '- Production fluency in Python, Go, or TypeScript automation and CI/CD pipelines',
    '',
    'REQUIRED LICENSES, DEGREES & CERTIFICATIONS',
    '- AWS Certified Solutions Architect (Associate or Professional) or CKA strongly preferred',
    '- B.S. in Computer Science, Engineering, or equivalent production architecture experience',
    '',
    'LANGUAGE FLUENCY REQUIREMENTS',
    '- English: Fluent / Native Written and Verbal Communication (C1/C2)',
    '',
    'COMPENSATION & BENEFITS',
    '- Base Salary Band: $145,000 to $165,000 per year (Transparent Upfront Band)',
    '- 100% Remote work model aligned with US Central / Dallas-Fort Worth Metro hours',
  ]

  const resumePath = path.join(desktopDir, 'Alex_Mercer_Resume_2026.pdf')
  const jdPath = path.join(desktopDir, 'Apex_Cloud_Senior_Architect_JD.pdf')

  fs.writeFileSync(
    resumePath,
    buildCleanPdfBuffer(
      'ALEX MERCER — SENIOR CLOUD ARCHITECT',
      'Verified Technical Profile | AWS Solutions Architect Pro & CKA',
      resumeLines
    )
  )

  fs.writeFileSync(
    jdPath,
    buildCleanPdfBuffer(
      'APEX CLOUD SYSTEMS — JOB DESCRIPTION',
      'Senior Cloud Infrastructure Architect ($145,000 - $165,000/yr • Remote)',
      jdLines
    )
  )

  console.log('✓ Created Desktop PDFs in:', desktopDir)
  console.log('  1)', resumePath)
  console.log('  2)', jdPath)
}

async function ensureAuthUser(email, fullName, role) {
  const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  })
  if (listErr) throw listErr

  let user = listData.users.find(
    (u) => (u.email || '').toLowerCase() === email.toLowerCase()
  )

  if (!user) {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    })
    if (createErr) throw createErr
    user = created.user
    console.log(`✓ Created Auth user: ${email} (${user.id})`)
  } else {
    await supabase.auth.admin.updateUserById(user.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    })
    console.log(`✓ Updated existing Auth user: ${email} (${user.id})`)
  }
  return user
}

async function seedAll() {
  generateDesktopPdfs()

  const candUser = await ensureAuthUser(CANDIDATE_EMAIL, 'Alex Mercer', 'candidate')
  const empUser = await ensureAuthUser(EMPLOYER_EMAIL, 'Jordan Vance (Apex Hiring Lead)', 'employer')

  // 1. Upsert Candidate Profile (Alex Mercer)
  const candidateStructuredSkills = [
    { name: 'AWS Cloud Architecture', category: 'Technical', years: 9, level: 'Expert' },
    { name: 'Kubernetes (EKS)', category: 'Technical', years: 7, level: 'Expert' },
    { name: 'Terraform IaC', category: 'Technical', years: 6, level: 'Expert' },
    { name: 'Zero-Trust IAM & SOC 2', category: 'Security', years: 6, level: 'Advanced' },
    { name: 'Python & Go Automation', category: 'Technical', years: 8, level: 'Advanced' },
    {
      _ss_pref_meta: true,
      industry: 'Technology, Software & AI',
      certifications: [
        'AWS Certified Solutions Architect - Professional',
        'Certified Kubernetes Administrator (CKA)',
        'CompTIA Security+',
      ],
      languages: [
        { language: 'English', written: 'Native / Bilingual (C2)', verbal: 'Native / Bilingual (C2)' },
        { language: 'Spanish', written: 'Professional Working (B2)', verbal: 'Professional Working (B2)' },
      ],
      compensation_type: 'annual',
      min_annual_salary: 145000,
      min_hourly_rate: 75,
      preferred_work_model: 'Remote',
      metro_area: 'Dallas-Fort Worth, TX',
      is_charter_member: true,
    },
  ]

  const { error: candProfErr } = await supabase.from('profiles').upsert({
    id: candUser.id,
    role: 'candidate',
    full_name: 'Alex Mercer',
    company_name: null,
    is_verified: true,
    identity_verified: true,
    is_discoverable: true,
    experience_years: 9,
    min_salary_expectation: 145000,
    preferred_work_model: 'Remote',
    location: 'Dallas-Fort Worth, TX',
    bio: 'Senior Cloud Infrastructure Architect with 9 years of experience designing multi-region AWS & Kubernetes platforms, Terraform automation, and Zero-Trust IAM security.',
    skills: [
      'AWS',
      'Kubernetes',
      'Terraform',
      'Zero-Trust IAM',
      'SOC 2',
      'Python',
      'Go',
      'Docker',
      'CI/CD',
    ],
    structured_skills: candidateStructuredSkills,
    resume_url: 'https://www.specialsauce.io/demo/Alex_Mercer_Resume_2026.pdf',
  })
  if (candProfErr) throw candProfErr
  console.log('✓ Upserted Candidate Profile: Alex Mercer')

  // 2. Upsert Employer Profile (Jordan Vance @ Apex Cloud Systems)
  const { error: empProfErr } = await supabase.from('profiles').upsert({
    id: empUser.id,
    role: 'employer',
    full_name: 'Jordan Vance',
    company_name: 'Apex Cloud Systems',
    is_verified: true,
    identity_verified: true,
    is_discoverable: false,
    location: 'Dallas-Fort Worth, TX',
    bio: 'VP of Infrastructure Engineering at Apex Cloud Systems.',
  })
  if (empProfErr) throw empProfErr
  console.log('✓ Upserted Employer Profile: Jordan Vance (Apex Cloud Systems)')

  // 3. Upsert Organization (Apex Cloud Systems)
  const { data: existingOrgs } = await supabase
    .from('organizations')
    .select('*')
    .eq('domain', 'apexcloud.io')

  let orgId = existingOrgs?.[0]?.id
  const orgPayload = {
    name: 'Apex Cloud Systems',
    domain: 'apexcloud.io',
    description:
      'Enterprise cloud infrastructure and Zero-Trust Kubernetes security platform serving Fortune 500 engineering teams across the United States.',
    verification_status: 'verified',
    subscription_tier: 'growth',
    subscription_status: 'active',
    connection_credits: 25,
    total_requests_sent: 4,
    total_requests_accepted: 3,
  }

  if (orgId) {
    const { error: orgUpdErr } = await supabase
      .from('organizations')
      .update(orgPayload)
      .eq('id', orgId)
    if (orgUpdErr) throw orgUpdErr
  } else {
    const { data: newOrg, error: orgInsErr } = await supabase
      .from('organizations')
      .insert(orgPayload)
      .select()
      .single()
    if (orgInsErr) throw orgInsErr
    orgId = newOrg.id
  }
  console.log('✓ Upserted Organization: Apex Cloud Systems (ID:', orgId, ')')

  // 4. Ensure Organization Member Link
  const { data: existingMem } = await supabase
    .from('organization_members')
    .select('*')
    .eq('organization_id', orgId)
    .eq('user_id', empUser.id)

  if (!existingMem || existingMem.length === 0) {
    await supabase.from('organization_members').insert({
      organization_id: orgId,
      user_id: empUser.id,
      role: 'owner',
    })
  }
  console.log('✓ Linked Employer User to Apex Cloud Systems as Owner')

  // 5. Clean old demo jobs for this employer & create 2 fresh showcase jobs
  await supabase.from('jobs').delete().eq('employer_id', empUser.id)

  const structuredReqs1 = {
    required_skills: ['AWS', 'Kubernetes', 'Terraform', 'Zero-Trust IAM', 'SOC 2', 'Python'],
    min_experience_years: 7,
    certifications: [
      'AWS Certified Solutions Architect - Professional',
      'Certified Kubernetes Administrator (CKA)',
    ],
    languages: [{ language: 'English', proficiency: 'Fluent / Native (C1/C2)' }],
    compensation_type: 'annual',
    metro_area: 'Dallas-Fort Worth, TX',
  }

  const { data: job1, error: job1Err } = await supabase
    .from('jobs')
    .insert({
      employer_id: empUser.id,
      organization_id: orgId,
      title: 'Senior Cloud Infrastructure Architect',
      industry: 'Technology, Software & AI',
      location: 'Dallas-Fort Worth, TX',
      work_model: 'Remote',
      salary_min: 145000,
      salary_max: 165000,
      is_active: true,
      ai_review_enabled: true,
      description:
        'Lead multi-region AWS and Kubernetes (EKS) architecture, Terraform automation, and Zero-Trust IAM security for Apex Cloud Systems. Upfront verified pay band: $145,000 - $165,000/yr + equity.',
      structured_requirements: structuredReqs1,
    })
    .select()
    .single()
  if (job1Err) throw job1Err

  const { data: job2, error: job2Err } = await supabase
    .from('jobs')
    .insert({
      employer_id: empUser.id,
      organization_id: orgId,
      title: 'Principal DevSecOps & Platform Engineer',
      industry: 'Technology, Software & AI',
      location: 'Austin, TX',
      work_model: 'Remote',
      salary_min: 150000,
      salary_max: 175000,
      is_active: true,
      ai_review_enabled: true,
      description:
        'Own container security, SOC 2 Type II automation, and Kubernetes platform reliability across our core cloud control plane. Upfront verified pay band: $150,000 - $175,000/yr.',
      structured_requirements: structuredReqs1,
    })
    .select()
    .single()
  if (job2Err) throw job2Err
  console.log('✓ Created 2 Active Verified Jobs for Apex Cloud Systems')

  // 6. Seed 2 Showcase Connections (1 Passive Employer Pitch + 1 Active Candidate Application)
  const nowIso = new Date().toISOString()
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const radarMatchData = {
    overall_score: 91,
    skills_score: 94,
    experience_score: 90,
    credentials_score: 100,
    language_score: 100,
    compensation_location_score: 88,
    summary:
      'Exceptional 91% 5-Point TrueFit Score™ match: Candidate holds active AWS Solutions Architect Pro & CKA credentials, 9 years of AWS/Kubernetes/Terraform leadership, C2 English fluency, and $145k target aligns cleanly with the $145k-$165k band.',
    messages: [
      {
        id: 'msg-demo-1',
        sender_role: 'employer',
        sender_name: 'Jordan Vance (Apex Cloud Systems)',
        text: 'Hi #SS-8492 — your 91% TrueFit Score™, AWS Solutions Architect Pro certification, and 9 years of Kubernetes/Terraform architecture experience stood out immediately. Our verified base band is $145,000–$165,000/yr (100% Remote). Would you be open to a quick chat this week?',
        created_at: fiveMinsAgo,
      },
      {
        id: 'msg-demo-2',
        sender_role: 'candidate',
        sender_name: 'Candidate #SS-8492',
        text: 'Thanks Jordan! The $145k–$165k band and remote architecture scope align with what I am looking for. Happy to unlock my Stage 2 Resume & Contact Vault so we can schedule.',
        created_at: nowIso,
      },
    ],
  }

  // Application 1: Active Stage 1 Mutual Chat (Ready for Stage 2 Unlock on camera!)
  await supabase.from('applications').insert({
    job_id: job1.id,
    candidate_id: candUser.id,
    status: 'accepted',
    initiated_by: 'employer',
    candidate_response: 'accepted',
    is_revealed: false,
    match_score: 91,
    employer_pitch:
      'Your 91% TrueFit Score™ and AWS Solutions Architect Pro + CKA credentials are an exact match for our Senior Cloud Infrastructure Architect role ($145k-$165k/yr Remote).',
    candidate_contact: 'Alex Mercer | alex.mercer.demo@specialsauce.io | (214) 555-0194',
    match_data: radarMatchData,
  })

  // Application 2: Fresh Incoming Employer Pitch (Pending Candidate Review on camera!)
  await supabase.from('applications').insert({
    job_id: job2.id,
    candidate_id: candUser.id,
    status: 'pending',
    initiated_by: 'employer',
    candidate_response: 'pending',
    is_revealed: false,
    match_score: 89,
    employer_pitch:
      'We saw your verified profile in the Passive Talent Directory (89% TrueFit Score™ match). Would love to connect regarding our Principal DevSecOps & Platform Engineer role ($150k-$175k/yr Remote).',
    candidate_contact: 'Alex Mercer | alex.mercer.demo@specialsauce.io | (214) 555-0194',
    match_data: {
      ...radarMatchData,
      overall_score: 89,
      messages: [],
    },
  })

  console.log('✓ Seeded Active Stage 1 Thread + Pending Employer Pitch')
  console.log('\n=============================================================')
  console.log('🎬 DEMO ENVIRONMENT READY FOR RECORDING!')
  console.log('=============================================================')
  console.log('1. Candidate Login: ' + CANDIDATE_EMAIL)
  console.log('2. Employer Login:  ' + EMPLOYER_EMAIL)
  console.log('3. Shared Password: ' + DEMO_PASSWORD)
  console.log('4. Desktop PDFs:    ~/Desktop/SpecialSauce-Demo-Assets/')
  console.log('=============================================================')
}

async function toggleCandidateVerification(verified) {
  const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
  const user = listData.users.find((u) => (u.email || '').toLowerCase() === CANDIDATE_EMAIL)
  if (!user) throw new Error('Demo candidate not found. Run seed first.')
  await supabase
    .from('profiles')
    .update({ is_verified: verified, identity_verified: verified, is_discoverable: verified })
    .eq('id', user.id)
  console.log(`✓ Candidate (${CANDIDATE_EMAIL}) verification set to:`, verified)
}

async function toggleEmployerVerification(verified) {
  const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
  const user = listData.users.find((u) => (u.email || '').toLowerCase() === EMPLOYER_EMAIL)
  if (!user) throw new Error('Demo employer not found. Run seed first.')
  await supabase
    .from('profiles')
    .update({ is_verified: verified, identity_verified: verified })
    .eq('id', user.id)
  await supabase
    .from('organizations')
    .update({ verification_status: verified ? 'verified' : 'pending' })
    .eq('domain', 'apexcloud.io')
  console.log(`✓ Employer (${EMPLOYER_EMAIL}) & Apex Cloud Systems verification set to:`, verified)
}

async function resetStage1() {
  const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
  const user = listData.users.find((u) => (u.email || '').toLowerCase() === CANDIDATE_EMAIL)
  if (!user) throw new Error('Demo candidate not found. Run seed first.')
  await supabase
    .from('applications')
    .update({ is_revealed: false })
    .eq('candidate_id', user.id)
  console.log('✓ Reset all demo threads back to Stage 1 (Anonymous Vault Locked: is_revealed = false)')
}

const cmd = process.argv[2] || 'seed'
if (cmd === 'seed') {
  seedAll().catch(console.error)
} else if (cmd === 'unverify-candidate') {
  toggleCandidateVerification(false).catch(console.error)
} else if (cmd === 'verify-candidate') {
  toggleCandidateVerification(true).catch(console.error)
} else if (cmd === 'unverify-employer') {
  toggleEmployerVerification(false).catch(console.error)
} else if (cmd === 'verify-employer') {
  toggleEmployerVerification(true).catch(console.error)
} else if (cmd === 'reset-stage1') {
  resetStage1().catch(console.error)
} else {
  console.log('Usage: node scripts/demo-studio.mjs [seed|unverify-candidate|verify-candidate|unverify-employer|verify-employer|reset-stage1]')
}
