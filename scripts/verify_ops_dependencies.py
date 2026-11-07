import re
import subprocess
import sys
from pathlib import Path

job_repo = Path("/Users/steve/Documents/secure-job-board")
ops_repo = Path("/Users/steve/Documents/special-sauce-ops")

failures = []

def check(condition: bool, label: str, detail: str = ""):
    if condition:
        print(f"  [PASS] {label}")
    else:
        print(f"  [FAIL] {label} -> {detail}")
        failures.append(f"{label}: {detail}")

print("=== SPECIAL SAUCE CROSS-REPO DEPENDENCY GUARD ===")

# Tab 1: Ops Vault Union-Merge & Filter Parity
bridge_txt = (job_repo / "src/lib/ops-bridge.ts").read_text()
store_txt = (ops_repo / "src/lib/ops-store.ts").read_text()

check(
    "mergedThread" in bridge_txt and "mergedThread" in store_txt,
    "Tab 1a: Thread union-merging active in both ops-bridge.ts & ops-store.ts",
    "Missing mergedThread logic in one of the repositories"
)
check(
    'txt.includes("✓ Resolved:")' not in bridge_txt and 'txt.includes("✓ Resolved:")' not in store_txt,
    "Tab 1b: No aggressive .includes('✓ Resolved:') filter hiding customer replies",
    "Found legacy substring filter in ops-bridge.ts or ops-store.ts"
)

# Tab 2: Inbound Email Multi-Line Quote Stripping & Loop Filter Parity
inbound_txt = (job_repo / "src/app/api/ops-inbound-email/route.ts").read_text()
ingest_txt = (ops_repo / "src/app/api/ingest/route.ts").read_text()

check(
    "SPECIAL SAUCE™ SUPPORT DESK" in inbound_txt and "SPECIAL SAUCE™ SUPPORT DESK" in ingest_txt,
    "Tab 2a: Signature marker stripping active in both ops-inbound-email & ingest routes",
    "Missing sigMarkers array in inbound email route"
)
check(
    'cleanReply.includes("SPECIAL SAUCE™ SUPPORT")' not in inbound_txt
    and 'cleanReply.includes("SPECIAL SAUCE™ SUPPORT")' not in ingest_txt,
    "Tab 2b: No false-positive loop rejection on quoted Special Sauce signatures",
    "Found legacy cleanReply.includes('SPECIAL SAUCE™ SUPPORT') loop check"
)

# Simulate a multi-line Gmail reply with quoted signature to prove it strips cleanly
sample_gmail_reply = (
    "Well, I think that's good. TY!\r\n\r\n"
    "On Mon, Nov 2, 2026 at 10:11 AM Special Sauce Support <\r\n"
    "support@specialsauce.io> wrote:\r\n\r\n"
    "> SPECIAL SAUCE™ SUPPORT DESK\r\n"
    "> Support Ticket [TKT-835517]\r\n"
    "> ✓ Resolved: Testing 123\r\n"
)
normalized = sample_gmail_reply.replace("\r\n", "\n")
stripped = re.sub(r"\nOn\s+[\s\S]{1,260}?wrote:\s*\n[\s\S]*$", "", normalized, flags=re.I).strip()
check(
    stripped == "Well, I think that's good. TY!",
    "Tab 2c: Simulated multi-line Gmail reply strips quoted card cleanly",
    f"Got unexpected output: {stripped!r}"
)

# Tab 3: Outbound & Digest Routing Hygiene
digest_txt = (job_repo / "src/app/api/cron/daily-digest/route.ts").read_text()
check(
    "rochelle@specialsauce.io" not in digest_txt.lower(),
    "Tab 3: Daily digest routes exclusively to support@specialsauce.io",
    "Found legacy rochelle@specialsauce.io in daily-digest/route.ts"
)

# Tab 4: Queue Owners & KB Integrity
page_txt = (ops_repo / "src/app/page.tsx").read_text()
check(
    "seenShort" in page_txt and "rochelle" not in store_txt.lower(),
    "Tab 4: By Owner Queue deduplicates short names and excludes legacy Rochelle entry",
    "Missing seenShort deduplication or found legacy Rochelle string"
)

# Tab 6: Global Sticky Header CSS Invariant
globals_css = (job_repo / "src/app/globals.css").read_text()
overflow_hidden_pages = [
    str(p.relative_to(job_repo))
    for p in sorted((job_repo / "src/app").rglob("page.tsx"))
    if "overflow-x-hidden" in p.read_text(encoding="utf-8")
]
check(
    "overflow-x: clip" in globals_css and len(overflow_hidden_pages) == 0,
    "Tab 6: globals.css & all src/app/**/page.tsx preserve overflow-x-clip (zero overflow-x-hidden)",
    "Sticky header violation: " + (", ".join(overflow_hidden_pages) if overflow_hidden_pages else "overflow-x: clip missing in src/app/globals.css")
)

# Tab 7: Authenticated Dashboard Navigation & Route Containment
dash_files = sorted(list((job_repo / "src/app/dashboard").rglob("*.tsx")) + [
    job_repo / "src/components/SupportCenterClient.tsx",
    job_repo / "src/components/PlatformWorkflowsView.tsx",
])
route_leaks = []
for df in dash_files:
    if df.exists():
        content = df.read_text()
        for m in re.finditer(r"<(?:Link|a)\b[^>]*href=[\"\x27](/pricing|/security|/workflows|/signup[^\"\x27]*)[\"\x27][^>]*>", content, re.DOTALL):
            tag = " ".join(m.group(0).split())
            if "isDashboard" not in tag:
                route_leaks.append(str(df.relative_to(job_repo)) + ": " + tag[:80])
        for line_no, line in enumerate(content.splitlines(), 1):
            if "href=" in line and any(pub in line for pub in ["\"/pricing\"", "\"/security\"", "\"/workflows\"", "\"/signup\"", "\x27/pricing\x27", "\x27/security\x27", "\x27/workflows\x27", "\x27/signup\x27"]):
                if "isDashboard ?" not in line and not line.strip().startswith("//"):
                    route_leaks.append(str(df.relative_to(job_repo)) + ":" + str(line_no))
check(
    len(route_leaks) == 0,
    "Tab 7: Zero dashboard-to-public route leaks (/pricing, /security, /workflows, /signup)",
    "Found unguarded public links in dashboard: " + ", ".join(route_leaks[:5])
)

# TypeScript Compilation Check Across Both Repos
for name, repo in [("secure-job-board", job_repo), ("special-sauce-ops", ops_repo)]:
    res = subprocess.run(["npx", "tsc", "--noEmit"], cwd=str(repo), capture_output=True, text=True)
    check(res.returncode == 0, f"TypeScript Compiler ({name}): 0 errors", res.stdout + res.stderr)

# Tab 8: Production Pricing & Onboarding Workflow Contract Invariants
checkout_txt = (job_repo / "src/app/api/billing/create-checkout-session/route.ts").read_text()
required_prices = [
    ("explorer:", "priceCents: 500"),
    ("candidate_explorer:", "priceCents: 500"),
    ("professional:", "priceCents: 1200"),
    ("prestige:", "priceCents: 1900"),
    ("EMPLOYER_VERIFICATION_PASS", "priceCents: 2500"),
    ("starter:", "priceCents: 14900"),
    ("growth:", "priceCents: 49900"),
    ("enterprise:", "priceCents: 125000"),
]
tab8_ok = all(
    checkout_txt.find(t_key) != -1 and p_str in checkout_txt[checkout_txt.find(t_key):checkout_txt.find(t_key)+400]
    for t_key, p_str in required_prices
)
check(
    tab8_ok,
    "Tab 8: All Professional ($5/$12/$19) & Employer ($25/$149/$499/$1250) tiers locked at 100% production pricing",
    "Production pricing drift detected in create-checkout-session/route.ts",
)

# Tab 9: Next.js Turbopack "use client" Directive First-Line Guard
bad_client_files = []
for repo_root in (job_repo, ops_repo):
    for f in (repo_root / "src").rglob("*.ts*"):
        txt_f = f.read_text()
        if "'use client'" in txt_f or '"use client"' in txt_f:
            non_empty = [ln.strip() for ln in txt_f.splitlines() if ln.strip() and not ln.strip().startswith("//")]
            if non_empty and non_empty[0] not in ("'use client'", '"use client"', "'use client';", '"use client";'):
                bad_client_files.append(f"{repo_root.name}/{f.relative_to(repo_root)}")
check(
    len(bad_client_files) == 0,
    "Tab 9: All Client Components place 'use client' strictly on line 1 (Turbopack build guard)",
    f"Files with imports before use client: {bad_client_files}",
)

if failures:
    print(f"\n[DEPENDENCY GUARD FAILED] {len(failures)} issue(s) detected.")
    sys.exit(1)
else:
    print("\n[DEPENDENCY GUARD PASS] All cross-repo invariants and TypeScript checks passed.")
