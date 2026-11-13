# SpecialSauce Audit & Parity State

## Locked Decisions & Parity Rules
- 100% `ss` CLI for all repo ops (`ss status`, `ss find`, `ss audit-copy`, `ss inspect`, `ss patch --json`, `ss verify-local`, `ss stage`, `ss prod`) in `text` fences only.
- One Page / One Feature per chat (retire chat after `ss prod` or ~15 turns).
- Plain English across customer-facing UI; zero 'Candidate', 'sandbox', 'double-blind', or 'cohort'.
- TrueFit v2.2 deterministic cache (`tf_v2_2_`, `cand_v5_`, `emp_v5_`) & whole-word search (`it`, `aws`, `okr`).

## Completed & Live on Production (`origin/main`)
- [x] Resume Auto-Fill & Profile Editor (skill years, <=4y GenAI cap, cert cross-filter, 16-pill preview)
- [x] Employer One-Click Role Generator (seniority/type match, cert rescue, skill tenure matrix)
- [x] Employer Talent Search (`Search Talent` presets, Practice Mode UX, whole-word search, TrueFit v2.2)
- [x] Professional Job Discovery (`Find Roles` Practice Mode copy, locked counts, clear filters, cert search, dealbreakers)
- [x] Professional Overview (`src/app/dashboard/page.tsx` — live Saved Roles count, dealbreaker-filtered Recommended Roles, whole-word skill/cert ranking)
- [x] Outbound Applications (`src/app/dashboard/applications/page.tsx` — locked status tab counts, whole-word & cert search, Clear Filters, 5s live thread poll, `ss clip`)
- [x] Professional Invitations (`src/app/dashboard/requests/page.tsx` — locked status tab counts, timeframe + whole-word & cert search, Clear Filters, 5s live poll, TrueFit refresh)
- [x] Match Preferences (`src/app/dashboard/preferences/page.tsx` & `CandidatePreferencesForm.tsx` — reactive work-model/location sync, Paused inbound invitation lock, and plain-English copy)
- [x] Employer Manage Roles & Inbound Applicants (`src/app/dashboard/employer/jobs/page.tsx`, `EmployerJobsTableClient.tsx`, `src/app/dashboard/employer/applications/page.tsx`, `ApplicationRevealCard.tsx`, `SecureMessageThread.tsx` — whole-word & cert search, `structured_skills` coverage, committed search + Clear Filters, 30-day renewal gate)

- [x] Support & Membership / Plan Settings (`SupportCenterClient.tsx`, `src/app/dashboard/support/page.tsx`, `src/app/dashboard/billing/page.tsx`, `src/app/dashboard/employer/billing/page.tsx`, `src/constants/faqs.ts` — Practice Mode & plain-English copy, Membership & Plan Settings parity, whole-word FAQ search + Clear, $0/mo empty-state CTA & `?tab=ticket` gate, 5s live ticket poll, fenced `ss inspect` clipboard)

- [x] Auth, Signup & Onboarding (`src/app/signup/page.tsx`, `src/app/signup/candidate/page.tsx`, `src/app/signup/employer/page.tsx`, `src/app/signup/actions.ts`, `src/app/login/page.tsx`, `src/app/login/actions.ts`, `src/app/onboarding/page.tsx`, `src/components/OnboardingPlanStep.tsx` — Practice Mode & plain-English copy, Test Inbox OTP/reset banners, locked pricing & verification gates)

- [x] Public Marketing & Pricing (`src/app/page.tsx`, `src/app/pricing/page.tsx`, `src/app/workflows/page.tsx`, `src/app/faq/page.tsx`, `src/components/PublicFaqClient.tsx`, `scripts/ss_dev.py` — Explorer vs Practice Mode clarity, Employer Verification Pass copy, whole-word FAQ search + Clear/Reset Filters, `ss audit-copy` + `sandbox` gate)

- [x] Public Security & Legal + Dashboard Wrappers (`src/app/security/page.tsx`, `src/components/SecurityTrustClient.tsx`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/app/dashboard/security/page.tsx`, `src/app/dashboard/workflows/page.tsx`, `scripts/ss_dev.py` — Practice Mode legal copy parity, Standard/Technical security specs, dashboard route containment, and `ss patch --json` stream guard)

- [x] Employer Organization, Verification, Team Seats & HR Sync (`src/app/dashboard/employer/organization/page.tsx`, `EmployerOrganizationForm.tsx`, `EmployerTeamSeatsPanel.tsx`, `EnterpriseAtsIntegrationPanel.tsx`, `src/app/dashboard/actions.ts`, `scripts/ss_dev.py` — Starter 2-seat unlock, Growth 5-seat & Enterprise Unlimited seat display, plain-English recruiter copy, Dev QA labels, and hardened `ss` CLI clipboard/JSON guards)

- [x] Secondary Dashboard Views (`src/app/dashboard/employer/pitches/page.tsx`, `src/app/dashboard/post-job/page.tsx`, `src/app/dashboard/actions.ts` — locked status tab counts, whole-word & cert search, `structured_skills` coverage, Clear Filters, 5s live thread poll, legacy `/dashboard/post-job` redirect to `/dashboard/employer/jobs/new`; skipping `horizon` while in development)

## Remaining Public, Secondary & Ops Modules to Audit (In Order)
- [ ] Operations Console (`special-sauce-ops` + `ss --ops` flag alignment)
