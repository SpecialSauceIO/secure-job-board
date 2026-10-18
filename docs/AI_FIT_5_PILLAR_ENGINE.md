# Special Sauce™ 5-Pillar AI Fit Engine — Technical Specification

## Overview
The Special Sauce™ Double-Blind Matching Engine evaluates candidate-to-role fit across **five objective competency pillars** (scored `0–100` per pillar, plus a weighted `overall_score`).

Crucially, the engine is architected to eliminate demographic bias, pedigree bias, and the **"Mid-Life Career Changer Trap"** by evaluating **Skill-Specific Tenure** inside the candidate's structured skill matrix rather than relying solely on blunt, career-wide years of work history.

---

## The 5 Evaluation Pillars

### 1. Technical Skills (Core Competency Depth)
* **What It Measures:** Semantic overlap between the employer's structured job requirements (`structured_requirements`) and the candidate's verified skills (`structured_skills`), tools, and active credentials.
* **Semantic Equivalence:** Recognizes synonyms, abbreviations, and equivalent technologies (e.g., `JS` = `JavaScript`, `Sec+` = `CompTIA Security+`, `Tech Support` = `Technical Support`).

### 2. Experience Level (Skill-Specific Tenure + Transferable Maturity)
* **What It Measures:** Hands-on years of experience **per individual skill** compared against the specific years requested for each core job requirement.
* **Career-Changer Fairness Protocol:**
  * When a professional transitions careers mid-life (for example, 15 years of total work history with 2 years in a new technical discipline), naive ATS filters either over-rank them based on 15 total years or reset them to zero like an entry-level graduate.
  * Special Sauce™ anchors **Experience Level** on **Skill-Specific Tenure** (years spent practicing the target role's required skills) while awarding up to a **+15 point Transferable Professional Maturity credit** for prior leadership, stakeholder communication, and operational execution.

### 3. Role Alignment (Scope, Logistics & Practical Equivalence)
* **What It Measures:** Day-to-day functional scope, Work Model & Location compatibility (`Remote`, `Hybrid`, `On-Site`), Language proficiency & modality (`Written`, `Verbal`, `Both`), and Education/Certification alignment.
* **Practical Experience Equivalence:** Whenever a role specifies *"OR Equivalent Practical Experience"* or *"No Degree Required"*, candidates with strong hands-on skill tenure or industry certifications receive **100% credit** on education alignment regardless of formal degree status.

### 4. Domain Expertise (Industry Vertical Context)
* **What It Measures:** Alignment between the candidate's Primary Industry Vertical experience and the employer's operational domain (e.g., SaaS, FinTech, Healthcare, BPO/Customer Operations, Cybersecurity).
* **Cross-Industry Value:** Rewards career changers who transition from an industry vertical into a technical or operational role serving that same vertical.

### 5. Culture & Soft Skills (Execution & Collaboration Signals)
* **What It Measures:** Evidence of communication clarity, cross-functional collaboration, mentorship, problem-solving ownership, and adaptability extracted from the candidate's blind bio and accomplishment summary.
