import pathlib, sys, subprocess
NL = chr(10)
def resolve_path(q):
    p = pathlib.Path(q)
    if p.exists(): return p
    hits = sorted(pathlib.Path("src").rglob("*" + pathlib.Path(q).name + "*"))
    return hits[0] if hits else None
if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "inspect"
    secs = []
    if cmd == "inspect":
        args = sys.argv[2:]
        per = max(220, 1000 // max(1, len(args)))
        for spec in args:
            parts = spec.split(":", 1)
            p = resolve_path(parts[0])
            if not p:
                secs.append("MISSING:" + parts[0])
                continue
            flines = p.read_text().splitlines()
            sel = parts[1] if len(parts) > 1 else "1-30"
            matched = []
            if "-" in sel and sel.replace("-", "").isdigit():
                s, e = [int(x) for x in sel.split("-", 1)]
                for i in range(max(1, s), min(len(flines), e) + 1):
                    if flines[i-1].strip(): matched.append(str(i) + ": " + flines[i-1].strip()[:62])
            else:
                keys = [k.lower() for k in sel.split(",") if k]
                for i, l in enumerate(flines, 1):
                    if any(k in l.lower() for k in keys): matched.append(str(i) + ": " + l.strip()[:62])
            hdr = "=== " + str(p) + " (" + str(len(flines)) + "L) ==="
            secs.append((hdr + NL + NL.join(matched))[:per])
    out = NL.join(secs)[:1080]
    subprocess.run(["pbcopy"], input=out, text=True)
    print(out)
    print("[OK] Copied (" + str(len(out)) + " chars)")
