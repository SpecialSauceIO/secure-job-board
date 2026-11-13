# SpecialSauce Audit & Parity State

## Locked Decisions & Parity Rules
- 100% `ss` CLI for all repo ops (`ss status`, `ss find`, `ss inspect`, `ss patch`, `ss verify-local`, `ss stage`, `ss prod`).
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

## Remaining Dashboard Pages to Audit
- None — all dashboard modules audited and aligned!
