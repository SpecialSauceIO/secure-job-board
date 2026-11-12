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

## Remaining Dashboard Pages to Audit
- [ ] Outbound Applications (`src/app/dashboard/applications` / `CandidateApplications.tsx`)
- [ ] Professional Invitations (`src/app/dashboard/invitations`)
- [ ] Match Preferences (`src/app/dashboard/preferences`)
- [ ] Employer Manage Roles & Inbound Applicants (`ApplicationRevealCard.tsx` / `SecureMessageThread.tsx`)
- [ ] Support & Membership / Plan Settings (`SupportCenterClient.tsx` / `billing`)
