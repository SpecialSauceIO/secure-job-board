import os, sys, subprocess, pathlib

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

def main():
    if len(sys.argv) < 2 or sys.argv[1] not in ("staging", "prod", "status"):
        print("Usage:")
        print("  python3 scripts/ss_promote.py status")
        print("  python3 scripts/ss_promote.py staging \"<commit message>\"")
        print("  python3 scripts/ss_promote.py prod")
        sys.exit(1)

    mode = sys.argv[1]
    br = current_branch()

    if mode == "status":
        st = run_cmd(["git", "status", "-s"]).stdout.strip()
        head_sha = run_cmd(["git", "rev-parse", "--short", "HEAD"]).stdout.strip()
        stg_sha = run_cmd(["git", "rev-parse", "--short", "origin/staging"], check=False).stdout.strip()
        main_sha = run_cmd(["git", "rev-parse", "--short", "origin/main"], check=False).stdout.strip()
        print("Repo: " + REPO_DIR.name + " | Active Branch: " + br + " (" + head_sha + ")")
        print("origin/staging: " + stg_sha + " | origin/main: " + main_sha)
        print("Working tree: " + (st if st else "CLEAN"))
        sys.exit(0)

    if mode == "staging":
        msg = sys.argv[2] if len(sys.argv) >= 3 else "chore: update staging"
        if br != "staging":
            print("[SWITCH] Switching active branch to staging...")
            run_cmd(["git", "checkout", "staging"])
        print("[1/3] Running Cross-Repo Dependency Guard...")
        g = subprocess.run(["python3", str(GUARD_SCRIPT)], cwd=str(REPO_DIR))
        if g.returncode != 0:
            sys.exit(g.returncode)
        st = run_cmd(["git", "status", "--porcelain"]).stdout.strip()
        if st:
            print("[2/3] Staging and committing local changes to staging branch...")
            run_cmd(["git", "add", "-A"])
            run_cmd(["git", "commit", "-m", msg])
        else:
            print("[2/3] Working tree clean; pushing existing staging commits...")
        print("[3/3] Pushing to origin/staging (Tier 2 Test Environment)...")
        p = subprocess.run(["git", "push", "-u", "origin", "staging"], cwd=str(REPO_DIR))
        if p.returncode != 0:
            sys.exit(p.returncode)
        sha = run_cmd(["git", "rev-parse", "--short", "HEAD"]).stdout.strip()
        print("[OK - TIER 2 STAGING DEPLOYED] " + REPO_DIR.name + " @ " + sha + " is now on origin/staging.")
        print("Verify on your Vercel Preview / Test URL before running: python3 scripts/ss_promote.py prod")
        sys.exit(0)

    if mode == "prod":
        st = run_cmd(["git", "status", "--porcelain"]).stdout.strip()
        if st:
            print("[BLOCKED] Working tree has uncommitted changes. Promote to staging first:")
            print("  python3 scripts/ss_promote.py staging \"<commit message>\"")
            sys.exit(1)
        run_cmd(["git", "fetch", "origin", "staging", "main"])
        stg_local = run_cmd(["git", "rev-parse", "staging"]).stdout.strip()
        stg_remote = run_cmd(["git", "rev-parse", "origin/staging"]).stdout.strip()
        if stg_local != stg_remote:
            print("[BLOCKED] Local staging (" + stg_local[:7] + ") does not match origin/staging (" + stg_remote[:7] + ").")
            print("Push and test on origin/staging first: python3 scripts/ss_promote.py staging \"<message>\"")
            sys.exit(1)
        print("[1/4] Fast-forwarding local main to verified origin/staging (" + stg_remote[:7] + ")...")
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
        print("[OK - TIER 3 PRODUCTION DEPLOYED] " + REPO_DIR.name + " @ " + stg_remote[:7] + " promoted to origin/main and switched back to staging.")

if __name__ == "__main__":
    main()
