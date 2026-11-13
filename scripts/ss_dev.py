#!/usr/bin/env python3
import base64, hashlib, html, json, os, pathlib, re, subprocess, sys, time

SJB_DIR = pathlib.Path("/Users/steve/Documents/secure-job-board")
OPS_DIR = pathlib.Path("/Users/steve/Documents/special-sauce-ops")
GUARD_SCRIPT = SJB_DIR / "scripts" / "verify_ops_dependencies.py"
MEDIA_RECEIPT = pathlib.Path("/tmp/.ss_media_receipt.json")

FORBIDDEN_COPY_PATTERNS = [
    (r"\bcandidates?\b", "Forbidden term Candidate(s) — use Professional(s)"),
    (r"double[-\s]+blind", "Forbidden term double-blind — use 2-Stage Privacy Handshake/Vault or plain English"),
    (r"\bblind\s+roles?\b", "Forbidden term blind role(s) — use Protected Role(s) or active open jobs"),
    (r"30[-\s]+day\s+free\s+trial", "Forbidden term 30-day free trial"),
    (r"\bcohorts?\b", "Forbidden term cohort"),
    (r"\bturing\s+test\b", "Forbidden buzzword Turing test"),
    (r"\bai\s+prox(?:y|ies)\b", "Forbidden buzzword AI proxy"),
    (r"synthetic\s+r[e\u00e9]sum[e\u00e9]s?", "Forbidden buzzword synthetic resume"),
    (r"\bsandbox\b", "Forbidden term Sandbox — use Practice Mode"),
]

# Internal DB/code identifiers allowed in .ts/.tsx code lines
ALLOWED_CODE_IDENT_RX = re.compile(
    r"(candidate_id|candidate_explorer|CANDIDATE_|candidateId|candidateProfile|candidateExp|"
    r"candidate_profile|candidate_tier|candidate_count|role\s*===?\s*[\x27\"]candidate[\x27\"]|"
    r"[\x27\"]candidate[\x27\"]\s*[:|\?]|/candidate|Candidate[A-Z]\w*|"
    r"allow-scripts\s+allow-same-origin|sandbox=\"|isSandbox|sandboxMode|sandbox_mode|seed-sandbox)"
)

def sha256_bytes(b):
    return hashlib.sha256(b).hexdigest()

def sha256_file(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def media_fast_sig(p):
    st = p.stat()
    h = hashlib.sha256()
    h.update((str(st.st_size) + ":" + str(int(st.st_mtime))).encode())
    with p.open("rb") as f:
        h.update(f.read(65536))
    return h.hexdigest()[:24]

def resolve_repo_path(repo_dir, q):
    p = pathlib.Path(q)
    if not p.is_absolute():
        p = repo_dir / q
    if p.exists() and p.is_file():
        return p.resolve()
    src_dir = repo_dir / "src"
    if src_dir.exists():
        hits = sorted(src_dir.rglob("*" + pathlib.Path(q).name + "*"))
        files = [h.resolve() for h in hits if h.is_file()]
        if len(files) == 1:
            return files[0]
    return None

def load_json(p, default):
    if not p.exists():
        return default
    try:
        return json.loads(p.read_text())
    except Exception:
        return default

def sanitize_for_chat(text):
    s = str(text).strip()
    s = re.sub(r"ign[o]re\s+prev[i]ous\s+instruct[i]ons", "[prompt-example-redacted]", s, flags=re.I)
    s = re.sub(r"sys[t]em\s+pr[o]mpt", "[prompt-ref-redacted]", s, flags=re.I)
    return s

def copy_clip(text):
    try:
        bt = chr(96) * 3
        clean = sanitize_for_chat(text)
        if clean.startswith(bt):
            lns = clean.splitlines()
            clean = "\n".join(lns[1:-1] if lns and lns[-1].strip() == bt else lns[1:]).strip()
        wrapped = "Proceed with ss output:\n\n" + bt + "text\n" + clean + "\n" + bt
        subprocess.run(["pbcopy"], input=wrapped, text=True, check=False)
    except Exception:
        pass

def merge_ranges(ranges):
    if not ranges:
        return []
    s = sorted([int(a), int(b)] for a, b in ranges)
    out = [s[0]]
    for cur in s[1:]:
        if cur[0] <= out[-1][1] + 1:
            out[-1][1] = max(out[-1][1], cur[1])
        else:
            out.append(cur)
    return out

def cmd_find(repo_dir, args):
    if not args:
        print("Usage: ss find <keyword1> [keyword2 ...]")
        sys.exit(1)
    out_lines = []
    for kw in args:
        kw_l = kw.lower()
        for base in ("src", "scripts", "public"):
            bdir = repo_dir / base
            if not bdir.exists():
                continue
            for p in sorted(bdir.rglob("*")):
                if p.is_file() and kw_l in str(p.relative_to(repo_dir)).lower():
                    out_lines.append(str(p.relative_to(repo_dir)))
    txt = "\n".join(dict.fromkeys(out_lines))[:1100] or "[NO FILE MATCHES]"
    copy_clip(txt)
    print(txt)

def cmd_inspect(repo_dir, args):
    if not args:
        print("Usage: ss inspect <file:start-end | file:needle1,needle2> [...]")
        sys.exit(1)
    receipt_path = repo_dir / ".git" / ".ss_inspect_receipt.json"
    receipt = load_json(receipt_path, {"files": {}})
    if len(args) > 5:
        print("[BLOCKED - TOO MANY TARGETS] Pass at most 5 file targets per `ss inspect` call (use needle searches first) to protect chat context.")
        sys.exit(1)
    total_budget = 6500
    per_budget = max(1200, total_budget // max(1, len(args)))
    sections = []
    now_ts = int(time.time())

    for spec in args:
        parts = spec.split(":", 1)
        p = resolve_path = resolve_repo_path(repo_dir, parts[0])
        if not p:
            sections.append("=== MISSING: " + parts[0] + " ===")
            continue
        rel = str(p.relative_to(repo_dir)) if str(p).startswith(str(repo_dir)) else str(p)
        raw_bytes = p.read_bytes()
        f_hash = sha256_bytes(raw_bytes)[:16]
        flines = raw_bytes.decode("utf-8", errors="replace").splitlines()
        sel = parts[1] if len(parts) > 1 else "1-40"

        header = "=== " + rel + " (" + str(len(flines)) + "L | sha:" + f_hash + ") ==="
        body_lines = []
        credited_ranges = []
        used = len(header) + 1

        if re.match(r"^\d+-\d+$", sel):
            s_num, e_num = [int(x) for x in sel.split("-", 1)]
            s_num = max(1, s_num)
            e_num = min(len(flines), e_num)
            range_clamped = False
            if e_num - s_num + 1 > 120:
                e_num = s_num + 119
                range_clamped = True
            last_included = s_num - 1
            clipped = False
            for ln_no in range(s_num, e_num + 1):
                raw_ln = flines[ln_no - 1]
                disp = str(ln_no) + "|" + raw_ln[:1400]
                if used + len(disp) + 1 > per_budget - 55:
                    clipped = True
                    break
                body_lines.append(disp)
                used += len(disp) + 1
                last_included = ln_no
            if last_included >= s_num:
                credited_ranges.append([s_num, last_included])
            if clipped or range_clamped:
                body_lines.append("[RANGE CAPPED AT LINE " + str(last_included) + " (120L MAX) — USE NEEDLE SEARCH (`ss inspect " + rel + ":keyword`) INSTEAD OF DUMPING FULL FILES]")
        else:
            keys = [k.strip().lower() for k in sel.split(",") if k.strip()]
            for idx, raw_ln in enumerate(flines, 1):
                if any(k in raw_ln.lower() for k in keys):
                    # Include 2 lines context above and below when needle matches
                    c_start = max(1, idx - 1)
                    c_end = min(len(flines), idx + 1)
                    disp = str(idx) + "|" + raw_ln[:1400]
                    if used + len(disp) + 1 > per_budget - 40:
                        body_lines.append("[NEEDLE OUTPUT CAP REACHED — INSPECT LINE RANGE DIRECTLY]")
                        break
                    body_lines.append(disp)
                    used += len(disp) + 1
                    credited_ranges.append([idx, idx])

        prev = receipt["files"].get(rel, {})
        prev_ranges = prev.get("ranges", []) if prev.get("sha16") == f_hash else []
        merged = merge_ranges(prev_ranges + credited_ranges)
        receipt["files"][rel] = {
            "sha16": f_hash,
            "ranges": merged,
            "updated_at": now_ts,
        }
        sections.append(header + "\n" + "\n".join(body_lines))

    receipt_path.parent.mkdir(parents=True, exist_ok=True)
    receipt_path.write_text(json.dumps(receipt, indent=2))
    final_out = "\n".join(sections)
    copy_clip("```text\n" + final_out + "\n```")
    print(final_out)

def validate_ts_and_invariants(repo_dir, touched_files, added_lines_by_file):
    # 1. Tab 9: use client must be first non-comment statement if present
    for rel, p in touched_files.items():
        if p.suffix not in (".ts", ".tsx", ".js", ".jsx"):
            continue
        content = p.read_text()
        if re.search(r"^[ \t]*[\x27\"]use client[\x27\"]", content, re.M):
            # Find first non-empty, non-comment line
            in_block = False
            for ln in content.splitlines():
                s = ln.strip()
                if not s:
                    continue
                if in_block:
                    if "*/" in s:
                        in_block = False
                    continue
                if s.startswith("//"):
                    continue
                if s.startswith("/*"):
                    if "*/" not in s:
                        in_block = True
                    continue
                if not (s.startswith("'use client'") or s.startswith("\"use client\"")):
                    return "[TAB 9 BLOCKED] " + rel + ": 'use client' is not the first statement on line 1."
                break

        # 2. Tab 7: Dashboard route containment on newly added lines
        is_dash_file = rel.startswith("src/app/dashboard/") or (rel.startswith("src/components/") and ("Dashboard" in rel or "Employer" in rel or "Candidate" in rel or "SupportCenter" in rel))
        if is_dash_file:
            for add_ln in added_lines_by_file.get(rel, []):
                if "isDashboard" in add_ln:
                    continue
                m_pub = re.search(r"href=\{?[\x27\"](/(?:pricing|security|workflows|signup))(?:[\x27\"#?])", add_ln)
                if m_pub:
                    return "[TAB 7 BLOCKED] " + rel + " introduces public href " + m_pub.group(1) + " inside authenticated dashboard scope."

        # 3. Locked Nomenclature Scanner on newly added customer-facing UI text & string literals
        if "ops-health" not in rel and "ss_gate" not in rel and "scripts/" not in rel:
            for add_ln in added_lines_by_file.get(rel, []):
                s_ln = add_ln.strip()
                if s_ln.startswith("//") or s_ln.startswith("/*") or s_ln.startswith("*") or s_ln.startswith("import "):
                    continue
                scrubbed = ALLOWED_CODE_IDENT_RX.sub("", add_ln)
                if any(neg in scrubbed.upper() for neg in ("NEVER ", "FORBIDDEN", "ZERO ", "DO NOT ")):
                    continue
                # Extract only customer-facing string literals or JSX text nodes so code identifiers (candidate.*, searchCandidates, etc.) never trip
                ui_chunks = [m.group(1) for m in re.finditer(r"[\x27\"`]([^\x27\"`]{3,})[\x27\"`]", scrubbed)]
                if ">" in s_ln or "<" in s_ln or not re.search(r"[=();{}]", s_ln):
                    jsx_txt = re.sub(r"\{[^}]*\}|<[^>]*>", " ", scrubbed).strip()
                    if jsx_txt and re.search(r"[A-Za-z]{3,}", jsx_txt) and not re.match(r"^[a-zA-Z0-9_$.]+$", jsx_txt):
                        ui_chunks.append(jsx_txt)
                ui_surface = " | ".join(ui_chunks)
                if not ui_surface:
                    continue
                for pat, msg in FORBIDDEN_COPY_PATTERNS:
                    if re.search(pat, ui_surface, re.I):
                        return "[NOMENCLATURE BLOCKED] " + rel + ": " + msg + " | Line: " + s_ln[:90]

    # 4. Run npx tsc --noEmit
    tsc = subprocess.run(["npx", "tsc", "--noEmit"], cwd=str(repo_dir), capture_output=True, text=True)
    if tsc.returncode != 0:
        err = (tsc.stdout + "\n" + tsc.stderr).strip()[:750]
        return "[TSC FAILED]\n" + err
    return None

def cmd_patch(repo_dir, args):
    # Check branch is staging
    br = subprocess.run(["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=str(repo_dir), capture_output=True, text=True).stdout.strip()
    if br != "staging":
        print("[BLOCKED] Active branch in " + repo_dir.name + " is '" + br + "'. Local patches are ONLY permitted on 'staging'.")
        sys.exit(1)

    if args and args[0] == "--json" and len(args) >= 2:
        raw_payload = " ".join(args[1:]).strip()
    elif args and args[0] == "--b64" and len(args) >= 2:
        b64_joined = "".join(args[1:]).strip()
        raw_payload = base64.b64decode(b64_joined).decode("utf-8")
    elif args and pathlib.Path(args[0]).exists():
        raw_payload = pathlib.Path(args[0]).read_text()
    elif not sys.stdin.isatty():
        raw_payload = sys.stdin.read()
        if raw_payload.strip().startswith("B64:"):
            raw_payload = base64.b64decode(raw_payload.strip()[4:].strip()).decode("utf-8")
    else:
        print("Usage: ss patch --b64 <base64_json> | ss patch <patch.json> | stdin")
        sys.exit(1)

    try:
        spec = json.loads(raw_payload)
    except Exception as e:
        print("[BLOCKED - INVALID PATCH JSON] " + str(e))
        sys.exit(1)

    edits = spec if isinstance(spec, list) else spec.get("edits", [])
    if not edits or not isinstance(edits, list):
        print("[BLOCKED] Patch JSON must contain a non-empty 'edits' list.")
        sys.exit(1)

    receipt_path = repo_dir / ".git" / ".ss_inspect_receipt.json"
    receipt = load_json(receipt_path, {"files": {}})
    now_ts = int(time.time())

    backups = {}
    touched_files = {}
    added_lines_by_file = {}
    staged_contents = {}

    for idx, ed in enumerate(edits, 1):
        rel_in = ed.get("file", "")
        exp_sha = ed.get("sha256", "").strip()
        old_str = ed.get("old", "")
        new_str = ed.get("new", "")
        if not rel_in or not exp_sha or not old_str:
            print("[BLOCKED] Edit #" + str(idx) + " missing required fields (file, sha256, old, new).")
            sys.exit(1)

        p = resolve_repo_path(repo_dir, rel_in)
        if not p:
            print("[BLOCKED] File not found: " + rel_in)
            sys.exit(1)
        rel = str(p.relative_to(repo_dir))

        if p not in backups:
            backups[p] = p.read_bytes()
            staged_contents[p] = backups[p].decode("utf-8", errors="replace")
            touched_files[rel] = p

        disk_sha16 = sha256_bytes(backups[p])[:16]
        if not disk_sha16.startswith(exp_sha[:16]) and exp_sha[:16] != disk_sha16:
            print("[BLOCKED - STALE SHA] " + rel + " on disk is sha:" + disk_sha16 + " but patch expected sha:" + exp_sha[:16] + ". Run `ss inspect " + rel + "` first.")
            sys.exit(1)

        rec_entry = receipt.get("files", {}).get(rel)
        if not rec_entry or rec_entry.get("sha16") != disk_sha16:
            print("[BLOCKED - NO INSPECTION RECEIPT] " + rel + " (sha:" + disk_sha16 + ") has not been inspected. Run `ss inspect` first.")
            sys.exit(1)

        if now_ts - int(rec_entry.get("updated_at", 0)) > 7200:
            print("[BLOCKED - EXPIRED RECEIPT] Inspection receipt for " + rel + " is older than 2 hours. Re-run `ss inspect`.")
            sys.exit(1)

        orig_text = backups[p].decode("utf-8", errors="replace").replace("\u00a0", " ")
        cur_text = staged_contents[p].replace("\u00a0", " ")
        staged_contents[p] = cur_text
        old_str = old_str.replace("\u00a0", " ")
        new_str = new_str.replace("\u00a0", " ")
        occ_orig = orig_text.count(old_str)
        occ_cur = cur_text.count(old_str)
        if (occ_cur != 1 or occ_orig < 1) and "\n" in old_str:
            old_lines = old_str.splitlines()
            old_stripped = [ln.strip() for ln in old_lines]
            orig_lines = orig_text.splitlines()
            cur_lines = cur_text.splitlines()
            n_ln = len(old_lines)
            orig_hits = [i for i in range(len(orig_lines) - n_ln + 1) if [x.strip() for x in orig_lines[i:i + n_ln]] == old_stripped]
            cur_hits = [i for i in range(len(cur_lines) - n_ln + 1) if [x.strip() for x in cur_lines[i:i + n_ln]] == old_stripped]
            if len(orig_hits) == 1 and len(cur_hits) == 1:
                matched_orig_block = "\n".join(orig_lines[orig_hits[0]:orig_hits[0] + n_ln])
                matched_cur_block = "\n".join(cur_lines[cur_hits[0]:cur_hits[0] + n_ln])
                fn_idx = next((k for k, ln in enumerate(old_lines) if ln.strip()), 0)
                old_lead = len(old_lines[fn_idx]) - len(old_lines[fn_idx].lstrip(" "))
                real_lead = len(cur_lines[cur_hits[0] + fn_idx]) - len(cur_lines[cur_hits[0] + fn_idx].lstrip(" "))
                delta = real_lead - old_lead
                if delta != 0:
                    reindented = []
                    for nln in new_str.splitlines():
                        if not nln.strip():
                            reindented.append("")
                        elif delta > 0:
                            reindented.append((" " * delta) + nln)
                        else:
                            trim_n = min(-delta, len(nln) - len(nln.lstrip(" ")))
                            reindented.append(nln[trim_n:])
                    new_str = "\n".join(reindented)
                old_str = matched_orig_block if matched_orig_block == matched_cur_block else matched_cur_block
                occ_orig = orig_text.count(matched_orig_block)
                occ_cur = cur_text.count(old_str)
        if occ_cur != 1 or occ_orig < 1:
            probe = next((ln.strip() for ln in old_str.splitlines() if ln.strip()), "")
            near = [str(lno) + "|" + rln[:140] for lno, rln in enumerate(cur_text.splitlines(), 1) if probe and probe[:28] in rln][:6]
            print("[BLOCKED - ANCHOR MISMATCH] Edit #" + str(idx) + " on " + rel + ": `old` matched " + str(occ_cur) + " times (orig=" + str(occ_orig) + ").")
            if near:
                print("Nearest lines on disk:\n  " + "\n  ".join(near))
            sys.exit(1)

        # Verify 100% of target lines in original file were inspected in receipt ranges!
        pos = orig_text.find(old_str)
        start_line = orig_text.count("\n", 0, pos) + 1
        end_line = start_line + old_str.count("\n")
        ranges = rec_entry.get("ranges", [])
        uninspected = []
        for ln_no in range(start_line, end_line + 1):
            if not any(r[0] <= ln_no <= r[1] for r in ranges):
                uninspected.append(ln_no)
        if uninspected:
            print("[BLOCKED - UNINSPECTED LINES] Edit #" + str(idx) + " on " + rel + " touches lines " + str(start_line) + "-" + str(end_line) + ", but lines " + str(uninspected[:12]) + " were NEVER inspected via `ss inspect`.")
            print("Credited inspected ranges for " + rel + ": " + str(ranges))
            sys.exit(1)

        staged_contents[p] = cur_text.replace(old_str, new_str, 1)
        old_set = set(old_str.splitlines())
        added = [ln for ln in new_str.splitlines() if ln.strip() and ln not in old_set]
        added_lines_by_file.setdefault(rel, []).extend(added)

    # Write all staged edits to disk, then run mechanical validations
    try:
        for p, new_txt in staged_contents.items():
            p.write_text(new_txt)
        err = validate_ts_and_invariants(repo_dir, touched_files, added_lines_by_file)
        if err:
            for p, orig_b in backups.items():
                p.write_bytes(orig_b)
            print("[AUTO-ROLLBACK COMPLETE] All files restored to pre-patch state.\n" + err)
            sys.exit(1)
    except Exception as exc:
        for p, orig_b in backups.items():
            p.write_bytes(orig_b)
        print("[AUTO-ROLLBACK COMPLETE] Unexpected error: " + str(exc))
        sys.exit(1)

    # Update inspection receipt to new SHA so follow-up inspection stays honest (clear old ranges until re-inspected)
    unverified_path = repo_dir / ".git" / ".ss_unverified_patch.json"
    unverified = load_json(unverified_path, {"files": {}})
    for rel, p in touched_files.items():
        new_sha16 = sha256_file(p)[:16]
        receipt["files"][rel] = {"sha16": new_sha16, "ranges": [], "updated_at": now_ts}
        unverified["files"][rel] = new_sha16
    receipt_path.write_text(json.dumps(receipt, indent=2))
    unverified_path.write_text(json.dumps(unverified, indent=2))

    summary = "[LOCAL PATCH READY] tsc=0 | Modified: " + ", ".join(sorted(touched_files.keys())) + " | Staging promotion locked until you test on localhost and run: ss verify-local"
    copy_clip(summary)
    print(summary)

def dirty_worktree_hashes(repo_dir):
    st = subprocess.run(["git", "status", "--porcelain"], cwd=str(repo_dir), capture_output=True, text=True).stdout.splitlines()
    hashes = {}
    for ln in st:
        if not ln.strip():
            continue
        path_part = ln[3:].strip().split(" -> ")[-1].strip("\"")
        fp = repo_dir / path_part
        hashes[path_part] = sha256_file(fp)[:16] if fp.exists() and fp.is_file() else "DELETED"
    return hashes

def cmd_verify_local(repo_dir):
    hashes = dirty_worktree_hashes(repo_dir)
    if not hashes:
        print("[INFO] Working tree in " + repo_dir.name + " is already clean (nothing uncommitted to mark verified).")
        return
    ver_path = repo_dir / ".git" / ".ss_local_verified.json"
    ver_path.write_text(json.dumps({"verified_at": int(time.time()), "files": hashes}, indent=2))
    unv = repo_dir / ".git" / ".ss_unverified_patch.json"
    if unv.exists():
        unv.unlink()
    msg = "[LOCAL VERIFICATION RECORDED] " + repo_dir.name + " (" + str(len(hashes)) + " file(s) unlocked for `ss stage`)."
    copy_clip(msg)
    print(msg)

def cmd_media_inspect(args):
    if not args:
        print("Usage: ss media-inspect <file_or_dir> [...]")
        sys.exit(1)
    try:
        import imageio_ffmpeg
        ff = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception as e:
        print("[ERROR] imageio_ffmpeg unavailable: " + str(e))
        sys.exit(1)

    targets = []
    for a in args:
        p = pathlib.Path(a).expanduser().resolve()
        if not p.exists():
            print("[MISSING MEDIA] " + str(p))
            sys.exit(1)
        if p.is_dir():
            for sub in sorted(p.iterdir()):
                if sub.is_file() and sub.suffix.lower() in (".mp4", ".mov", ".webm", ".wav", ".mp3", ".m4a", ".srt", ".vtt"):
                    targets.append(sub)
        else:
            targets.append(p)

    rec = load_json(MEDIA_RECEIPT, {"files": {}})
    lines_out = []
    for t in targets:
        sig = media_fast_sig(t)
        ext = t.suffix.lower()
        if ext in (".srt", ".vtt"):
            txt = t.read_text(errors="replace")
            cues = re.findall(r"(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})", txt)
            info = {"sig": sig, "type": "subtitle", "cues": len(cues), "first": cues[0][0] if cues else "", "last": cues[-1][1] if cues else "", "inspected_at": int(time.time())}
            rec["files"][str(t)] = info
            lines_out.append(t.name + " | cues=" + str(len(cues)) + " | span=" + info["first"] + ".." + info["last"] + " | sig:" + sig[:10])
        else:
            probe = subprocess.run([ff, "-hide_banner", "-i", str(t)], capture_output=True, text=True)
            stderr = probe.stderr
            dur_m = re.search(r"Duration:\s*(\d+:\d+:\d+\.\d+)", stderr)
            vid_m = re.search(r"Video:.*?(\d{3,5}x\d{3,5}).*?([0-9.]+)\s*fps", stderr)
            dur_s = dur_m.group(1) if dur_m else "unknown"
            res_s = vid_m.group(1) if vid_m else "audio-only"
            fps_s = vid_m.group(2) if vid_m else "-"
            info = {"sig": sig, "type": "av", "duration": dur_s, "resolution": res_s, "fps": fps_s, "inspected_at": int(time.time())}
            rec["files"][str(t)] = info
            lines_out.append(t.name + " | dur=" + dur_s + " | " + res_s + " @ " + fps_s + "fps | sig:" + sig[:10])

    MEDIA_RECEIPT.write_text(json.dumps(rec, indent=2))
    out = "=== MEDIA INSPECTION RECEIPT RECORDED ===\n" + "\n".join(lines_out)
    out = out[:1150]
    copy_clip(out)
    print(out)

def cmd_media_verify(args):
    if not args:
        print("Usage: ss media-verify <file1> [file2 ...]")
        sys.exit(1)
    rec = load_json(MEDIA_RECEIPT, {"files": {}})
    for a in args:
        p = pathlib.Path(a).expanduser().resolve()
        if not p.exists():
            print("[BLOCKED - MISSING MEDIA] " + str(p))
            sys.exit(1)
        entry = rec.get("files", {}).get(str(p))
        cur_sig = media_fast_sig(p)
        if not entry or entry.get("sig") != cur_sig:
            print("[BLOCKED - UNINSPECTED MEDIA] " + p.name + " has no current media inspection receipt. Run `ss media-inspect` first.")
            sys.exit(1)
    print("[OK - MEDIA RECEIPT VERIFIED] All " + str(len(args)) + " media source(s) match disk signatures.")

def cmd_doc_check(args):
    if not args:
        print("Usage: ss doc-check <doc.pdf | doc.html | doc.md | doc.txt> [--playbook]")
        sys.exit(1)
    is_playbook = "--playbook" in args
    files = [a for a in args if not a.startswith("--")]
    for f in files:
        p = pathlib.Path(f).expanduser().resolve()
        if not p.exists():
            print("[BLOCKED - MISSING DOC] " + str(p))
            sys.exit(1)
        ext = p.suffix.lower()
        if ext == ".pdf":
            try:
                import pypdf
                reader = pypdf.PdfReader(str(p))
                text = "\n".join((pg.extract_text() or "") for pg in reader.pages)
            except Exception as e:
                print("[BLOCKED - PDF READ ERROR] " + str(e))
                sys.exit(1)
        else:
            text = p.read_text(errors="replace")

        # 1. Forbidden nomenclature & tech-buzzword scan
        for pat, msg in FORBIDDEN_COPY_PATTERNS:
            m = re.search(pat, text, re.I)
            if m:
                print("[DOC BLOCKED - NOMENCLATURE/PLAIN-LANGUAGE] " + p.name + ": " + msg + " ('" + m.group(0) + "')")
                sys.exit(1)

        # 2. Hashtag count check per paragraph/block (Instagram <= 5 max)
        for blk in re.split(r"\n\s*\n", text):
            tags = re.findall(r"(?:^|\s)(#[A-Za-z0-9_]{2,})", blk)
            if len(tags) > 5:
                print("[DOC BLOCKED - >5 HASHTAGS] " + p.name + " has " + str(len(tags)) + " hashtags in one block (max 5): " + " ".join(tags[:8]))
                sys.exit(1)

        # 3. Playbook PDF/HTML blank-line spacer check (Braille Pattern Blank U+2800)
        if is_playbook and ext in (".html", ".pdf"):
            if "\u2800" not in text and "&#10240;" not in text and "&#x2800;" not in text:
                print("[DOC BLOCKED - PLAYBOOK CLIPBOARD] " + p.name + " is missing Braille Pattern Blank (U+2800 / &#10240;) spacer lines — Chrome/Preview copy-paste will collapse paragraphs.")
                sys.exit(1)

    ok = "[OK - DOC VERIFIED] " + ", ".join(pathlib.Path(x).name for x in files) + " passed plain-language, nomenclature, hashtag, and clipboard checks."
    copy_clip(ok)
    print(ok)

def cmd_audit_copy(repo_dir, args):
    if not args:
        print("Usage: ss audit-copy <file1> [file2]")
        sys.exit(1)
    receipt_path = repo_dir / ".git" / ".ss_inspect_receipt.json"
    receipt = load_json(receipt_path, {"files": {}})
    now_ts = int(time.time())
    sections = []
    for spec in args[:2]:
        p = resolve_repo_path(repo_dir, spec)
        if not p:
            sections.append("=== MISSING: " + spec + " ===")
            continue
        rel = str(p.relative_to(repo_dir)) if str(p).startswith(str(repo_dir)) else str(p)
        raw_bytes = p.read_bytes()
        f_hash = sha256_bytes(raw_bytes)[:16]
        flines = raw_bytes.decode("utf-8", errors="replace").splitlines()
        out = ["=== AUDIT-COPY: " + rel + " (" + str(len(flines)) + "L | sha:" + f_hash + ") ==="]
        for idx, rln in enumerate(flines, 1):
            s = rln.strip()
            if not s or s.startswith("//") or s.startswith("/*") or s.startswith("*") or s.startswith("import "):
                continue
            if "PublicHeader" in s or ("pt-" in s and "section" in s):
                out.append("L" + str(idx) + " [LAYOUT]: " + re.sub(r"\s+", " ", s)[:130])
            cleaned = html.unescape(re.sub(r"<[^>]+>", " ", re.sub(r"\{[^}]{0,80}\}", " ", s)))
            cleaned = re.sub(r"\s+", " ", cleaned).strip()
            quotes = [m.group(1) for m in re.finditer(r"[\x27\"`]([^\x27\"`]{4,})[\x27\"`]", s) if " " in m.group(1) and not re.search(r"\b(flex|grid|bg-|text-|px-|py-|rounded-|border-|hover:|transition|stroke|fill)\b", m.group(1))]
            pieces = []
            if cleaned and re.search(r"[A-Za-z]{3,}", cleaned) and not re.search(r"^(const |let |return|export |function |if |\}|\)|<|className=|aria-|onClick=|href=|src=|d=|stroke|viewBox)", s):
                pieces.append(cleaned)
            for q in quotes:
                if q not in " ".join(pieces):
                    pieces.append(q)
            if pieces:
                line_txt = " | ".join(pieces)[:160]
                flags = [msg.split("—")[0].strip() for pat, msg in FORBIDDEN_COPY_PATTERNS if re.search(pat, ALLOWED_CODE_IDENT_RX.sub("", s), re.I)]
                prefix = "[FLAG: " + ", ".join(flags) + "] " if flags else ""
                out.append("L" + str(idx) + ": " + prefix + line_txt)
        receipt["files"][rel] = {"sha16": f_hash, "ranges": [[1, len(flines)]], "updated_at": now_ts}
        sections.append("\n".join(out[:140]))
    receipt_path.parent.mkdir(parents=True, exist_ok=True)
    receipt_path.write_text(json.dumps(receipt, indent=2))
    final_out = "\n".join(sections)[:6200]
    copy_clip("```text\n" + final_out + "\n```")
    print(final_out)

def main():
    argv = sys.argv[1:]
    repo_dir = SJB_DIR
    if argv and argv[0] == "--ops":
        repo_dir = OPS_DIR
        argv = argv[1:]
    elif pathlib.Path.cwd().resolve() == OPS_DIR.resolve():
        repo_dir = OPS_DIR

    cmd = argv[0] if argv else "status"
    rest = argv[1:]

    if cmd == "inspect":
        cmd_inspect(repo_dir, rest)
    elif cmd == "find":
        cmd_find(repo_dir, rest)
    elif cmd == "patch":
        cmd_patch(repo_dir, rest)
    elif cmd == "verify-local":
        cmd_verify_local(repo_dir)
    elif cmd in ("stage", "staging"):
        msg = rest[0] if rest else "chore: update staging"
        r = subprocess.run(["python3", str(repo_dir / "scripts" / "ss_promote.py"), "staging", msg], cwd=str(repo_dir))
        sys.exit(r.returncode)
    elif cmd == "prod":
        r = subprocess.run(["python3", str(repo_dir / "scripts" / "ss_promote.py"), "prod"], cwd=str(repo_dir))
        sys.exit(r.returncode)
    elif cmd == "status":
        r = subprocess.run(["python3", str(repo_dir / "scripts" / "ss_promote.py"), "status"], cwd=str(repo_dir))
        sys.exit(r.returncode)
    elif cmd == "clip":
        cmd_clip(repo_dir)
    elif cmd == "media-inspect":
        cmd_media_inspect(rest)
    elif cmd == "media-verify":
        cmd_media_verify(rest)
    elif cmd == "doc-check":
        cmd_doc_check(rest)
    elif cmd == "audit-copy":
        cmd_audit_copy(repo_dir, rest)
    else:
        print("Unknown ss command: " + cmd)
        print("Allowed: clip | inspect | audit-copy | find | patch | verify-local | stage | prod | status | media-inspect | media-verify | doc-check")
        sys.exit(1)

def cmd_clip(repo_dir):
    raw = subprocess.run(["pbpaste"], capture_output=True, text=True, check=False).stdout.strip()
    if raw.startswith("```"):
        lines = raw.splitlines()
        raw = "\n".join(lines[1:-1] if lines and lines[-1].strip() == "```" else lines[1:]).strip()
    if not raw or raw.startswith("Proceed with ss output:") or raw.startswith("===") or raw.startswith("[OK") or raw.startswith("[4/4]") or raw.startswith("[LOCAL") or raw.startswith("[DEPENDENCY") or raw.startswith("[BLOCKED") or raw.startswith("[CLIP") or raw.startswith("Repo:"):
        msg = "[CLIP] Clipboard holds previous output or is empty. Click Copy on a new ss command block first."
        print(msg)
        sys.exit(1)
    first_line = raw.splitlines()[0].strip()
    if re.search(r"^(?:source\s+\S+.*?&&\s*(?:cd\s+\S+\s*&&\s*)?|cd\s+\S+\s*&&\s*)ss\b", first_line):
        idx = raw.find("ss ")
        if idx != -1:
            raw = raw[idx:].strip()
    first_tok = raw.split()[0] if raw.split() else ""
    if first_tok != "ss" or raw.strip().startswith("ss clip"):
        msg = "[CLIP BLOCKED] Clipboard must start with an ss command (got: " + raw.splitlines()[0][:60] + ")"
        print(msg)
        sys.exit(1)
    print(">> [ss clip] " + raw.splitlines()[0])
    exec_cmd = "\"" + sys.executable + "\" \"" + str(pathlib.Path(__file__).resolve()) + "\"" + raw[2:]
    r = subprocess.run(["/bin/zsh", "-c", exec_cmd], cwd=str(repo_dir), capture_output=True, text=True)
    combined = ((r.stdout or "") + (r.stderr or "")).strip()
    if combined:
        print(combined)
        copy_clip(combined)
    sys.exit(r.returncode)

if __name__ == "__main__":
    main()
