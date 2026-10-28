#!/usr/bin/env node
import fs from 'fs'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const envLines = fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
for (const line of envLines) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m && !process.env[m[1].trim()]) {
    process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '')
  }
}

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const BENCHMARK_ORG_DOMAIN = 'benchmark.specialsauce.io'
const BENCHMARK_EMPLOYER_EMAIL = 'sandbox.employer@specialsauce.test'

const VERTICAL_SEEDS = [
  {
    industry: 'Technology, Software & SaaS',
    roleTitle: 'Senior Full-Stack Engineer (Next.js / TypeScript)',
    workModel: 'remote',
    location: 'Remote — US Nationwide',
    payMin: 145000,
    payMax: 175000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'AWS Certified Developer',
    skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL'],
    desc: 'Sandbox Benchmark Role: Architect and ship high-reliability full-stack SaaS workflows using Next.js, TypeScript, and PostgreSQL with row-level security.',
    candA: { yrs: '7', minSal: 140000, model: 'remote', loc: 'Austin, TX', skills: [['TypeScript', 6], ['React', 7], ['Next.js', 5], ['Node.js', 6], ['PostgreSQL', 5]], bio: 'Full-stack software engineer specializing in multi-tenant SaaS architectures, TypeScript, and distributed cloud databases.' },
    candB: { yrs: '5', minSal: 125000, model: 'hybrid', loc: 'Dallas-Fort Worth-Arlington (DFW Metro), TX', skills: [['React', 5], ['TypeScript', 4], ['Node.js', 5], ['GraphQL', 4], ['AWS', 4]], bio: 'Product-focused web application developer with 5 years of experience delivering responsive React and Node.js platforms.' }
  },
  {
    industry: 'Artificial Intelligence, Data & Analytics',
    roleTitle: 'Lead AI & Machine Learning Data Engineer',
    workModel: 'remote',
    location: 'Remote — US Nationwide',
    payMin: 160000,
    payMax: 195000,
    expLevel: 'Lead / Staff / Principal (8+ yrs)',
    certs: 'AWS Certified Machine Learning',
    skills: ['Python', 'LLM Orchestration', 'PyTorch', 'SQL', 'Data Pipelines'],
    desc: 'Sandbox Benchmark Role: Design production LLM evaluation pipelines, semantic retrieval indexes, and real-time analytics models.',
    candA: { yrs: '8', minSal: 155000, model: 'remote', loc: 'San Francisco, CA', skills: [['Python', 8], ['LLM Orchestration', 3], ['PyTorch', 5], ['SQL', 8], ['Data Pipelines', 7]], bio: 'Principal data and AI engineer experienced in deploying low-latency RAG pipelines and multi-model evaluation frameworks.' },
    candB: { yrs: '4', minSal: 120000, model: 'remote', loc: 'Chicago, IL', skills: [['Python', 4], ['SQL', 4], ['Snowflake', 3], ['dbt', 3], ['Tableau', 4]], bio: 'Analytics engineer skilled in building governed data warehouses, ETL pipelines, and executive BI dashboards.' }
  },
  {
    industry: 'Cybersecurity & Cloud Infrastructure',
    roleTitle: 'Cloud Security & DevSecOps Architect',
    workModel: 'remote',
    location: 'Remote — US Nationwide',
    payMin: 150000,
    payMax: 185000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'CISSP, CompTIA Security+',
    skills: ['AWS Security', 'Terraform', 'Kubernetes', 'SIEM / SOC', 'Zero Trust IAM'],
    desc: 'Sandbox Benchmark Role: Harden multi-region cloud infrastructure, automate Terraform security guardrails, and lead SOC2/ISO compliance readiness.',
    candA: { yrs: '9', minSal: 150000, model: 'remote', loc: 'Reston, VA', skills: [['AWS Security', 7], ['Terraform', 6], ['Kubernetes', 5], ['SIEM / SOC', 8], ['Zero Trust IAM', 7]], bio: 'Cloud security architect with 9 years protecting enterprise cloud workloads, IAM policies, and zero-trust perimeters.' },
    candB: { yrs: '5', minSal: 118000, model: 'hybrid', loc: 'Atlanta, GA', skills: [['CompTIA Security+', 5], ['SIEM / SOC', 5], ['Incident Response', 4], ['AWS Security', 4], ['Linux', 5]], bio: 'Cybersecurity analyst and cloud defender experienced in threat hunting, vulnerability management, and SIEM automation.' }
  },
  {
    industry: 'IT Services, MSP & Technical Support',
    roleTitle: 'Enterprise Technical Support & Escalation Lead',
    workModel: 'hybrid',
    location: 'Dallas-Fort Worth-Arlington (DFW Metro), TX',
    payMin: 85000,
    payMax: 110000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'CompTIA A+, ITIL Foundation',
    skills: ['Tier 3 Escalations', 'Microsoft 365', 'Active Directory', 'ITSM / ServiceNow', 'Incident Management'],
    desc: 'Sandbox Benchmark Role: Lead Tier-3 enterprise technical escalations, mentor service desk engineers, and manage M365 and Azure identity incidents.',
    candA: { yrs: '8', minSal: 85000, model: 'hybrid', loc: 'Dallas-Fort Worth-Arlington (DFW Metro), TX', skills: [['Tier 3 Escalations', 7], ['Microsoft 365', 8], ['Active Directory', 8], ['ITSM / ServiceNow', 6], ['Incident Management', 7]], bio: 'Enterprise technical support lead with 8 years resolving complex M365, Azure AD, and infrastructure escalations.' },
    candB: { yrs: '4', minSal: 68000, model: 'remote', loc: 'Phoenix, AZ', skills: [['Microsoft 365', 4], ['Active Directory', 4], ['ITSM / ServiceNow', 4], ['Help Desk Operations', 4], ['Windows Administration', 4]], bio: 'Systems support specialist with a track record of 98% CSAT across enterprise IT service desk environments.' }
  },
  {
    industry: 'BPO, Contact Center & Customer Operations',
    roleTitle: 'Director of Contact Center & CX Operations',
    workModel: 'remote',
    location: 'Remote — US Nationwide',
    payMin: 110000,
    payMax: 138000,
    expLevel: 'Lead / Staff / Principal (8+ yrs)',
    certs: 'COPC, Six Sigma Green Belt',
    skills: ['Contact Center Operations', 'Workforce Management (WFM)', 'QA & CSAT Optimization', 'Zendesk / CCaaS', 'Vendor Management'],
    desc: 'Sandbox Benchmark Role: Oversee multi-channel US customer operations, optimize WFM SLA adherence, and drive CSAT and first-contact resolution.',
    candA: { yrs: '10', minSal: 110000, model: 'remote', loc: 'Tampa, FL', skills: [['Contact Center Operations', 10], ['Workforce Management (WFM)', 8], ['QA & CSAT Optimization', 9], ['Zendesk / CCaaS', 7], ['Vendor Management', 8]], bio: 'Customer operations leader experienced in scaling 200+ seat omnichannel support teams and SLA governance.' },
    candB: { yrs: '6', minSal: 82000, model: 'remote', loc: 'Charlotte, NC', skills: [['Contact Center Operations', 6], ['QA & CSAT Optimization', 5], ['Zendesk / CCaaS', 5], ['Team Coaching', 5], ['KPI Reporting', 5]], bio: 'Customer experience manager focused on quality assurance playbooks, agent enablement, and ticket deflection.' }
  },
  {
    industry: 'Finance, Banking, FinTech & Insurance',
    roleTitle: 'VP of Financial Risk & Treasury Operations',
    workModel: 'hybrid',
    location: 'New York, NY',
    payMin: 145000,
    payMax: 180000,
    expLevel: 'Lead / Staff / Principal (8+ yrs)',
    certs: 'CFA, FRM',
    skills: ['Financial Modeling', 'Credit & Liquidity Risk', 'Treasury Operations', 'Regulatory Compliance', 'SQL & Excel VBA'],
    desc: 'Sandbox Benchmark Role: Direct commercial portfolio risk modeling, liquidity stress testing, and regulatory compliance reporting.',
    candA: { yrs: '9', minSal: 145000, model: 'hybrid', loc: 'New York, NY', skills: [['Financial Modeling', 9], ['Credit & Liquidity Risk', 8], ['Treasury Operations', 7], ['Regulatory Compliance', 8], ['SQL & Excel VBA', 7]], bio: 'Vice President of Risk & Treasury with 9 years in institutional banking, liquidity management, and Basel III compliance.' },
    candB: { yrs: '5', minSal: 105000, model: 'remote', loc: 'Charlotte, NC', skills: [['Financial Modeling', 5], ['Credit & Liquidity Risk', 4], ['FP&A', 5], ['SQL & Excel VBA', 5], ['Risk Reporting', 4]], bio: 'Senior FinTech risk analyst specializing in payment underwriting, fraud analytics, and portfolio forecasting.' }
  },
  {
    industry: 'Accounting, Tax, Audit & Advisory',
    roleTitle: 'Senior Corporate Controller & Audit Lead (CPA)',
    workModel: 'hybrid',
    location: 'Chicago, IL',
    payMin: 120000,
    payMax: 150000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'CPA',
    skills: ['US GAAP & ASC 606', 'Month-End Close', 'Internal Audit & SOX', 'NetSuite ERP', 'Tax & Financial Reporting'],
    desc: 'Sandbox Benchmark Role: Lead consolidated month-end close, ASC 606 revenue recognition, SOX internal controls, and external audit readiness.',
    candA: { yrs: '8', minSal: 120000, model: 'hybrid', loc: 'Chicago, IL', skills: [['US GAAP & ASC 606', 8], ['Month-End Close', 8], ['Internal Audit & SOX', 7], ['NetSuite ERP', 6], ['Tax & Financial Reporting', 7]], bio: 'Licensed CPA and Corporate Controller with Big-4 audit foundations and 8 years managing multi-entity SaaS and manufacturing closes.' },
    candB: { yrs: '5', minSal: 95000, model: 'remote', loc: 'Dallas, TX', skills: [['US GAAP & ASC 606', 5], ['Month-End Close', 5], ['NetSuite ERP', 4], ['Audit Preparation', 5], ['Reconciliations', 5]], bio: 'Senior accountant experienced in multi-state tax compliance, general ledger governance, and ERP implementations.' }
  },
  {
    industry: 'Healthcare, Biotech, Pharma & Life Sciences',
    roleTitle: 'Clinical Operations & Nurse Care Manager (RN)',
    workModel: 'onsite',
    location: 'Houston, TX',
    payMin: 98000,
    payMax: 122000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'Registered Nurse (RN), BLS / ACLS',
    skills: ['Clinical Care Management', 'Epic EMR', 'HIPAA & Joint Commission', 'Patient Triage', 'Care Team Leadership'],
    desc: 'Sandbox Benchmark Role: Coordinate multidisciplinary inpatient care workflows, Epic EMR documentation quality, and clinical safety standards.',
    candA: { yrs: '8', minSal: 96000, model: 'onsite', loc: 'Houston, TX', skills: [['Clinical Care Management', 8], ['Epic EMR', 7], ['HIPAA & Joint Commission', 8], ['Patient Triage', 8], ['Care Team Leadership', 6]], bio: 'BSN, RN Clinical Care Manager with 8 years leading acute care nursing teams, quality audits, and patient care transitions.' },
    candB: { yrs: '5', minSal: 88000, model: 'hybrid', loc: 'Nashville, TN', skills: [['Clinical Care Management', 5], ['Epic EMR', 5], ['HIPAA & Joint Commission', 5], ['Clinical Trials', 4], ['Patient Education', 5]], bio: 'Registered Nurse and clinical research coordinator experienced in outpatient care protocols and regulatory compliance.' }
  },
  {
    industry: 'Hospitality, Food Service, Restaurants & Travel',
    roleTitle: 'Multi-Unit Culinary & Restaurant Operations Manager',
    workModel: 'onsite',
    location: 'Orlando, FL',
    payMin: 78000,
    payMax: 98000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'ServSafe Manager',
    skills: ['Multi-Unit P&L Management', 'Food & Labor Cost Control', 'Inventory & Vendor Sourcing', 'ServSafe & Health Compliance', 'Staff Training & Scheduling'],
    desc: 'Sandbox Benchmark Role: Direct front- and back-of-house hospitality operations, optimize food and labor cost margins, and lead team retention.',
    candA: { yrs: '9', minSal: 78000, model: 'onsite', loc: 'Orlando, FL', skills: [['Multi-Unit P&L Management', 7], ['Food & Labor Cost Control', 9], ['Inventory & Vendor Sourcing', 8], ['ServSafe & Health Compliance', 9], ['Staff Training & Scheduling', 8]], bio: 'Hospitality general manager with 9 years driving revenue growth and kitchen efficiency across high-volume restaurant groups.' },
    candB: { yrs: '5', minSal: 65000, model: 'onsite', loc: 'Las Vegas, NV', skills: [['Food & Labor Cost Control', 5], ['ServSafe & Health Compliance', 5], ['Staff Training & Scheduling', 5], ['Guest Relations', 5], ['Banquet Operations', 4]], bio: 'Food and beverage operations lead skilled in high-volume service execution, inventory control, and health inspections.' }
  },
  {
    industry: 'Agriculture, Forestry, Conservation & Outdoor',
    roleTitle: 'Regional Agronomy & Sustainable Land Operations Manager',
    workModel: 'onsite',
    location: 'Des Moines, IA',
    payMin: 82000,
    payMax: 105000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'Certified Crop Adviser (CCA)',
    skills: ['Precision Agriculture & GIS', 'Soil & Crop Management', 'Irrigation & Resource Planning', 'Equipment Fleet Operations', 'USDA / EPA Compliance'],
    desc: 'Sandbox Benchmark Role: Oversee precision agronomy programs, soil health diagnostics, irrigation efficiency, and seasonal field operations.',
    candA: { yrs: '8', minSal: 80000, model: 'onsite', loc: 'Des Moines, IA', skills: [['Precision Agriculture & GIS', 7], ['Soil & Crop Management', 8], ['Irrigation & Resource Planning', 7], ['Equipment Fleet Operations', 8], ['USDA / EPA Compliance', 7]], bio: 'Certified Crop Adviser and agronomy operations manager with 8 years optimizing yield and sustainable land stewardship.' },
    candB: { yrs: '5', minSal: 68000, model: 'onsite', loc: 'Sacramento, CA', skills: [['Soil & Crop Management', 5], ['Irrigation & Resource Planning', 5], ['Precision Agriculture & GIS', 4], ['USDA / EPA Compliance', 5], ['Field Crew Supervision', 5]], bio: 'Agricultural and conservation specialist experienced in watershed management, GIS mapping, and commercial farm operations.' }
  },
  {
    industry: 'Government & Public Administration (Federal, State & Local)',
    roleTitle: 'Municipal Grants & Public Programs Administrator',
    workModel: 'hybrid',
    location: 'Austin, TX',
    payMin: 88000,
    payMax: 112000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'PMP, Certified Public Manager (CPM)',
    skills: ['Federal & State Grant Compliance (2 CFR 200)', 'Public Budgeting & Procurement', 'Interagency Stakeholder Coordination', 'Policy & Regulatory Analysis', 'Program Audit & Reporting'],
    desc: 'Sandbox Benchmark Role: Administer municipal infrastructure grants, ensure 2 CFR 200 compliance, and coordinate interagency public programs.',
    candA: { yrs: '9', minSal: 86000, model: 'hybrid', loc: 'Austin, TX', skills: [['Federal & State Grant Compliance (2 CFR 200)', 8], ['Public Budgeting & Procurement', 9], ['Interagency Stakeholder Coordination', 8], ['Policy & Regulatory Analysis', 7], ['Program Audit & Reporting', 8]], bio: 'Public administration leader with 9 years managing state and municipal capital budgets, RFPs, and federal grant compliance.' },
    candB: { yrs: '5', minSal: 74000, model: 'hybrid', loc: 'Columbus, OH', skills: [['Public Budgeting & Procurement', 5], ['Federal & State Grant Compliance (2 CFR 200)', 4], ['Policy & Regulatory Analysis', 5], ['Program Audit & Reporting', 5], ['Civic Engagement', 5]], bio: 'Government program analyst experienced in public procurement, legislative reporting, and municipal operations.' }
  },
  {
    industry: 'Public Safety, Law Enforcement, Fire & Emergency Services',
    roleTitle: 'Emergency Management & Public Safety Operations Coordinator',
    workModel: 'onsite',
    location: 'Denver, CO',
    payMin: 86000,
    payMax: 110000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'FEMA NIMS / ICS-300 & ICS-400',
    skills: ['Incident Command System (NIMS / ICS)', 'Emergency Operations Center (EOC)', 'CAD & 911 Dispatch Systems', 'Hazard Mitigation Planning', 'Interagency Crisis Response'],
    desc: 'Sandbox Benchmark Role: Direct multi-agency Emergency Operations Center (EOC) readiness, NIMS/ICS protocols, and disaster response continuity.',
    candA: { yrs: '10', minSal: 85000, model: 'onsite', loc: 'Denver, CO', skills: [['Incident Command System (NIMS / ICS)', 10], ['Emergency Operations Center (EOC)', 8], ['CAD & 911 Dispatch Systems', 9], ['Hazard Mitigation Planning', 8], ['Interagency Crisis Response', 9]], bio: 'Public safety and emergency management commander with 10 years leading municipal EOC activations and NIMS/ICS training.' },
    candB: { yrs: '6', minSal: 72000, model: 'onsite', loc: 'San Antonio, TX', skills: [['Incident Command System (NIMS / ICS)', 6], ['CAD & 911 Dispatch Systems', 6], ['Interagency Crisis Response', 5], ['Hazard Mitigation Planning', 5], ['Public Safety Compliance', 6]], bio: 'Emergency services specialist experienced in critical incident dispatch, continuity planning, and first-responder coordination.' }
  },
  {
    industry: 'Defense, Aerospace & Government Contracting',
    roleTitle: 'Senior Defense Systems & DoD Program Manager',
    workModel: 'hybrid',
    location: 'Arlington, VA',
    payMin: 140000,
    payMax: 175000,
    expLevel: 'Lead / Staff / Principal (8+ yrs)',
    certs: 'PMP, DAWIA / DoD Acquisition',
    skills: ['DoD Acquisition & FAR / DFARS', 'Systems Engineering Lifecycle', 'Earned Value Management (EVM)', 'CMMC / NIST 800-171 Compliance', 'Subcontractor Management'],
    desc: 'Sandbox Benchmark Role: Lead mission-critical DoD and aerospace contract execution, FAR/DFARS compliance, and Earned Value Management (EVM) reporting.',
    candA: { yrs: '11', minSal: 140000, model: 'hybrid', loc: 'Arlington, VA', skills: [['DoD Acquisition & FAR / DFARS', 10], ['Systems Engineering Lifecycle', 9], ['Earned Value Management (EVM)', 9], ['CMMC / NIST 800-171 Compliance', 8], ['Subcontractor Management', 9]], bio: 'Defense and aerospace program manager with 11 years delivering C4ISR and avionics contracts on schedule and within EVM baselines.' },
    candB: { yrs: '6', minSal: 118000, model: 'hybrid', loc: 'Huntsville, AL', skills: [['Systems Engineering Lifecycle', 6], ['DoD Acquisition & FAR / DFARS', 5], ['Earned Value Management (EVM)', 5], ['CMMC / NIST 800-171 Compliance', 5], ['Technical Proposal Writing', 5]], bio: 'Aerospace systems engineer and GovCon project lead skilled in requirements traceability, MIL-STD testing, and DFARS compliance.' }
  },
  {
    industry: 'Non-Profit, Philanthropy & Civic Organizations',
    roleTitle: 'Director of Philanthropy, Grants & Community Impact',
    workModel: 'hybrid',
    location: 'Boston, MA',
    payMin: 92000,
    payMax: 118000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'CFRE (Certified Fund Raising Executive)',
    skills: ['Major Donor Cultivation', 'Foundation & Institutional Grants', 'Raiser’s Edge / Non-Profit CRM', 'Board Governance & Reporting', 'Impact Metrics & Program Evaluation'],
    desc: 'Sandbox Benchmark Role: Lead institutional grant strategy, major donor stewardship, board reporting, and measurable community impact programs.',
    candA: { yrs: '8', minSal: 90000, model: 'hybrid', loc: 'Boston, MA', skills: [['Major Donor Cultivation', 8], ['Foundation & Institutional Grants', 8], ['Raiser’s Edge / Non-Profit CRM', 7], ['Board Governance & Reporting', 7], ['Impact Metrics & Program Evaluation', 8]], bio: 'CFRE philanthropy director with 8 years securing multi-million-dollar foundation grants and leading capital campaigns.' },
    candB: { yrs: '5', minSal: 74000, model: 'remote', loc: 'Minneapolis, MN', skills: [['Foundation & Institutional Grants', 5], ['Impact Metrics & Program Evaluation', 5], ['Raiser’s Edge / Non-Profit CRM', 4], ['Community Partnerships', 5], ['Annual Giving Campaigns', 5]], bio: 'Non-profit development and grants manager focused on institutional grant writing, donor retention, and program outcomes.' }
  },
  {
    industry: 'Manufacturing, Industrial & Production',
    roleTitle: 'Plant Operations & Lean Six Sigma Production Manager',
    workModel: 'onsite',
    location: 'Detroit, MI',
    payMin: 112000,
    payMax: 138000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'Lean Six Sigma Black Belt, OSHA 30',
    skills: ['Lean Manufacturing & Kaizen', 'OEE & Production Scheduling', 'ISO 9001 Quality Management', 'OSHA Workplace Safety', 'ERP / MES Shop Floor Systems'],
    desc: 'Sandbox Benchmark Role: Direct high-volume manufacturing lines, drive Lean Six Sigma continuous improvement, and uphold ISO 9001 and OSHA standards.',
    candA: { yrs: '10', minSal: 110000, model: 'onsite', loc: 'Detroit, MI', skills: [['Lean Manufacturing & Kaizen', 10], ['OEE & Production Scheduling', 9], ['ISO 9001 Quality Management', 9], ['OSHA Workplace Safety', 10], ['ERP / MES Shop Floor Systems', 8]], bio: 'Lean Six Sigma Black Belt plant manager with 10 years improving OEE, reducing scrap rates, and leading 150+ production staff.' },
    candB: { yrs: '6', minSal: 88000, model: 'onsite', loc: 'Greenville, SC', skills: [['Lean Manufacturing & Kaizen', 6], ['ISO 9001 Quality Management', 6], ['OEE & Production Scheduling', 5], ['OSHA Workplace Safety', 6], ['Root Cause Analysis (CAPA)', 6]], bio: 'Industrial production and quality supervisor skilled in 5S, CAPA root-cause resolution, and automated assembly operations.' }
  },
  {
    industry: 'Wholesale Trade, Supply Chain, Logistics & Distribution',
    roleTitle: 'Regional Supply Chain, 3PL & Distribution Center Manager',
    workModel: 'onsite',
    location: 'Memphis, TN',
    payMin: 105000,
    payMax: 132000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'APICS CSCP / CPIM',
    skills: ['Warehouse Management Systems (WMS / SAP)', '3PL & Freight Carrier Negotiation', 'Inventory Forecasting & S&OP', 'Inbound / Outbound Fulfillment', 'DOT & OSHA Logistics Compliance'],
    desc: 'Sandbox Benchmark Role: Manage high-velocity distribution center fulfillment, 3PL freight carrier contracts, WMS optimization, and S&OP inventory planning.',
    candA: { yrs: '9', minSal: 102000, model: 'onsite', loc: 'Memphis, TN', skills: [['Warehouse Management Systems (WMS / SAP)', 9], ['3PL & Freight Carrier Negotiation', 8], ['Inventory Forecasting & S&OP', 8], ['Inbound / Outbound Fulfillment', 9], ['DOT & OSHA Logistics Compliance', 8]], bio: 'APICS CSCP supply chain and distribution leader with 9 years managing 500k+ sq. ft. fulfillment centers and national 3PL networks.' },
    candB: { yrs: '5', minSal: 82000, model: 'hybrid', loc: 'Dallas-Fort Worth-Arlington (DFW Metro), TX', skills: [['Inventory Forecasting & S&OP', 5], ['3PL & Freight Carrier Negotiation', 5], ['Warehouse Management Systems (WMS / SAP)', 5], ['Procurement & Vendor Relations', 5], ['Import / Export Customs', 4]], bio: 'Supply chain and procurement planner experienced in multi-echelon inventory optimization and freight cost reduction.' }
  },
  {
    industry: 'Architecture, Civil Engineering & Environmental Services',
    roleTitle: 'Senior Civil & Structural Project Engineer (PE)',
    workModel: 'hybrid',
    location: 'Denver, CO',
    payMin: 118000,
    payMax: 148000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'Professional Engineer (PE)',
    skills: ['AutoCAD Civil 3D & Revit', 'Stormwater & Site Development', 'Structural Load & Grading Analysis', 'NEPA / Environmental Permitting', 'Construction Submittal Review'],
    desc: 'Sandbox Benchmark Role: Lead civil site design, stormwater hydrology modeling, AutoCAD Civil 3D plan sets, and municipal permitting.',
    candA: { yrs: '8', minSal: 115000, model: 'hybrid', loc: 'Denver, CO', skills: [['AutoCAD Civil 3D & Revit', 8], ['Stormwater & Site Development', 8], ['Structural Load & Grading Analysis', 7], ['NEPA / Environmental Permitting', 7], ['Construction Submittal Review', 8]], bio: 'Licensed Professional Engineer (PE) with 8 years delivering commercial site development, municipal roadway, and drainage projects.' },
    candB: { yrs: '5', minSal: 94000, model: 'hybrid', loc: 'Raleigh, NC', skills: [['AutoCAD Civil 3D & Revit', 5], ['Stormwater & Site Development', 5], ['NEPA / Environmental Permitting', 5], ['GIS Spatial Analysis', 4], ['Construction Submittal Review', 4]], bio: 'Civil and environmental engineer specializing in land development, erosion control permitting, and Civil 3D corridor modeling.' }
  },
  {
    industry: 'Real Estate, Construction, Facilities & Skilled Trades',
    roleTitle: 'Commercial Construction Superintendent & Facilities Lead',
    workModel: 'onsite',
    location: 'Dallas-Fort Worth-Arlington (DFW Metro), TX',
    payMin: 108000,
    payMax: 136000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'OSHA 30, PMP / CCM',
    skills: ['Procore & Primavera P6', 'Subcontractor & MEP Coordination', 'Commercial Estimating & Change Orders', 'OSHA 30 Jobsite Safety', 'Building Codes & Municipal Inspections'],
    desc: 'Sandbox Benchmark Role: Direct ground-up commercial construction schedules in Procore, coordinate MEP trades, and enforce OSHA 30 safety.',
    candA: { yrs: '10', minSal: 105000, model: 'onsite', loc: 'Dallas-Fort Worth-Arlington (DFW Metro), TX', skills: [['Procore & Primavera P6', 9], ['Subcontractor & MEP Coordination', 10], ['Commercial Estimating & Change Orders', 8], ['OSHA 30 Jobsite Safety', 10], ['Building Codes & Municipal Inspections', 9]], bio: 'Commercial construction superintendent with 10 years delivering $25M+ commercial, healthcare, and industrial build-outs on budget.' },
    candB: { yrs: '6', minSal: 85000, model: 'onsite', loc: 'Phoenix, AZ', skills: [['Subcontractor & MEP Coordination', 6], ['Procore & Primavera P6', 5], ['HVAC / Electrical / Facilities Systems', 6], ['OSHA 30 Jobsite Safety', 6], ['Preventive Maintenance', 6]], bio: 'Facilities and skilled trades supervisor experienced in commercial MEP maintenance, Procore project tracking, and vendor oversight.' }
  },
  {
    industry: 'Energy, Oil & Gas, Utilities & CleanTech',
    roleTitle: 'Grid Operations & Renewable Energy Project Manager',
    workModel: 'hybrid',
    location: 'Houston, TX',
    payMin: 128000,
    payMax: 160000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'PMP, NERC / NABCEP',
    skills: ['Utility Grid Interconnection & SCADA', 'Solar / BESS / Midstream Operations', 'NERC CIP & FERC Compliance', 'EPC Contract & Vendor Management', 'HSE Safety & Environmental Governance'],
    desc: 'Sandbox Benchmark Role: Manage utility-scale energy and grid interconnection projects, EPC contractors, SCADA telemetry, and NERC compliance.',
    candA: { yrs: '9', minSal: 125000, model: 'hybrid', loc: 'Houston, TX', skills: [['Utility Grid Interconnection & SCADA', 8], ['Solar / BESS / Midstream Operations', 9], ['NERC CIP & FERC Compliance', 8], ['EPC Contract & Vendor Management', 9], ['HSE Safety & Environmental Governance', 8]], bio: 'Energy and utilities project leader with 9 years managing ERCOT/WECC grid interconnections, battery storage, and midstream assets.' },
    candB: { yrs: '5', minSal: 102000, model: 'hybrid', loc: 'Denver, CO', skills: [['Solar / BESS / Midstream Operations', 5], ['EPC Contract & Vendor Management', 5], ['Utility Grid Interconnection & SCADA', 4], ['HSE Safety & Environmental Governance', 5], ['Financial Project Modeling', 4]], bio: 'CleanTech and power systems engineer experienced in commercial solar + storage deployment and utility commissioning.' }
  },
  {
    industry: 'Automotive, Aviation, Marine & Transportation',
    roleTitle: 'Fleet Maintenance & Aviation / Transportation Operations Lead',
    workModel: 'onsite',
    location: 'Atlanta, GA',
    payMin: 96000,
    payMax: 124000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'FAA A&P / ASE Master / DOT Compliance',
    skills: ['Preventive Fleet & Avionics Maintenance', 'DOT / FMCSA / FAA Regulatory Compliance', 'Telematics & Route Optimization', 'Warranty & Parts Inventory Control', 'Technician Team Leadership'],
    desc: 'Sandbox Benchmark Role: Direct regional transportation and aviation maintenance operations, DOT/FAA inspection readiness, and fleet uptime.',
    candA: { yrs: '9', minSal: 95000, model: 'onsite', loc: 'Atlanta, GA', skills: [['Preventive Fleet & Avionics Maintenance', 9], ['DOT / FMCSA / FAA Regulatory Compliance', 9], ['Telematics & Route Optimization', 7], ['Warranty & Parts Inventory Control', 8], ['Technician Team Leadership', 8]], bio: 'Transportation and fleet maintenance director with 9 years managing 300+ commercial vehicles, DOT audits, and shop technicians.' },
    candB: { yrs: '6', minSal: 82000, model: 'onsite', loc: 'Dallas-Fort Worth-Arlington (DFW Metro), TX', skills: [['Preventive Fleet & Avionics Maintenance', 6], ['DOT / FMCSA / FAA Regulatory Compliance', 6], ['Warranty & Parts Inventory Control', 5], ['Technician Team Leadership', 5], ['Safety Inspections', 6]], bio: 'Aviation and heavy-equipment maintenance lead skilled in FAA/DOT compliance, diagnostic troubleshooting, and parts logistics.' }
  },
  {
    industry: 'E-Commerce, Retail & Consumer Goods (CPG)',
    roleTitle: 'Director of E-Commerce Merchandising & CPG Growth',
    workModel: 'remote',
    location: 'Remote — US Nationwide',
    payMin: 118000,
    payMax: 148000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'Google Analytics / Shopify Plus',
    skills: ['Shopify Plus & Marketplace Operations', 'Amazon Seller / Vendor Central', 'Conversion Rate Optimization (CRO)', 'Omnichannel Inventory & Demand Planning', 'P&L & Paid Acquisition ROAS'],
    desc: 'Sandbox Benchmark Role: Own DTC Shopify Plus and Amazon marketplace growth, conversion rate optimization, and omnichannel CPG merchandising.',
    candA: { yrs: '8', minSal: 115000, model: 'remote', loc: 'Los Angeles, CA', skills: [['Shopify Plus & Marketplace Operations', 8], ['Amazon Seller / Vendor Central', 7], ['Conversion Rate Optimization (CRO)', 8], ['Omnichannel Inventory & Demand Planning', 7], ['P&L & Paid Acquisition ROAS', 8]], bio: 'E-commerce and CPG growth leader with 8 years scaling $30M+ DTC brands across Shopify Plus, Amazon, and retail distribution.' },
    candB: { yrs: '5', minSal: 92000, model: 'hybrid', loc: 'New York, NY', skills: [['Shopify Plus & Marketplace Operations', 5], ['Conversion Rate Optimization (CRO)', 5], ['Amazon Seller / Vendor Central', 4], ['Omnichannel Inventory & Demand Planning', 5], ['Email & Retention Lifecycle', 5]], bio: 'Digital merchandising manager focused on A/B funnel testing, SKU velocity, and omnichannel retail launches.' }
  },
  {
    industry: 'Telecommunications, Hardware & Networking',
    roleTitle: 'Senior Network Infrastructure & RF / Fiber Engineer',
    workModel: 'hybrid',
    location: 'Dallas-Fort Worth-Arlington (DFW Metro), TX',
    payMin: 122000,
    payMax: 152000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'Cisco CCNP / CCNA',
    skills: ['BGP / OSPF Enterprise Routing', 'SD-WAN & MPLS Architecture', 'Fiber Optic & 5G RF Deployment', 'Cisco / Juniper / Palo Alto Firewalls', 'Network Telemetry & Packet Analysis'],
    desc: 'Sandbox Benchmark Role: Architect high-availability carrier and enterprise backbone networks, BGP/OSPF routing, SD-WAN, and fiber deployments.',
    candA: { yrs: '9', minSal: 120000, model: 'hybrid', loc: 'Dallas-Fort Worth-Arlington (DFW Metro), TX', skills: [['BGP / OSPF Enterprise Routing', 9], ['SD-WAN & MPLS Architecture', 8], ['Fiber Optic & 5G RF Deployment', 7], ['Cisco / Juniper / Palo Alto Firewalls', 9], ['Network Telemetry & Packet Analysis', 8]], bio: 'CCNP Senior Network Engineer with 9 years designing carrier-grade MPLS, SD-WAN, and multi-datacenter routing architectures.' },
    candB: { yrs: '5', minSal: 96000, model: 'onsite', loc: 'Denver, CO', skills: [['BGP / OSPF Enterprise Routing', 5], ['Cisco / Juniper / Palo Alto Firewalls', 5], ['Fiber Optic & 5G RF Deployment', 5], ['SD-WAN & MPLS Architecture', 4], ['Network Telemetry & Packet Analysis', 5]], bio: 'Telecommunications and network infrastructure engineer skilled in fiberOSP rollouts, Cisco routing, and firewall hardening.' }
  },
  {
    industry: 'Media, Marketing, Advertising, Gaming & Entertainment',
    roleTitle: 'Senior Growth Marketing & Performance Media Lead',
    workModel: 'remote',
    location: 'Remote — US Nationwide',
    payMin: 115000,
    payMax: 145000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'Google Ads, Meta Blueprint, HubSpot',
    skills: ['Paid Search & Paid Social (Google / Meta / LinkedIn)', 'Multi-Touch Attribution & GA4', 'HubSpot / Lifecycle Marketing Automation', 'Creative Testing & Video Ad Production', 'CAC / LTV Funnel Optimization'],
    desc: 'Sandbox Benchmark Role: Scale full-funnel B2B and consumer customer acquisition, multi-touch attribution, and high-converting video ad campaigns.',
    candA: { yrs: '8', minSal: 112000, model: 'remote', loc: 'Austin, TX', skills: [['Paid Search & Paid Social (Google / Meta / LinkedIn)', 8], ['Multi-Touch Attribution & GA4', 7], ['HubSpot / Lifecycle Marketing Automation', 7], ['Creative Testing & Video Ad Production', 7], ['CAC / LTV Funnel Optimization', 8]], bio: 'Growth marketing leader with 8 years managing $5M+ annual performance media budgets and driving profitable CAC-to-LTV payback.' },
    candB: { yrs: '5', minSal: 88000, model: 'remote', loc: 'Nashville, TN', skills: [['Paid Search & Paid Social (Google / Meta / LinkedIn)', 5], ['HubSpot / Lifecycle Marketing Automation', 5], ['Multi-Touch Attribution & GA4', 5], ['Creative Testing & Video Ad Production', 4], ['Content & SEO Strategy', 5]], bio: 'Performance demand-generation manager specializing in LinkedIn/Meta paid acquisition, GA4 analytics, and HubSpot nurture flows.' }
  },
  {
    industry: 'Arts, Design, Photography & Creative Studios',
    roleTitle: 'Principal Product Designer (UI/UX & Design Systems)',
    workModel: 'remote',
    location: 'Remote — US Nationwide',
    payMin: 130000,
    payMax: 162000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'NN/g UX Certification',
    skills: ['Figma & Tokenized Design Systems', 'End-to-End UX Research & Prototyping', 'WCAG 2.1 AA Accessibility', 'Motion & Interactive UI Craft', 'Cross-Functional Product Strategy'],
    desc: 'Sandbox Benchmark Role: Lead end-to-end product design, tokenized Figma design systems, interactive prototyping, and WCAG AA accessibility.',
    candA: { yrs: '8', minSal: 128000, model: 'remote', loc: 'Seattle, WA', skills: [['Figma & Tokenized Design Systems', 8], ['End-to-End UX Research & Prototyping', 8], ['WCAG 2.1 AA Accessibility', 7], ['Motion & Interactive UI Craft', 7], ['Cross-Functional Product Strategy', 8]], bio: 'Principal UI/UX designer with 8 years crafting enterprise design systems, high-conversion B2B workflows, and accessible interfaces.' },
    candB: { yrs: '5', minSal: 98000, model: 'remote', loc: 'Brooklyn, NY', skills: [['Figma & Tokenized Design Systems', 5], ['Motion & Interactive UI Craft', 5], ['End-to-End UX Research & Prototyping', 5], ['Adobe Creative Suite / Video', 5], ['Brand Identity Systems', 5]], bio: 'Senior visual and product designer blending Figma component architecture with motion graphics and brand storytelling.' }
  },
  {
    industry: 'Education, EdTech, K-12, Higher Ed & Corporate Training',
    roleTitle: 'Senior Technical Training & AI Enablement Program Manager',
    workModel: 'remote',
    location: 'Remote — US Nationwide',
    payMin: 115000,
    payMax: 145000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'CPTD / Instructional Design / OKR Coach',
    skills: ['Technical Curriculum & Playbook Design', 'Enterprise AI & SaaS Enablement', 'LMS Administration & Knowledge Governance', 'Onboarding Readiness Programs', 'Executive Stakeholder Facilitation'],
    desc: 'Sandbox Benchmark Role: Architect global technical enablement programs, AI knowledge management playbooks, and engineering onboarding curricula.',
    candA: { yrs: '9', minSal: 115000, model: 'remote', loc: 'Dallas-Fort Worth-Arlington (DFW Metro), TX', skills: [['Technical Curriculum & Playbook Design', 9], ['Enterprise AI & SaaS Enablement', 7], ['LMS Administration & Knowledge Governance', 8], ['Onboarding Readiness Programs', 9], ['Executive Stakeholder Facilitation', 8]], bio: 'Senior technical training and AI enablement planner with 9 years building global knowledge playbooks and support readiness programs.' },
    candB: { yrs: '5', minSal: 88000, model: 'remote', loc: 'Raleigh, NC', skills: [['Technical Curriculum & Playbook Design', 5], ['LMS Administration & Knowledge Governance', 5], ['Onboarding Readiness Programs', 5], ['Articulate Storyline & eLearning', 5], ['Competency Assessments', 4]], bio: 'Instructional designer and corporate enablement specialist experienced in SaaS customer education and L&D analytics.' }
  },
  {
    industry: 'Legal, HR, Staffing, Recruiting & Management Consulting',
    roleTitle: 'Director of People Operations, Talent & Employment Compliance',
    workModel: 'remote',
    location: 'Remote — US Nationwide',
    payMin: 125000,
    payMax: 155000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'SHRM-SCP, SPHR',
    skills: ['Multi-State Employment Law & Compliance', 'Technical & Executive Talent Acquisition', 'Workday / Greenhouse HRIS & ATS', 'Compensation Bands & Total Rewards', 'Organizational Development & OKRs'],
    desc: 'Sandbox Benchmark Role: Lead multi-state HR compliance, Workday/Greenhouse HRIS operations, structured compensation bands, and merit-based recruiting.',
    candA: { yrs: '9', minSal: 120000, model: 'remote', loc: 'Chicago, IL', skills: [['Multi-State Employment Law & Compliance', 9], ['Technical & Executive Talent Acquisition', 8], ['Workday / Greenhouse HRIS & ATS', 8], ['Compensation Bands & Total Rewards', 8], ['Organizational Development & OKRs', 8]], bio: 'SHRM-SCP People Operations Director with 9 years scaling distributed workforce compliance, compensation architecture, and recruiting.' },
    candB: { yrs: '5', minSal: 92000, model: 'hybrid', loc: 'Austin, TX', skills: [['Technical & Executive Talent Acquisition', 5], ['Workday / Greenhouse HRIS & ATS', 5], ['Multi-State Employment Law & Compliance', 4], ['Compensation Bands & Total Rewards', 4], ['Employee Relations', 5]], bio: 'Senior talent partner and HR generalist skilled in structured competency interviewing, Greenhouse ATS workflows, and onboarding.' }
  },
  {
    industry: 'Fitness, Wellness, Sports & Personal Care Services',
    roleTitle: 'Regional Multi-Studio Wellness & Fitness Operations Director',
    workModel: 'onsite',
    location: 'Scottsdale, AZ',
    payMin: 84000,
    payMax: 108000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'NASM-CPT / ACSM, CPR/AED',
    skills: ['Multi-Club P&L & Membership Growth', 'Trainer & Practitioner Recruiting', 'Mindbody / Club CRM Retention', 'Health, Safety & Facility Operations', 'Community Event & Partnership Marketing'],
    desc: 'Sandbox Benchmark Role: Lead multi-location wellness and fitness studio P&L, member retention lifecycles, and certified trainer development.',
    candA: { yrs: '8', minSal: 82000, model: 'onsite', loc: 'Scottsdale, AZ', skills: [['Multi-Club P&L & Membership Growth', 8], ['Trainer & Practitioner Recruiting', 7], ['Mindbody / Club CRM Retention', 8], ['Health, Safety & Facility Operations', 8], ['Community Event & Partnership Marketing', 7]], bio: 'Regional wellness operations director with 8 years scaling multi-studio membership revenue, trainer retention, and NPS.' },
    candB: { yrs: '5', minSal: 68000, model: 'onsite', loc: 'Miami, FL', skills: [['Multi-Club P&L & Membership Growth', 5], ['Mindbody / Club CRM Retention', 5], ['Trainer & Practitioner Recruiting', 5], ['Health, Safety & Facility Operations', 5], ['Client Wellness Programming', 5]], bio: 'Fitness and wellness general manager experienced in studio launches, recurring membership sales, and staff coaching.' }
  },
  {
    industry: 'Other / Multi-Industry',
    roleTitle: 'Senior Cross-Functional Business Operations & Strategy Lead',
    workModel: 'remote',
    location: 'Remote — US Nationwide',
    payMin: 125000,
    payMax: 155000,
    expLevel: 'Senior (5–8 yrs)',
    certs: 'PMP, Certified OKR Coach',
    skills: ['Cross-Functional Program Execution', 'OKR & KPI Executive Dashboards', 'Vendor & Contract Governance', 'Process Automation & Workflow Design', 'Financial & Resource Planning'],
    desc: 'Sandbox Benchmark Role: Drive company-wide strategic initiatives, OKR cadences, vendor governance, and cross-departmental workflow automation.',
    candA: { yrs: '8', minSal: 120000, model: 'remote', loc: 'Dallas-Fort Worth-Arlington (DFW Metro), TX', skills: [['Cross-Functional Program Execution', 8], ['OKR & KPI Executive Dashboards', 8], ['Vendor & Contract Governance', 7], ['Process Automation & Workflow Design', 8], ['Financial & Resource Planning', 7]], bio: 'Business operations and strategy lead with 8 years aligning executive OKRs, vendor operations, and cross-functional delivery.' },
    candB: { yrs: '5', minSal: 95000, model: 'remote', loc: 'Atlanta, GA', skills: [['Cross-Functional Program Execution', 5], ['Process Automation & Workflow Design', 5], ['OKR & KPI Executive Dashboards', 5], ['Vendor & Contract Governance', 4], ['Stakeholder Communication', 5]], bio: 'Operations program manager skilled in scaling repeatable business processes, KPI telemetry, and cross-team alignment.' }
  }
]

async function findOrCreateAuthUser(email, role) {
  const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const existing = (listData?.users || []).find((u) => (u.email || '').toLowerCase() === email.toLowerCase())
  if (existing) return existing.id

  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password: 'SandboxBenchmark!' + crypto.randomBytes(8).toString('hex'),
    email_confirm: true,
    user_metadata: { is_sandbox_benchmark: true, role },
  })
  if (error) throw new Error(`Failed creating auth user ${email}: ${error.message}`)
  return created.user.id
}

async function wipeSandboxBenchmarks() {
  console.log('🧹 Wiping existing Sandbox Benchmark roles and candidate profiles...')
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id')
    .eq('domain', BENCHMARK_ORG_DOMAIN)

  if (orgs && orgs.length > 0) {
    const orgIds = orgs.map((o) => o.id)
    await supabase.from('jobs').delete().in('organization_id', orgIds)
    await supabase.from('organization_members').delete().in('organization_id', orgIds)
    await supabase.from('organizations').delete().in('id', orgIds)
  }

  const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const sandboxUsers = (listData?.users || []).filter((u) => {
    const em = (u.email || '').toLowerCase()
    return em.startsWith('sandbox.cand.') || em === BENCHMARK_EMPLOYER_EMAIL
  })

  for (const su of sandboxUsers) {
    await supabase.from('profiles').delete().eq('id', su.id)
    await supabase.auth.admin.deleteUser(su.id)
  }
  console.log(`✅ Wiped ${sandboxUsers.length} sandbox auth accounts and all benchmark roles.`)
}

async function seedAll() {
  if (process.argv.includes('--wipe')) {
    await wipeSandboxBenchmarks()
    return
  }

  // Clean slate before seeding so running twice never duplicates
  await wipeSandboxBenchmarks()

  console.log('🌱 Seeding 1 Benchmark Employer Organization + 28 Benchmark Roles + 56 Sample Candidate Vaults...')
  const empUserId = await findOrCreateAuthUser(BENCHMARK_EMPLOYER_EMAIL, 'employer')

  await supabase.from('profiles').upsert({
    id: empUserId,
    role: 'employer',
    full_name: 'Special Sauce Benchmark Lab',
    identity_verified: true,
    is_verified: true,
    is_discoverable: false,
  })

  const { data: orgRow, error: orgErr } = await supabase
    .from('organizations')
    .insert({
      name: 'AI Fit Benchmark Lab (Practice Role)',
      domain: BENCHMARK_ORG_DOMAIN,
      verification_status: 'verified',
      connection_credits: 999,
      subscription_tier: 'enterprise',
      description: 'Official Special Sauce 5-Point AI Fit Radar™ Calibration & Practice Benchmark Organization. [IND:Technology, Software & SaaS] [SIZE:Growth (50–250 Employees)] [EIN:75-2849102] [INC_STATE:TX] [RDAP:VERIFIED_2021] [TIER:enterprise] [SANDBOX_BENCHMARK:true]',
    })
    .select()
    .single()

  if (orgErr || !orgRow) {
    throw new Error('Failed to create benchmark organization: ' + (orgErr?.message || 'unknown'))
  }

  await supabase.from('organization_members').insert({
    organization_id: orgRow.id,
    user_id: empUserId,
    role: 'owner',
  })

  let roleCount = 0
  let candCount = 0

  for (let i = 0; i < VERTICAL_SEEDS.length; i++) {
    const v = VERTICAL_SEEDS[i]
    const idxStr = String(i + 1).padStart(2, '0')

    // 1. Insert Benchmark Job for this vertical
    const structuredReqs = [
      ...v.skills.map((s, idx) => ({
        skill: s,
        level: idx < 2 ? 'Expert' : 'Intermediate',
        years: idx < 2 ? 5 : 3,
      })),
      {
        _ss_job_meta: true,
        is_sandbox_benchmark: true,
        pay_type: 'annual',
        comp_perks: 'Base Salary + Full Benefits',
        location: v.location,
        employment_type: 'Full-Time (W-2)',
        experience_level: v.expLevel,
        industry: v.industry,
        education_req: "Bachelor's Degree OR Equivalent Practical Experience",
        required_certifications: v.certs,
        required_languages: [
          { language: 'English', modality: 'Both (Written & Verbal)', proficiency: 'Fluent / Native' },
        ],
        company_size: 'Growth (50–250 Employees)',
        work_auth: 'US Authorized Only',
        hiring_timeline: 'AI Fit Benchmark • Practice Match',
        renewed_at: new Date().toISOString(),
      },
    ]

    const { error: jobErr } = await supabase.from('jobs').insert({
      organization_id: orgRow.id,
      employer_id: empUserId,
      title: v.roleTitle.endsWith('(Demo)') ? v.roleTitle : `${v.roleTitle} (Demo)`,
      work_model: v.workModel,
      description: v.desc,
      salary_min: v.payMin,
      salary_max: v.payMax,
      structured_requirements: structuredReqs,
      is_active: true,
    })
    if (jobErr) console.error('Job seed error:', jobErr.message)
    else roleCount++

    // 2. Insert 2 Sample Candidate Vaults for this vertical
    const pair = [v.candA, v.candB]
    for (let cIdx = 0; cIdx < pair.length; cIdx++) {
      const c = pair[cIdx]
      const email = `sandbox.cand.${idxStr}.${cIdx + 1}@specialsauce.test`
      const candUserId = await findOrCreateAuthUser(email, 'candidate')

      const visibleSkills = c.skills.map(([sk, yrs]) => ({ skill: sk, years: yrs }))
      const skillsCsv = visibleSkills.map((s) => s.skill).join(', ')

      const structuredSkills = [
        ...visibleSkills,
        {
          _ss_meta: true,
          plan: 'professional',
          is_sandbox_benchmark: true,
          trialStart: new Date().toISOString(),
          trialBaselineApps: 0,
        },
        {
          _ss_pref_meta: true,
          is_sandbox_benchmark: true,
          industry_vertical: v.industry,
          education_level: "Bachelor's Degree",
          availability_window: 'Available Immediately',
          certifications: cIdx === 0 ? v.certs : '',
          languages: [
            { language: 'English', modality: 'Both (Written & Verbal)', proficiency: 'Fluent / Native' },
          ],
          employment_types: ['Full-Time (W-2)', 'Contract (1099 / Corp-to-Corp)', 'Contract-to-Hire'],
        },
      ]

      const { error: profErr } = await supabase.from('profiles').upsert({
        id: candUserId,
        role: 'candidate',
        full_name: `Sample Candidate ${idxStr}-${cIdx + 1} (Demo)`,
        experience_years: c.yrs,
        skills: skillsCsv,
        structured_skills: structuredSkills,
        bio: c.bio,
        min_salary_expectation: c.minSal,
        preferred_work_model: c.model,
        location: c.loc,
        identity_verified: cIdx === 0,
        is_verified: cIdx === 0,
        is_discoverable: true,
      })
      if (profErr) console.error('Candidate seed error:', profErr.message)
      else candCount++
    }
  }

  console.log(`🎉 SUCCESS: Seeded ${roleCount} Benchmark Roles and ${candCount} Sample Candidate Vaults across all 28 verticals!`)
}

seedAll().catch((err) => {
  console.error(err)
  process.exit(1)
})
