import { STANDARD_INDUSTRY_VERTICALS } from './industries'

export interface CertificationDefinition {
  canonical: string
  category: string
  aliases: string[]
  verticals: string[] // Empty array or ['*'] means universal/cross-industry
}

export const CERTIFICATION_CATEGORIES = [
  'Cross-Industry PM, Agile & Operations',
  'IT Support, Hardware & Enterprise Systems',
  'Cybersecurity, Cloud & Network Infrastructure',
  'AI, Data Engineering & Business Intelligence',
  'Skilled Trades, Construction, HVAC, Electrical & Plumbing',
  'Transportation, CDL, Automotive, Aviation & Marine',
  'Healthcare, Nursing, Clinical & Life Sciences',
  'Finance, Accounting, Tax, Audit & Insurance',
  'Defense, Government, Clearance & Public Safety',
  'Legal, HR, Recruiting & Compliance',
  'Supply Chain, Logistics, Manufacturing & Quality',
  'Hospitality, Food Safety & Customer Operations',
  'Architecture, Civil Engineering, Real Estate & Energy',
  'Education, Enablement, Accessibility & Creative',
] as const

export const STANDARD_CERTIFICATIONS: CertificationDefinition[] = [
  // 1. CROSS-INDUSTRY PM, AGILE & OPERATIONS
  {
    canonical: 'PMP (Project Management Professional)',
    category: 'Cross-Industry PM, Agile & Operations',
    aliases: ['pmp', 'project management professional', 'pmi pmp'],
    verticals: ['*'],
  },
  {
    canonical: 'CAPM (Certified Associate in Project Management)',
    category: 'Cross-Industry PM, Agile & Operations',
    aliases: ['capm', 'certified associate in project management'],
    verticals: ['*'],
  },
  {
    canonical: 'Certified ScrumMaster (CSM)',
    category: 'Cross-Industry PM, Agile & Operations',
    aliases: ['csm', 'certified scrummaster', 'certified scrum master', 'scrum master'],
    verticals: ['*'],
  },
  {
    canonical: 'Professional Scrum Master (PSM I / II)',
    category: 'Cross-Industry PM, Agile & Operations',
    aliases: ['psm', 'psm i', 'psm ii', 'professional scrum master'],
    verticals: ['*'],
  },
  {
    canonical: 'PMI-ACP (Agile Certified Practitioner)',
    category: 'Cross-Industry PM, Agile & Operations',
    aliases: ['pmi-acp', 'pmi acp', 'agile certified practitioner'],
    verticals: ['*'],
  },
  {
    canonical: 'SAFe Agilist / SAFe Program Consultant (SPC)',
    category: 'Cross-Industry PM, Agile & Operations',
    aliases: ['safe agilist', 'safe spc', 'scaled agile', 'safe practitioner'],
    verticals: ['*'],
  },
  {
    canonical: 'Certified OKR Coach / OKR Practitioner',
    category: 'Cross-Industry PM, Agile & Operations',
    aliases: ['certified okr coach', 'okr coach', 'okr certified', 'objectives and key results'],
    verticals: ['*'],
  },
  {
    canonical: 'Lean Six Sigma Black Belt (LSSBB)',
    category: 'Cross-Industry PM, Agile & Operations',
    aliases: ['six sigma black belt', 'lean six sigma black belt', 'lssbb', 'cssbb'],
    verticals: ['*'],
  },
  {
    canonical: 'Lean Six Sigma Green Belt (LSSGB)',
    category: 'Cross-Industry PM, Agile & Operations',
    aliases: ['six sigma green belt', 'lean six sigma green belt', 'lssgb', 'cssgb'],
    verticals: ['*'],
  },
  {
    canonical: 'ITIL 4 Foundation / Managing Professional',
    category: 'Cross-Industry PM, Agile & Operations',
    aliases: ['itil', 'itil 4', 'itil v4', 'itil foundation', 'itilv3'],
    verticals: ['*'],
  },
  {
    canonical: 'Prosci Certified Change Management Practitioner',
    category: 'Cross-Industry PM, Agile & Operations',
    aliases: ['prosci', 'adkar', 'change management certified', 'ccmp'],
    verticals: ['*'],
  },

  // 2. IT SUPPORT, HARDWARE & ENTERPRISE SYSTEMS
  {
    canonical: 'CompTIA A+',
    category: 'IT Support, Hardware & Enterprise Systems',
    aliases: ['a+', 'comptia a+', 'comptia a plus', 'a+ certified', 'a+ certification', '220-1101', '220-1102'],
    verticals: [
      'IT Services, MSP & Technical Support',
      'Technology, Software & SaaS',
      'Telecommunications, Hardware & Networking',
      'BPO, Contact Center & Customer Operations',
      'Cybersecurity & Cloud Infrastructure',
    ],
  },
  {
    canonical: 'CompTIA Network+',
    category: 'IT Support, Hardware & Enterprise Systems',
    aliases: ['network+', 'net+', 'comptia network+', 'comptia net+', 'n10-008', 'n10-009'],
    verticals: [
      'IT Services, MSP & Technical Support',
      'Telecommunications, Hardware & Networking',
      'Cybersecurity & Cloud Infrastructure',
      'Technology, Software & SaaS',
    ],
  },
  {
    canonical: 'CompTIA Server+ / Linux+',
    category: 'IT Support, Hardware & Enterprise Systems',
    aliases: ['server+', 'linux+', 'comptia server+', 'comptia linux+'],
    verticals: [
      'IT Services, MSP & Technical Support',
      'Cybersecurity & Cloud Infrastructure',
      'Telecommunications, Hardware & Networking',
    ],
  },
  {
    canonical: 'Cisco CCNA (Certified Network Associate)',
    category: 'IT Support, Hardware & Enterprise Systems',
    aliases: ['ccna', 'cisco ccna', '200-301', 'cisco certified network associate'],
    verticals: [
      'Telecommunications, Hardware & Networking',
      'IT Services, MSP & Technical Support',
      'Cybersecurity & Cloud Infrastructure',
    ],
  },
  {
    canonical: 'Cisco CCNP (Enterprise / Security)',
    category: 'IT Support, Hardware & Enterprise Systems',
    aliases: ['ccnp', 'cisco ccnp', 'cisco certified network professional'],
    verticals: [
      'Telecommunications, Hardware & Networking',
      'Cybersecurity & Cloud Infrastructure',
      'IT Services, MSP & Technical Support',
    ],
  },
  {
    canonical: 'Microsoft 365 Certified: Endpoint & Modern Desktop Administrator',
    category: 'IT Support, Hardware & Enterprise Systems',
    aliases: ['md-102', 'ms-102', 'ms-900', 'microsoft 365 certified', 'office 365 certified', 'intune administrator'],
    verticals: [
      'IT Services, MSP & Technical Support',
      'Technology, Software & SaaS',
      'BPO, Contact Center & Customer Operations',
    ],
  },
  {
    canonical: 'Apple Certified IT / Jamf Certified Admin',
    category: 'IT Support, Hardware & Enterprise Systems',
    aliases: ['acsp', 'apple certified', 'jamf 100', 'jamf 200', 'jamf 300', 'jamf certified'],
    verticals: [
      'IT Services, MSP & Technical Support',
      'Technology, Software & SaaS',
    ],
  },
  {
    canonical: 'HDI Support Center Manager / Desktop Support Technician',
    category: 'IT Support, Hardware & Enterprise Systems',
    aliases: ['hdi', 'hdi-scm', 'hdi-dst', 'service desk institute'],
    verticals: [
      'IT Services, MSP & Technical Support',
      'BPO, Contact Center & Customer Operations',
    ],
  },

  // 3. CYBERSECURITY, CLOUD & NETWORK INFRASTRUCTURE
  {
    canonical: 'CompTIA Security+',
    category: 'Cybersecurity, Cloud & Network Infrastructure',
    aliases: ['security+', 'sec+', 'comptia security+', 'sy0-601', 'sy0-701'],
    verticals: [
      'Cybersecurity & Cloud Infrastructure',
      'IT Services, MSP & Technical Support',
      'Defense, Aerospace & Government Contracting',
      'Technology, Software & SaaS',
      'Government & Public Administration (Federal, State & Local)',
    ],
  },
  {
    canonical: 'CompTIA CySA+ / PenTest+ / CASP+',
    category: 'Cybersecurity, Cloud & Network Infrastructure',
    aliases: ['cysa+', 'pentest+', 'casp+', 'securityX', 'comptia cysa+'],
    verticals: [
      'Cybersecurity & Cloud Infrastructure',
      'Defense, Aerospace & Government Contracting',
      'IT Services, MSP & Technical Support',
    ],
  },
  {
    canonical: 'ISC2 CISSP (Certified Information Systems Security Professional)',
    category: 'Cybersecurity, Cloud & Network Infrastructure',
    aliases: ['cissp', 'isc2 cissp'],
    verticals: [
      'Cybersecurity & Cloud Infrastructure',
      'Defense, Aerospace & Government Contracting',
      'Finance, Banking, FinTech & Insurance',
      'Technology, Software & SaaS',
    ],
  },
  {
    canonical: 'ISC2 CC (Certified in Cybersecurity) / CCSP',
    category: 'Cybersecurity, Cloud & Network Infrastructure',
    aliases: ['isc2 cc', 'certified in cybersecurity', 'ccsp', 'cloud security professional'],
    verticals: [
      'Cybersecurity & Cloud Infrastructure',
      'IT Services, MSP & Technical Support',
      'Technology, Software & SaaS',
    ],
  },
  {
    canonical: 'ISACA CISM / CISA / CRISC',
    category: 'Cybersecurity, Cloud & Network Infrastructure',
    aliases: ['cism', 'cisa', 'crisc', 'isaca', 'certified information security manager', 'certified information systems auditor'],
    verticals: [
      'Cybersecurity & Cloud Infrastructure',
      'Accounting, Tax, Audit & Advisory',
      'Finance, Banking, FinTech & Insurance',
    ],
  },
  {
    canonical: 'CEH (Certified Ethical Hacker) / OSCP',
    category: 'Cybersecurity, Cloud & Network Infrastructure',
    aliases: ['ceh', 'certified ethical hacker', 'oscp', 'offensive security', 'gpen', 'giac'],
    verticals: [
      'Cybersecurity & Cloud Infrastructure',
      'Defense, Aerospace & Government Contracting',
    ],
  },
  {
    canonical: 'AWS Certified Solutions Architect (Associate / Professional)',
    category: 'Cybersecurity, Cloud & Network Infrastructure',
    aliases: ['aws solutions architect', 'aws certified solutions architect', 'saa-c03', 'sap-c02', 'aws certified'],
    verticals: [
      'Cybersecurity & Cloud Infrastructure',
      'Technology, Software & SaaS',
      'Artificial Intelligence, Data & Analytics',
      'IT Services, MSP & Technical Support',
    ],
  },
  {
    canonical: 'AWS Certified Cloud Practitioner / Developer / SysOps',
    category: 'Cybersecurity, Cloud & Network Infrastructure',
    aliases: ['aws cloud practitioner', 'clf-c02', 'aws developer', 'aws devops', 'aws sysops'],
    verticals: [
      'Cybersecurity & Cloud Infrastructure',
      'Technology, Software & SaaS',
      'IT Services, MSP & Technical Support',
    ],
  },
  {
    canonical: 'Microsoft Certified: Azure Administrator / Solutions Architect (AZ-104 / AZ-305)',
    category: 'Cybersecurity, Cloud & Network Infrastructure',
    aliases: ['az-104', 'az-305', 'az-900', 'azure administrator', 'azure solutions architect', 'azure fundamentals'],
    verticals: [
      'Cybersecurity & Cloud Infrastructure',
      'IT Services, MSP & Technical Support',
      'Technology, Software & SaaS',
    ],
  },
  {
    canonical: 'Google Cloud Certified (Professional Cloud Architect / Engineer)',
    category: 'Cybersecurity, Cloud & Network Infrastructure',
    aliases: ['gcp certified', 'google cloud architect', 'ace google cloud'],
    verticals: [
      'Cybersecurity & Cloud Infrastructure',
      'Technology, Software & SaaS',
      'Artificial Intelligence, Data & Analytics',
    ],
  },
  {
    canonical: 'CKA / CKAD (Certified Kubernetes Administrator) & Terraform Associate',
    category: 'Cybersecurity, Cloud & Network Infrastructure',
    aliases: ['cka', 'ckad', 'cks', 'kubernetes certified', 'terraform associate', 'hashicorp certified'],
    verticals: [
      'Cybersecurity & Cloud Infrastructure',
      'Technology, Software & SaaS',
    ],
  },

  // 4. AI, DATA ENGINEERING & BUSINESS INTELLIGENCE
  {
    canonical: 'Career Essentials in Generative AI (Microsoft / LinkedIn)',
    category: 'AI, Data Engineering & Business Intelligence',
    aliases: ['career essentials in generative ai', 'generative ai certification', 'microsoft generative ai', 'copilot enablement'],
    verticals: [
      'Artificial Intelligence, Data & Analytics',
      'Technology, Software & SaaS',
      'Education, EdTech, K-12, Higher Ed & Corporate Training',
      'IT Services, MSP & Technical Support',
    ],
  },
  {
    canonical: 'AWS Certified Machine Learning / AI Practitioner',
    category: 'AI, Data Engineering & Business Intelligence',
    aliases: ['aws machine learning', 'aws ai practitioner', 'mls-c01', 'aif-c01'],
    verticals: [
      'Artificial Intelligence, Data & Analytics',
      'Technology, Software & SaaS',
      'Cybersecurity & Cloud Infrastructure',
    ],
  },
  {
    canonical: 'Microsoft Certified: Azure AI Engineer / Data Scientist (AI-102 / DP-100)',
    category: 'AI, Data Engineering & Business Intelligence',
    aliases: ['ai-102', 'ai-900', 'dp-100', 'dp-203', 'azure ai engineer', 'azure data scientist'],
    verticals: [
      'Artificial Intelligence, Data & Analytics',
      'Technology, Software & SaaS',
    ],
  },
  {
    canonical: 'Databricks / Snowflake SnowPro Core Data Certification',
    category: 'AI, Data Engineering & Business Intelligence',
    aliases: ['databricks certified', 'snowpro', 'snowflake certified', 'dbt certified'],
    verticals: [
      'Artificial Intelligence, Data & Analytics',
      'Technology, Software & SaaS',
    ],
  },
  {
    canonical: 'Microsoft Power BI (PL-300) / Tableau Certified Data Analyst',
    category: 'AI, Data Engineering & Business Intelligence',
    aliases: ['pl-300', 'power bi certified', 'tableau certified', 'google data analytics'],
    verticals: [
      'Artificial Intelligence, Data & Analytics',
      'Finance, Banking, FinTech & Insurance',
      'Accounting, Tax, Audit & Advisory',
      'E-Commerce, Retail & Consumer Goods (CPG)',
    ],
  },

  // 5. SKILLED TRADES, CONSTRUCTION, HVAC, ELECTRICAL & PLUMBING
  {
    canonical: 'Master Electrician License',
    category: 'Skilled Trades, Construction, HVAC, Electrical & Plumbing',
    aliases: ['master electrician', 'licensed master electrician', 'electrical contractor license'],
    verticals: [
      'Real Estate, Construction, Facilities & Skilled Trades',
      'Energy, Oil & Gas, Utilities & CleanTech',
      'Manufacturing, Industrial & Production',
    ],
  },
  {
    canonical: 'Journeyman Electrician License',
    category: 'Skilled Trades, Construction, HVAC, Electrical & Plumbing',
    aliases: ['journeyman electrician', 'licensed electrician', 'electrical journeyman', 'apprentice electrician'],
    verticals: [
      'Real Estate, Construction, Facilities & Skilled Trades',
      'Energy, Oil & Gas, Utilities & CleanTech',
      'Manufacturing, Industrial & Production',
    ],
  },
  {
    canonical: 'Master Plumber License',
    category: 'Skilled Trades, Construction, HVAC, Electrical & Plumbing',
    aliases: ['master plumber', 'licensed master plumber', 'plumbing contractor'],
    verticals: [
      'Real Estate, Construction, Facilities & Skilled Trades',
    ],
  },
  {
    canonical: 'Journeyman Plumber License / Backflow Prevention Tester',
    category: 'Skilled Trades, Construction, HVAC, Electrical & Plumbing',
    aliases: ['journeyman plumber', 'licensed plumber', 'plumbing license', 'backflow certified', 'medgas'],
    verticals: [
      'Real Estate, Construction, Facilities & Skilled Trades',
    ],
  },
  {
    canonical: 'EPA Section 608 Universal Certification (HVAC)',
    category: 'Skilled Trades, Construction, HVAC, Electrical & Plumbing',
    aliases: ['epa 608', 'epa universal', 'section 608', 'hvac certified', 'epa 608 universal'],
    verticals: [
      'Real Estate, Construction, Facilities & Skilled Trades',
      'Manufacturing, Industrial & Production',
    ],
  },
  {
    canonical: 'NATE Certified HVAC Technician',
    category: 'Skilled Trades, Construction, HVAC, Electrical & Plumbing',
    aliases: ['nate certified', 'nate hvac', 'hvacr license', 'r-410a'],
    verticals: [
      'Real Estate, Construction, Facilities & Skilled Trades',
    ],
  },
  {
    canonical: 'OSHA 30-Hour (Construction / General Industry)',
    category: 'Skilled Trades, Construction, HVAC, Electrical & Plumbing',
    aliases: ['osha 30', 'osha-30', 'osha 30 hour'],
    verticals: [
      'Real Estate, Construction, Facilities & Skilled Trades',
      'Manufacturing, Industrial & Production',
      'Energy, Oil & Gas, Utilities & CleanTech',
      'Architecture, Civil Engineering & Environmental Services',
      'Wholesale Trade, Supply Chain, Logistics & Distribution',
    ],
  },
  {
    canonical: 'OSHA 10-Hour & HAZWOPER 40-Hour Safety Certification',
    category: 'Skilled Trades, Construction, HVAC, Electrical & Plumbing',
    aliases: ['osha 10', 'osha-10', 'osha 10 hour', 'hazwoper', 'hazwoper 40'],
    verticals: [
      'Real Estate, Construction, Facilities & Skilled Trades',
      'Manufacturing, Industrial & Production',
      'Energy, Oil & Gas, Utilities & CleanTech',
      'Agriculture, Forestry, Conservation & Outdoor',
    ],
  },
  {
    canonical: 'AWS Certified Welder (CW) / Certified Welding Inspector (CWI)',
    category: 'Skilled Trades, Construction, HVAC, Electrical & Plumbing',
    aliases: ['aws certified welder', 'cwi', 'certified welding inspector', 'tig welding', 'mig welding', '6g welder'],
    verticals: [
      'Real Estate, Construction, Facilities & Skilled Trades',
      'Manufacturing, Industrial & Production',
      'Energy, Oil & Gas, Utilities & CleanTech',
    ],
  },
  {
    canonical: 'NCCCO Certified Crane Operator / Heavy Equipment & Forklift Certified',
    category: 'Skilled Trades, Construction, HVAC, Electrical & Plumbing',
    aliases: ['nccco', 'crane operator', 'forklift certified', 'forklift license', 'aerial lift', 'scissor lift'],
    verticals: [
      'Real Estate, Construction, Facilities & Skilled Trades',
      'Wholesale Trade, Supply Chain, Logistics & Distribution',
      'Manufacturing, Industrial & Production',
    ],
  },
  {
    canonical: 'Licensed General Contractor / Boiler Operator / Stationary Engineer',
    category: 'Skilled Trades, Construction, HVAC, Electrical & Plumbing',
    aliases: ['general contractor license', 'boiler operator', 'stationary engineer', 'cfm', 'certified facility manager'],
    verticals: [
      'Real Estate, Construction, Facilities & Skilled Trades',
      'Manufacturing, Industrial & Production',
    ],
  },

  // 6. TRANSPORTATION, CDL, AUTOMOTIVE, AVIATION & MARINE
  {
    canonical: 'CDL Class A (Commercial Driver License)',
    category: 'Transportation, CDL, Automotive, Aviation & Marine',
    aliases: ['cdl-a', 'cdl class a', 'class a cdl', 'commercial driver license'],
    verticals: [
      'Automotive, Aviation, Marine & Transportation',
      'Wholesale Trade, Supply Chain, Logistics & Distribution',
      'Real Estate, Construction, Facilities & Skilled Trades',
      'Energy, Oil & Gas, Utilities & CleanTech',
    ],
  },
  {
    canonical: 'CDL Class B / Passenger / HazMat / Tanker Endorsement',
    category: 'Transportation, CDL, Automotive, Aviation & Marine',
    aliases: ['cdl-b', 'cdl class b', 'class b cdl', 'hazmat endorsement', 'tanker endorsement', 'twic card', 'twic'],
    verticals: [
      'Automotive, Aviation, Marine & Transportation',
      'Wholesale Trade, Supply Chain, Logistics & Distribution',
      'Energy, Oil & Gas, Utilities & CleanTech',
    ],
  },
  {
    canonical: 'ASE Certified Master Automobile / Medium-Heavy Truck Technician',
    category: 'Transportation, CDL, Automotive, Aviation & Marine',
    aliases: ['ase certified', 'ase master tech', 'ase mechanic', 'epa 609'],
    verticals: [
      'Automotive, Aviation, Marine & Transportation',
    ],
  },
  {
    canonical: 'FAA Airframe & Powerplant (A&P) Mechanic / Avionics License',
    category: 'Transportation, CDL, Automotive, Aviation & Marine',
    aliases: ['a&p license', 'faa a&p', 'airframe and powerplant', 'ia inspection authorization'],
    verticals: [
      'Automotive, Aviation, Marine & Transportation',
      'Defense, Aerospace & Government Contracting',
    ],
  },
  {
    canonical: 'FAA Commercial Pilot / ATP / Part 107 Remote Pilot (Drone)',
    category: 'Transportation, CDL, Automotive, Aviation & Marine',
    aliases: ['faa part 107', 'part 107', 'atp pilot', 'commercial pilot license', 'cfi'],
    verticals: [
      'Automotive, Aviation, Marine & Transportation',
      'Defense, Aerospace & Government Contracting',
      'Agriculture, Forestry, Conservation & Outdoor',
    ],
  },
  {
    canonical: 'USCG Merchant Mariner Credential (MMC) / Captain License',
    category: 'Transportation, CDL, Automotive, Aviation & Marine',
    aliases: ['uscg captain', 'merchant mariner', 'mmc', 'stcw'],
    verticals: [
      'Automotive, Aviation, Marine & Transportation',
    ],
  },

  // 7. HEALTHCARE, NURSING, CLINICAL & LIFE SCIENCES
  {
    canonical: 'Registered Nurse (RN) — Active State / Multi-State Compact License',
    category: 'Healthcare, Nursing, Clinical & Life Sciences',
    aliases: ['rn', 'registered nurse', 'bsn', 'compact rn', 'nclex-rn'],
    verticals: [
      'Healthcare, Biotech, Pharma & Life Sciences',
    ],
  },
  {
    canonical: 'Nurse Practitioner (APRN / FNP / ACNP) or Physician Assistant (PA-C)',
    category: 'Healthcare, Nursing, Clinical & Life Sciences',
    aliases: ['aprn', 'np', 'fnp', 'fnp-c', 'pa-c', 'nurse practitioner', 'physician assistant'],
    verticals: [
      'Healthcare, Biotech, Pharma & Life Sciences',
    ],
  },
  {
    canonical: 'Doctor of Medicine (MD / DO) — Board Certified Physician',
    category: 'Healthcare, Nursing, Clinical & Life Sciences',
    aliases: ['md', 'do', 'board certified physician', 'medical license'],
    verticals: [
      'Healthcare, Biotech, Pharma & Life Sciences',
    ],
  },
  {
    canonical: 'LPN / LVN (Licensed Practical / Vocational Nurse) & CNA',
    category: 'Healthcare, Nursing, Clinical & Life Sciences',
    aliases: ['lpn', 'lvn', 'cna', 'certified nursing assistant', 'licensed practical nurse'],
    verticals: [
      'Healthcare, Biotech, Pharma & Life Sciences',
    ],
  },
  {
    canonical: 'AHA BLS / ACLS / PALS (Basic & Advanced Cardiac Life Support)',
    category: 'Healthcare, Nursing, Clinical & Life Sciences',
    aliases: ['bls', 'acls', 'pals', 'cpr certified', 'aha bls', 'basic life support'],
    verticals: [
      'Healthcare, Biotech, Pharma & Life Sciences',
      'Public Safety, Law Enforcement, Fire & Emergency Services',
      'Fitness, Wellness, Sports & Personal Care Services',
    ],
  },
  {
    canonical: 'Certified Medical Assistant (CMA / RMA) / Phlebotomy (CPT)',
    category: 'Healthcare, Nursing, Clinical & Life Sciences',
    aliases: ['cma', 'rma', 'ccma', 'cpt', 'phlebotomy certified', 'medical assistant certified'],
    verticals: [
      'Healthcare, Biotech, Pharma & Life Sciences',
    ],
  },
  {
    canonical: 'Pharmacist (PharmD / RPh) & Certified Pharmacy Technician (CPhT)',
    category: 'Healthcare, Nursing, Clinical & Life Sciences',
    aliases: ['pharmd', 'rph', 'cpht', 'pharmacy technician', 'ptcb'],
    verticals: [
      'Healthcare, Biotech, Pharma & Life Sciences',
      'E-Commerce, Retail & Consumer Goods (CPG)',
    ],
  },
  {
    canonical: 'CPC / CCS Certified Medical Coder & RHIA / RHIT Health Info',
    category: 'Healthcare, Nursing, Clinical & Life Sciences',
    aliases: ['cpc', 'aapc', 'ahima', 'ccs', 'rhia', 'rhit', 'medical coding certified'],
    verticals: [
      'Healthcare, Biotech, Pharma & Life Sciences',
    ],
  },
  {
    canonical: 'ACRP / SOCRA Clinical Research Certification (CCRC / CCRA) & GCP',
    category: 'Healthcare, Nursing, Clinical & Life Sciences',
    aliases: ['ccrc', 'ccra', 'acrp', 'socra', 'good clinical practice', 'gcp', 'clia', 'ascp'],
    verticals: [
      'Healthcare, Biotech, Pharma & Life Sciences',
    ],
  },
  {
    canonical: 'LCSW / LPC / LMFT (Licensed Clinical Social Worker / Therapist)',
    category: 'Healthcare, Nursing, Clinical & Life Sciences',
    aliases: ['lcsw', 'lmsw', 'lpc', 'lmft', 'bcba', 'licensed therapist'],
    verticals: [
      'Healthcare, Biotech, Pharma & Life Sciences',
      'Non-Profit, Philanthropy & Civic Organizations',
      'Education, EdTech, K-12, Higher Ed & Corporate Training',
    ],
  },

  // 8. FINANCE, ACCOUNTING, TAX, AUDIT & INSURANCE
  {
    canonical: 'CPA (Certified Public Accountant)',
    category: 'Finance, Accounting, Tax, Audit & Insurance',
    aliases: ['cpa', 'certified public accountant', 'active cpa'],
    verticals: [
      'Accounting, Tax, Audit & Advisory',
      'Finance, Banking, FinTech & Insurance',
    ],
  },
  {
    canonical: 'CFA (Chartered Financial Analyst)',
    category: 'Finance, Accounting, Tax, Audit & Insurance',
    aliases: ['cfa', 'chartered financial analyst', 'cfa level'],
    verticals: [
      'Finance, Banking, FinTech & Insurance',
      'Accounting, Tax, Audit & Advisory',
    ],
  },
  {
    canonical: 'CFP (Certified Financial Planner)',
    category: 'Finance, Accounting, Tax, Audit & Insurance',
    aliases: ['cfp', 'certified financial planner'],
    verticals: [
      'Finance, Banking, FinTech & Insurance',
    ],
  },
  {
    canonical: 'EA (IRS Enrolled Agent) / QuickBooks ProAdvisor',
    category: 'Finance, Accounting, Tax, Audit & Insurance',
    aliases: ['enrolled agent', 'irs ea', 'quickbooks proadvisor', 'cpp payroll'],
    verticals: [
      'Accounting, Tax, Audit & Advisory',
      'Finance, Banking, FinTech & Insurance',
    ],
  },
  {
    canonical: 'CIA (Certified Internal Auditor) / CFE (Certified Fraud Examiner) / CMA',
    category: 'Finance, Accounting, Tax, Audit & Insurance',
    aliases: ['cia', 'certified internal auditor', 'cfe', 'certified fraud examiner', 'cma accounting', 'cams'],
    verticals: [
      'Accounting, Tax, Audit & Advisory',
      'Finance, Banking, FinTech & Insurance',
    ],
  },
  {
    canonical: 'FINRA SIE, Series 7 & Series 63 / 65 / 66 / 79 Securities Licenses',
    category: 'Finance, Accounting, Tax, Audit & Insurance',
    aliases: ['series 7', 'series 63', 'series 65', 'series 66', 'series 6', 'series 79', 'series 24', 'finra sie'],
    verticals: [
      'Finance, Banking, FinTech & Insurance',
    ],
  },
  {
    canonical: 'State Insurance Producer License (Life & Health / Property & Casualty)',
    category: 'Finance, Accounting, Tax, Audit & Insurance',
    aliases: ['property and casualty license', 'p&c license', 'life and health license', 'cpcu', 'claims adjuster license'],
    verticals: [
      'Finance, Banking, FinTech & Insurance',
    ],
  },
  {
    canonical: 'NMLS Licensed Mortgage Loan Originator (MLO)',
    category: 'Finance, Accounting, Tax, Audit & Insurance',
    aliases: ['nmls', 'mlo', 'mortgage loan originator'],
    verticals: [
      'Finance, Banking, FinTech & Insurance',
      'Real Estate, Construction, Facilities & Skilled Trades',
    ],
  },

  // 9. DEFENSE, GOVERNMENT, CLEARANCE & PUBLIC SAFETY
  {
    canonical: 'Active U.S. Security Clearance (Secret / Top Secret / TS-SCI)',
    category: 'Defense, Government, Clearance & Public Safety',
    aliases: ['secret clearance', 'top secret', 'ts/sci', 'ts-sci', 'public trust', 'dod clearance', 'q clearance'],
    verticals: [
      'Defense, Aerospace & Government Contracting',
      'Government & Public Administration (Federal, State & Local)',
      'Cybersecurity & Cloud Infrastructure',
    ],
  },
  {
    canonical: 'DoD 8570 / 8140 IAT / IAM Level II or Level III Compliant',
    category: 'Defense, Government, Clearance & Public Safety',
    aliases: ['dod 8570', 'dod 8140', 'iat level ii', 'iat level iii', 'iam level'],
    verticals: [
      'Defense, Aerospace & Government Contracting',
      'Cybersecurity & Cloud Infrastructure',
      'Government & Public Administration (Federal, State & Local)',
    ],
  },
  {
    canonical: 'NREMT Paramedic / EMT-Basic & Firefighter I / II Certification',
    category: 'Defense, Government, Clearance & Public Safety',
    aliases: ['nremt', 'paramedic', 'emt-b', 'emt-p', 'firefighter i', 'firefighter ii', 'nfpa'],
    verticals: [
      'Public Safety, Law Enforcement, Fire & Emergency Services',
      'Healthcare, Biotech, Pharma & Life Sciences',
    ],
  },
  {
    canonical: 'POST / TCOLE Peace Officer License & State Security Guard Card',
    category: 'Defense, Government, Clearance & Public Safety',
    aliases: ['post certified', 'tcole', 'peace officer', 'law enforcement license', 'armed guard card', 'cpp security'],
    verticals: [
      'Public Safety, Law Enforcement, Fire & Emergency Services',
      'Government & Public Administration (Federal, State & Local)',
    ],
  },
  {
    canonical: 'FAC-C / DAWIA Federal Contracting & Certified Public Procurement (CPPO)',
    category: 'Defense, Government, Clearance & Public Safety',
    aliases: ['fac-c', 'dawia', 'cppo', 'cppb', 'cfcm', 'federal contracting'],
    verticals: [
      'Government & Public Administration (Federal, State & Local)',
      'Defense, Aerospace & Government Contracting',
    ],
  },

  // 10. LEGAL, HR, RECRUITING & COMPLIANCE
  {
    canonical: 'Active State Bar License (Attorney / JD)',
    category: 'Legal, HR, Recruiting & Compliance',
    aliases: ['state bar', 'bar license', 'licensed attorney', 'esquire', 'member of the bar'],
    verticals: [
      'Legal, HR, Staffing, Recruiting & Management Consulting',
    ],
  },
  {
    canonical: 'Certified Paralegal (NALA CP / NFPA RP) & Notary Public Commission',
    category: 'Legal, HR, Recruiting & Compliance',
    aliases: ['certified paralegal', 'nala cp', 'notary public', 'legal assistant certified'],
    verticals: [
      'Legal, HR, Staffing, Recruiting & Management Consulting',
      'Real Estate, Construction, Facilities & Skilled Trades',
      'Finance, Banking, FinTech & Insurance',
    ],
  },
  {
    canonical: 'SHRM-CP / SHRM-SCP (SHRM Certified Professional)',
    category: 'Legal, HR, Recruiting & Compliance',
    aliases: ['shrm-cp', 'shrm-scp', 'shrm certified'],
    verticals: [
      'Legal, HR, Staffing, Recruiting & Management Consulting',
    ],
  },
  {
    canonical: 'HRCI PHR / SPHR (Professional in Human Resources)',
    category: 'Legal, HR, Recruiting & Compliance',
    aliases: ['phr', 'sphr', 'apri', 'gphr', 'hrci'],
    verticals: [
      'Legal, HR, Staffing, Recruiting & Management Consulting',
    ],
  },
  {
    canonical: 'IAPP CIPP/US / CIPM (Certified Information Privacy Professional)',
    category: 'Legal, HR, Recruiting & Compliance',
    aliases: ['cipp/us', 'cipp/e', 'cipm', 'iapp', 'privacy certified'],
    verticals: [
      'Legal, HR, Staffing, Recruiting & Management Consulting',
      'Cybersecurity & Cloud Infrastructure',
    ],
  },

  // 11. SUPPLY CHAIN, LOGISTICS, MANUFACTURING & QUALITY
  {
    canonical: 'ASCM / APICS CSCP & CPIM (Certified Supply Chain & Inventory Management)',
    category: 'Supply Chain, Logistics, Manufacturing & Quality',
    aliases: ['cscp', 'cpim', 'apics', 'ascm', 'cltd', 'cpsm'],
    verticals: [
      'Wholesale Trade, Supply Chain, Logistics & Distribution',
      'Manufacturing, Industrial & Production',
      'E-Commerce, Retail & Consumer Goods (CPG)',
    ],
  },
  {
    canonical: 'ASQ Certified Quality Engineer (CQE) / ISO 9001 Lead Auditor / CNC NIMS',
    category: 'Supply Chain, Logistics, Manufacturing & Quality',
    aliases: ['cqe', 'asq', 'iso 9001', 'iatf 16949', 'as9100', 'nims cnc', 'gd&t'],
    verticals: [
      'Manufacturing, Industrial & Production',
      'Defense, Aerospace & Government Contracting',
      'Automotive, Aviation, Marine & Transportation',
    ],
  },
  {
    canonical: 'Licensed U.S. Customs Broker (LCB) & IATA Dangerous Goods (DGR)',
    category: 'Supply Chain, Logistics, Manufacturing & Quality',
    aliases: ['customs broker', 'lcb', 'iata dgr', 'import export license'],
    verticals: [
      'Wholesale Trade, Supply Chain, Logistics & Distribution',
    ],
  },

  // 12. HOSPITALITY, FOOD SAFETY & CUSTOMER OPERATIONS
  {
    canonical: 'ServSafe Food Protection Manager / Food Handler Certification',
    category: 'Hospitality, Food Safety & Customer Operations',
    aliases: ['servsafe', 'servsafe manager', 'food handler card', 'food protection manager', 'haccp'],
    verticals: [
      'Hospitality, Food Service, Restaurants & Travel',
      'E-Commerce, Retail & Consumer Goods (CPG)',
    ],
  },
  {
    canonical: 'TIPS / TABC Alcohol Seller-Server Certification & Sommelier / Cicerone',
    category: 'Hospitality, Food Safety & Customer Operations',
    aliases: ['tips certified', 'tabc', 'rbs alcohol', 'sommelier', 'cicerone'],
    verticals: [
      'Hospitality, Food Service, Restaurants & Travel',
    ],
  },
  {
    canonical: 'Certified Hotel Administrator (CHA) / CMP (Certified Meeting Professional)',
    category: 'Hospitality, Food Safety & Customer Operations',
    aliases: ['cha hotel', 'cmp meeting', 'chia hospitality'],
    verticals: [
      'Hospitality, Food Service, Restaurants & Travel',
    ],
  },
  {
    canonical: 'Salesforce Certified Administrator / Service Cloud Consultant',
    category: 'Hospitality, Food Safety & Customer Operations',
    aliases: ['salesforce certified', 'salesforce admin', 'zendesk certified', 'copc'],
    verticals: [
      'BPO, Contact Center & Customer Operations',
      'Technology, Software & SaaS',
      'E-Commerce, Retail & Consumer Goods (CPG)',
    ],
  },

  // 13. ARCHITECTURE, CIVIL ENGINEERING, REAL ESTATE & ENERGY
  {
    canonical: 'Professional Engineer (PE) License / EIT (Engineer in Training)',
    category: 'Architecture, Civil Engineering, Real Estate & Energy',
    aliases: ['pe license', 'professional engineer', 'eit', 'fe exam', 'structural engineer se'],
    verticals: [
      'Architecture, Civil Engineering & Environmental Services',
      'Real Estate, Construction, Facilities & Skilled Trades',
      'Energy, Oil & Gas, Utilities & CleanTech',
      'Manufacturing, Industrial & Production',
    ],
  },
  {
    canonical: 'Registered Architect (NCARB / AIA) & LEED AP (Building Design)',
    category: 'Architecture, Civil Engineering, Real Estate & Energy',
    aliases: ['registered architect', 'ncarb', 'aia', 'leed ap', 'leed green associate', 'aicp'],
    verticals: [
      'Architecture, Civil Engineering & Environmental Services',
      'Real Estate, Construction, Facilities & Skilled Trades',
    ],
  },
  {
    canonical: 'Active Real Estate Broker / Salesperson License & CAM / CPM Property Mgmt',
    category: 'Architecture, Civil Engineering, Real Estate & Energy',
    aliases: ['real estate license', 'real estate broker', 'realtor', 'cam', 'cpm property', 'ccim'],
    verticals: [
      'Real Estate, Construction, Facilities & Skilled Trades',
    ],
  },
  {
    canonical: 'NABCEP Solar PV Installation Professional & NERC System Operator / WellSharp',
    category: 'Architecture, Civil Engineering, Real Estate & Energy',
    aliases: ['nabcep', 'nerc', 'iadc wellsharp', 'cem energy manager', 'part 46 msha'],
    verticals: [
      'Energy, Oil & Gas, Utilities & CleanTech',
    ],
  },
  {
    canonical: 'ISA Certified Arborist / Commercial Pesticide Applicator / DVM',
    category: 'Architecture, Civil Engineering, Real Estate & Energy',
    aliases: ['certified arborist', 'pesticide applicator', 'cca agronomy', 'dvm', 'cvt veterinary'],
    verticals: [
      'Agriculture, Forestry, Conservation & Outdoor',
    ],
  },

  // 14. EDUCATION, ENABLEMENT, ACCESSIBILITY & CREATIVE
  {
    canonical: 'State K-12 Teaching License / Educator Certification & TESOL / TEFL',
    category: 'Education, Enablement, Accessibility & Creative',
    aliases: ['teaching license', 'teacher certification', 'k-12 certified', 'tesol', 'tefl'],
    verticals: [
      'Education, EdTech, K-12, Higher Ed & Corporate Training',
    ],
  },
  {
    canonical: 'ATD CPTD / CPLP (Talent Development & Technical Enablement)',
    category: 'Education, Enablement, Accessibility & Creative',
    aliases: ['cptd', 'cplp', 'atd certified', 'instructional design certificate', 'technical trainer'],
    verticals: [
      'Education, EdTech, K-12, Higher Ed & Corporate Training',
      'Technology, Software & SaaS',
      'IT Services, MSP & Technical Support',
    ],
  },
  {
    canonical: 'Microsoft Accessibility in Action / IAAP CPACC / WAS (Digital Accessibility)',
    category: 'Education, Enablement, Accessibility & Creative',
    aliases: ['microsoft accessibility in action', 'accessibility in action', 'cpacc', 'iaap', 'section 508 trusted tester', 'wcag certified'],
    verticals: [
      'Education, EdTech, K-12, Higher Ed & Corporate Training',
      'Technology, Software & SaaS',
      'Government & Public Administration (Federal, State & Local)',
    ],
  },
  {
    canonical: 'Google Ads / Meta Blueprint / HubSpot Digital Marketing Certified',
    category: 'Education, Enablement, Accessibility & Creative',
    aliases: ['google ads certified', 'google analytics certified', 'hubspot certified', 'meta blueprint'],
    verticals: [
      'Media, Marketing, Advertising, Gaming & Entertainment',
      'E-Commerce, Retail & Consumer Goods (CPG)',
    ],
  },
  {
    canonical: 'Adobe Certified Professional / Unity Certified / NASM CPT / Cosmetology License',
    category: 'Education, Enablement, Accessibility & Creative',
    aliases: ['adobe certified', 'unity certified', 'nasm cpt', 'ace personal trainer', 'cscc', 'cosmetology license', 'esthetician license', 'lmt massage', 'cfre fundraising'],
    verticals: [
      'Arts, Design, Photography & Creative Studios',
      'Media, Marketing, Advertising, Gaming & Entertainment',
      'Fitness, Wellness, Sports & Personal Care Services',
      'Non-Profit, Philanthropy & Civic Organizations',
    ],
  },
]

/**
 * Returns certifications prioritized for a given Industry Vertical:
 * 1. Vertical-specific certifications
 * 2. Cross-Industry PM, Agile & Operations certifications
 * 3. Remaining certifications (when includeAll is true)
 */
export function getCertificationsForIndustry(industryVertical?: string | null) {
  const cleanVertical = (industryVertical || '').trim()
  const domainRecommended: CertificationDefinition[] = []
  const crossIndustry: CertificationDefinition[] = []
  const otherVerticals: CertificationDefinition[] = []

  for (const cert of STANDARD_CERTIFICATIONS) {
    if (cert.verticals.includes('*')) {
      crossIndustry.push(cert)
    } else if (cleanVertical && cert.verticals.includes(cleanVertical)) {
      domainRecommended.push(cert)
    } else {
      otherVerticals.push(cert)
    }
  }

  return {
    domainRecommended,
    crossIndustry,
    otherVerticals,
  }
}

/**
 * Normalizes a single raw certification token (e.g. "A+ Certified", "PMP", "EPA 608")
 * to its canonical label if a match is found, or returns the cleaned original string.
 */
export function normalizeSingleCertification(rawToken: string): string {
  const cleaned = rawToken.trim()
  if (!cleaned) return ''
  const lower = cleaned.toLowerCase()

  for (const cert of STANDARD_CERTIFICATIONS) {
    if (cert.canonical.toLowerCase() === lower) {
      return cert.canonical
    }
    for (const alias of cert.aliases) {
      if (alias.toLowerCase() === lower) {
        return cert.canonical
      }
    }
  }

  return cleaned
}

/**
 * Splits a comma-separated string of certifications, normalizes recognized aliases
 * to canonical labels, deduplicates, and returns a clean array of strings.
 */
export function parseAndNormalizeCertifications(rawCsv?: string | null): string[] {
  if (!rawCsv) return []
  const tokens = String(rawCsv)
    .split(/[,;•\n]+/)
    .map((t) => normalizeSingleCertification(t))
    .filter(Boolean)

  const seen = new Set<string>()
  const unique: string[] = []
  for (const t of tokens) {
    const key = t.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(t)
    }
  }
  return unique
}

/**
 * Deterministic matcher used by the 5-Point AI Fit Radar and Dealbreaker Engine.
 * Evaluates each required certification against the candidate's certifications & corpus,
 * handling 2-character credentials (e.g., "A+", "RN", "PE") and synonym aliases accurately.
 */
export function evaluateCertificationMatch(
  candidateCertsRaw: string,
  candidateFullCorpusLower: string,
  requiredCertsRaw: string
): { totalRequired: number; matchedCount: number; matchedLabels: string[] } {
  const reqTokens = String(requiredCertsRaw || '')
    .split(/[,;•/\n]+/)
    .map((c) => c.trim())
    .filter((c) => c && c.toLowerCase() !== 'none' && c.toLowerCase() !== 'none specified')

  if (reqTokens.length === 0) {
    return { totalRequired: 0, matchedCount: 0, matchedLabels: [] }
  }

  const candCanonicalList = parseAndNormalizeCertifications(candidateCertsRaw).map((c) =>
    c.toLowerCase()
  )
  const candRawLower = String(candidateCertsRaw || '').toLowerCase()

  const matchedLabels: string[] = []

  for (const reqRaw of reqTokens) {
    const reqNormalized = normalizeSingleCertification(reqRaw)
    const reqNormLower = reqNormalized.toLowerCase()
    const reqRawLower = reqRaw.toLowerCase()

    // Find taxonomy definition if available
    const taxonomyDef = STANDARD_CERTIFICATIONS.find(
      (c) =>
        c.canonical.toLowerCase() === reqNormLower ||
        c.aliases.some((a) => a.toLowerCase() === reqRawLower)
    )

    let isMatch = false

    // 1. Direct canonical match in candidate's parsed certifications
    if (candCanonicalList.includes(reqNormLower) || candCanonicalList.includes(reqRawLower)) {
      isMatch = true
    }

    // 2. Check taxonomy aliases against candidate's certifications & full corpus
    if (!isMatch && taxonomyDef) {
      const termsToCheck = [
        taxonomyDef.canonical.toLowerCase(),
        ...taxonomyDef.aliases.map((a) => a.toLowerCase()),
      ]
      for (const term of termsToCheck) {
        // Word-boundary safe check for short terms like "a+", "rn", "pe", "cpa"
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const boundaryRegex = new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i')
        if (boundaryRegex.test(candRawLower) || boundaryRegex.test(candidateFullCorpusLower)) {
          isMatch = true
          break
        }
      }
    }

    // 3. Fallback substring / phrase match for custom credentials (including 2-char tokens like A+)
    if (!isMatch) {
      const escapedRaw = reqRawLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const rawRegex = new RegExp(`(^|[^a-z0-9])${escapedRaw}($|[^a-z0-9])`, 'i')
      if (rawRegex.test(candRawLower) || rawRegex.test(candidateFullCorpusLower)) {
        isMatch = true
      }
    }

    if (isMatch) {
      matchedLabels.push(reqNormalized)
    }
  }

  return {
    totalRequired: reqTokens.length,
    matchedCount: matchedLabels.length,
    matchedLabels,
  }
}
