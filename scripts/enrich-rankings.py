import sqlite3, re, sys

DB = "/Users/zky/mcp-servers/jcr_mcp/jcr.db"
BIB = "/Users/zky/temp/学术主页/site/src/data/publications.bib"
WRITE = "--write" in sys.argv

con = sqlite3.connect(DB); con.row_factory = sqlite3.Row
cur = con.cursor()
load = lambda t: [dict(r) for r in cur.execute(f"SELECT * FROM {t}").fetchall()]
CCF, JCR, CAS = load("CCF2026"), load("JCR2024"), load("FQBJCR2025")
CATCOL = "CCF推荐类别（国际学术刊物/会议）"

ORD = ("first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|"
       "thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|"
       "twenty-fourth|twenty-ninth|thirty-second|thirty-eighth|thirty-ninth|forty-first|forty-third")

def norm(s):
    s = (s or "").lower()
    s = re.sub(r"\([^)]*\)", " ", s)
    s = re.sub(r"^\s*proc\.?\s+of\s+", " ", s)
    s = re.sub(r"\b(19|20)\d{2}\b", " ", s)
    s = re.sub(r"\b\d+(st|nd|rd|th)\b", " ", s)
    s = re.sub(rf"\b(the|{ORD})\b", " ", s)
    s = re.sub(r"[^a-z0-9& ]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s.replace(" and ", " & ")

def match(rows, vc, col="Journal", minratio=0.5, want=None):
    best, score = None, 0.0
    for r in rows:
        if want and want not in (r.get(CATCOL) or ""):
            continue
        j = norm(r.get(col))
        if len(j) < 6:
            continue
        if j in vc:
            sc = len(j) / max(len(vc), 1)
        elif vc in j:
            sc = len(vc) / max(len(j), 1)
        else:
            continue
        if sc >= minratio and sc > score:
            best, score = r, sc
    return best

def enrich(venue, is_conf):
    vc = norm(venue); out = {}
    c = match(CCF, vc, want=("会议" if is_conf else "刊物"), minratio=0.5)
    if c and c.get("CCF推荐类型"):
        out["ccf"] = c["CCF推荐类型"].replace("类", "").strip()
    if not is_conf:  # JCR & 中科院 are journal-only
        j = match(JCR, vc, minratio=0.6)
        if j and j.get("IF Quartile(2024)"):
            out["jcr"] = j["IF Quartile(2024)"].strip()
        a = match(CAS, vc, minratio=0.6)
        if a and a.get("大类分区"):
            m = re.match(r"\s*(\d+)", str(a["大类分区"]))
            if m:
                out["cas"] = m.group(1)
                if str(a.get("Top", "")).strip() == "是":
                    out["castop"] = "yes"
    return out

src = open(BIB, encoding="utf-8").read()
blocks = re.split(r"(?=^@)", src, flags=re.M)
seen, out_blocks = {}, []
for blk in blocks:
    if not blk.startswith("@"):
        out_blocks.append(blk); continue
    is_conf = blk[:14].lower().startswith("@inproceedings")
    vm = re.search(r"venue = \{([^}]*)\}", blk)
    venue = vm.group(1).strip() if vm else ""
    info = enrich(venue, is_conf) if venue else {}
    seen.setdefault(venue, (is_conf, info))
    blk = re.sub(r"^\s*(ccf|jcr|cas|castop) = \{[^}]*\},?\n", "", blk, flags=re.M)
    if info:
        # ensure the field right before the closing brace ends with a comma
        blk = re.sub(r"([^\s,{])\s*(\n\})", r"\1,\2", blk, count=1)
        add = "".join(f"  {k} = {{{v}}},\n" for k, v in info.items()).rstrip("\n")
        blk = re.sub(r"(\n\})", "\n" + add + r"\1", blk, count=1)
    out_blocks.append(blk)

if WRITE:
    open(BIB, "w", encoding="utf-8").write("".join(out_blocks))
    print("WROTE", BIB, "\n")

print(f"{'VENUE':58} {'type':5} CCF  JCR  CAS")
for v in sorted(seen):
    if not v: continue
    is_conf, i = seen[v]
    cas = i.get("cas", "") + ("(Top)" if i.get("castop") else "")
    print(f"{v[:56]:58} {'conf' if is_conf else 'jour':5} {i.get('ccf',''):4} {i.get('jcr',''):4} {cas}")
