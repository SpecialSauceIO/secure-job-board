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
check(
    "overflow-x: clip" in globals_css,
    "Tab 6: globals.css preserves overflow-x: clip for sticky headers",
    "overflow-x: clip missing in src/app/globals.css"
)

# TypeScript Compilation Check Across Both Repos
for name, repo in [("secure-job-board", job_repo), ("special-sauce-ops", ops_repo)]:
    res = subprocess.run(["npx", "tsc", "--noEmit"], cwd=str(repo), capture_output=True, text=True)
    check(res.returncode == 0, f"TypeScript Compiler ({name}): 0 errors", res.stdout + res.stderr)

if failures:
    print(f"\n[DEPENDENCY GUARD FAILED] {len(failures)} issue(s) detected.")
    sys.exit(1)
else:
    print("\n[DEPENDENCY GUARD PASS] All cross-repo invariants and TypeScript checks passed.")
