#!/usr/bin/env python3
import hashlib, json, os, pathlib, subprocess, sys

REPO_DIR = pathlib.Path(__file__).resolve().parent.parent
GUARD_SCRIPT = pathlib.Path("/Users/steve/Documents/secure-job-board/scripts/verify_ops_dependencies.py")

def run_cmd(cmd, env=None, check=True):
    r = subprocess.run(cmd, cwd=str(REPO_DIR), env=env, capture_output=True, text=True)
    if check and r.returncode != 0:
        print("[ERROR] Command failed: " + " ".join(cmd))
        if r.stdout.strip(): print(r.stdout.strip())
        if r.stderr.strip(): print(r.stderr.strip())
        sys.exit(r.returncode)
    return r

def current_branch():
    return run_cmd(["git", "rev-parse", "--abbrev-ref", "HEAD"]).stdout.strip()

def dirty_hashes():
    st = run_cmd(["git", "status", "--porcelain"]).stdout.splitlines()
    out = {}
    for ln in st:
        if not ln.strip(): continue
        rel = ln[3:].strip().split(" -> ")[-1].strip("\"")
        fp = REPO_DIR / rel
        out[rel] = hashlib.sha256(fp.read_bytes()).hexdigest()[:16] if fp.exists() and fp.is_file() else "DELETED"
    return out

def check_local_verified_gate():
    dh = dirty_hashes()
    if not dh:
        return
    ver_file = REPO_DIR / ".git" / ".ss_local_verified.json"
    if not ver_file.exists():
        print("[BLOCKED BY LOCAL VERIFICATION GATE] Uncommitted changes in " + REPO_DIR.name + " have NOT been marked locally verified.")
        print("1. Test your changes live on http://localhost:3000 (or :3001).")
        print("2. Run: ss verify-local")
        print("3. Then run: ss stage \"<commit message>\"")
        sys.exit(1)
    try:
        ver = json.loads(ver_file.read_text()).get("files", {})
    except Exception:
        ver = {}
    mismatched = [k for k, v in dh.items() if ver.get(k) != v]
    if mismatched:
        print("[BLOCKED BY LOCAL VERIFICATION GATE] Files modified since last `ss verify-local`: " + ", ".join(mismatched))
        print("Test the updated changes on localhost first, then run `ss verify-local`.")
        sys.exit(1)

def main():
    if len(sys.argv) < 2 or sys.argv[1] not in ("staging", "prod", "status"):
        print("Usage:")
        print("  ss status")
        print("  ss verify-local")
        print("  ss stage \"<commit message>\"")
        print("  ss prod")
        sys.exit(1)

    mode = sys.argv[1]
    br = current_branch()

    if mode == "status":
        st = run_cmd(["git", "status", "-s"]).stdout.strip()
        head_sha = run_cmd(["git", "rev-parse", "--short", "HEAD"]).stdout.strip()
        stg_sha = run_cmd(["git", "rev-parse", "--short", "origin/staging"], check=False).stdout.strip() or "N/A"
        main_sha = run_cmd(["git", "rev-parse", "--short", "origin/main"], check=False).stdout.strip() or "N/A"
        dh = dirty_hashes()
        ver_file = REPO_DIR / ".git" / ".ss_local_verified.json"
        ver_ok = False
        if dh and ver_file.exists():
            try:
                vf = json.loads(ver_file.read_text()).get("files", {})
                ver_ok = all(vf.get(k) == v for k, v in dh.items())
            except Exception:
                ver_ok = False
        v_label = "CLEAN" if not dh else ("VERIFIED (ready for ss stage)" if ver_ok else "UNVERIFIED (run ss verify-local after localhost test)")
        recent = run_cmd(["git", "log", "-n", "4", "--oneline"], check=False).stdout.strip()
        audit_file = REPO_DIR / "AUDIT_STATE.md"
        if not audit_file.exists() and REPO_DIR.name == "secure-job-board":
            default_audit = "\n".join([
                "# SpecialSauce Audit & Parity State",
                "",
                "## Locked Decisions & Parity Rules",
                "- 100% `ss` CLI for all repo ops (`ss status`, `ss find`, `ss inspect`, `ss patch`, `ss verify-local`, `ss stage`, `ss prod`).",
                "- One Page / One Feature per chat (retire chat after `ss prod` or ~15 turns).",
                "- Plain English across customer-facing UI; zero 'Candidate', 'sandbox', 'double-blind', or 'cohort'.",
                "- TrueFit v2.2 deterministic cache (`tf_v2_2_`, `cand_v5_`, `emp_v5_`) & whole-word search (`it`, `aws`, `okr`).",
                "",
                "## Completed & Live on Production (`origin/main`)",
                "- [x] Resume Auto-Fill & Profile Editor (skill years, <=4y GenAI cap, cert cross-filter, 16-pill preview)",
                "- [x] Employer One-Click Role Generator (seniority/type match, cert rescue, skill tenure matrix)",
                "- [x] Employer Talent Search (`Search Talent` presets, Practice Mode UX, whole-word search, TrueFit v2.2)",
                "- [x] Professional Job Discovery (`Find Roles` Practice Mode copy, locked counts, clear filters, cert search, dealbreakers)",
                "",
                "## Remaining Dashboard Pages to Audit",
                "- [ ] Professional Overview (`src/app/dashboard/page.tsx`)",
                "- [ ] Outbound Applications (`src/app/dashboard/applications` / `CandidateApplications.tsx`)",
                "- [ ] Professional Invitations (`src/app/dashboard/invitations`)",
                "- [ ] Match Preferences (`src/app/dashboard/preferences`)",
                "- [ ] Employer Manage Roles & Inbound Applicants (`ApplicationRevealCard.tsx` / `SecureMessageThread.tsx`)",
                "- [ ] Support & Membership / Plan Settings (`SupportCenterClient.tsx` / `billing`)",
            ]) + "\n"
            audit_file.write_text(default_audit)
        lines = [
            "Repo: " + REPO_DIR.name + " | Branch: " + br + " (" + head_sha + ") | origin/staging: " + stg_sha + " | origin/main: " + main_sha,
            "Local Gate: " + v_label,
        ]
        if st:
            lines.append("Working Tree:\n" + st)
        if recent:
            lines.append("Recent Commits:\n" + recent)
        if audit_file.exists():
            lines.append("--- AUDIT_STATE.md ---\n" + audit_file.read_text().strip())
        out_text = "\n".join(lines)
        try:
            subprocess.run(["pbcopy"], input=out_text, text=True, check=False)
        except Exception:
            pass
        print(out_text)
        sys.exit(0)

    if mode == "staging":
        msg = sys.argv[2] if len(sys.argv) >= 3 else "chore: update staging"
        if br != "staging":
            print("[SWITCH] Switching active branch to staging...")
            run_cmd(["git", "checkout", "staging"])
        check_local_verified_gate()
        print("[1/3] Running Cross-Repo Dependency Guard...")
        g = subprocess.run(["python3", str(GUARD_SCRIPT)], cwd=str(REPO_DIR))
        if g.returncode != 0:
            sys.exit(g.returncode)
        st = run_cmd(["git", "status", "--porcelain"]).stdout.strip()
        if st:
            print("[2/3] Staging and committing verified local changes to staging...")
            run_cmd(["git", "add", "-A"])
            run_cmd(["git", "commit", "-m", msg])
        else:
            print("[2/3] Working tree clean — pushing committed staging HEAD...")
        print("[3/3] Pushing to origin/staging (Tier 2 Test)...")
        env = os.environ.copy()
        env["SS_ALLOW_STAGING_PROMOTE"] = "1"
        p = subprocess.run(["git", "push", "-u", "origin", "staging"], cwd=str(REPO_DIR), env=env)
        if p.returncode != 0:
            sys.exit(p.returncode)
        ver_file = REPO_DIR / ".git" / ".ss_local_verified.json"
        if ver_file.exists():
            ver_file.unlink()
        sha = run_cmd(["git", "rev-parse", "--short", "HEAD"]).stdout.strip()
        print("[OK - TIER 2 STAGING DEPLOYED] " + REPO_DIR.name + " @ " + sha)
        print("Verify on your Vercel Preview / Test URL before running `ss prod`.")
        sys.exit(0)

    if mode == "prod":
        st = run_cmd(["git", "status", "--porcelain"]).stdout.strip()
        if st:
            print("[BLOCKED] Working tree has uncommitted changes. Verify locally and run `ss stage` first.")
            sys.exit(1)
        run_cmd(["git", "fetch", "origin", "staging", "main"])
        stg_local = run_cmd(["git", "rev-parse", "staging"]).stdout.strip()
        stg_remote = run_cmd(["git", "rev-parse", "origin/staging"]).stdout.strip()
        if stg_local != stg_remote:
            print("[BLOCKED] Local staging (" + stg_local[:7] + ") != origin/staging (" + stg_remote[:7] + "). Push and test on staging first.")
            sys.exit(1)
        print("[1/4] Fast-forwarding local main to verified origin/staging...")
        run_cmd(["git", "checkout", "main"])
        run_cmd(["git", "merge", "--ff-only", "origin/staging"])
        print("[2/4] Pushing verified staging commit to origin/main (Tier 3 Production)...")
        env = os.environ.copy()
        env["SS_ALLOW_PROD_PROMOTE"] = "1"
        p = subprocess.run(["git", "push", "origin", "main"], cwd=str(REPO_DIR), env=env)
        print("[3/4] Returning active working branch to staging...")
        run_cmd(["git", "checkout", "staging"])
        if p.returncode != 0:
            sys.exit(p.returncode)
        print("[4/4] [OK - TIER 3 PRODUCTION DEPLOYED] " + REPO_DIR.name + " @ " + stg_remote[:7])
        sys.exit(0)

if __name__ == "__main__":
    main()
