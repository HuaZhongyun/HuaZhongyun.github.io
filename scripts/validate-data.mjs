// Build-time data validation. Run via `npm run validate:data` (also wired as a
// prebuild step). Exits non-zero on hard errors so CI fails before deploy.
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { parse } from '@retorquere/bibtex-parser';

const ROOT = process.cwd();
const DATA = path.join(ROOT, 'src', 'data');
const PUBLIC = path.join(ROOT, 'public');

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const readYaml = (name) => yaml.load(fs.readFileSync(path.join(DATA, name), 'utf8'));

// URLs in data must be http(s), mailto:, or a same-origin path — blocks
// javascript:/data:, protocol-relative //host, and path traversal.
const SAFE_URL = /^(https?:\/\/|mailto:|\/(?!\/))/i;
const checkUrl = (where, url) => {
  const u = String(url || '').trim();
  if (!u) return;
  if (!SAFE_URL.test(u)) err(`${where}: unsafe/invalid URL "${url}"`);
  else if (u.startsWith('/') && /(^|\/)\.\.(\/|$)/.test(u)) err(`${where}: path traversal in URL "${url}"`);
};

// ---- categories.yaml: detect duplicate fine-key ownership ----
const categories = readYaml('categories.yaml');
const owner = new Map(); // fine key -> first group that claims it
const groupKeys = new Set();
for (const g of categories) {
  if (!g.key) err(`categories.yaml: a group is missing "key"`);
  if (groupKeys.has(g.key)) err(`categories.yaml: duplicate group key "${g.key}"`);
  groupKeys.add(g.key);
  if (!g.name || (!g.name.en && !g.name.zh)) err(`categories.yaml: group "${g.key}" has no name`);
  for (const k of g.keys && g.keys.length ? g.keys : [g.key]) {
    if (owner.has(k)) err(`categories.yaml: fine key "${k}" is claimed by both "${owner.get(k)}" and "${g.key}" (a key must belong to one group)`);
    else owner.set(k, g.key);
  }
}

// ---- publications.bib: required fields, asset existence, clean URLs ----
const bib = parse(fs.readFileSync(path.join(DATA, 'publications.bib'), 'utf8'), { raw: true });
const usedCats = new Set();
const seenKeys = new Set();
for (const e of bib.entries) {
  const f = e.fields;
  const id = e.key || '(no key)';
  if (seenKeys.has(e.key)) err(`publications.bib: duplicate entry key "${e.key}"`);
  seenKeys.add(e.key);
  for (const req of ['title', 'year']) {
    if (!f[req] || !String(f[req]).trim()) err(`publications.bib [${id}]: missing "${req}"`);
  }
  if (!f.authorsraw && !f.author) err(`publications.bib [${id}]: missing author/authorsraw`);
  if (!f.venue && !f.journal && !f.booktitle) warn(`publications.bib [${id}]: no venue/journal/booktitle`);
  if (f.category) usedCats.add(f.category.trim());
  else warn(`publications.bib [${id}]: no category`);

  for (const field of ['doi', 'github']) {
    const raw = f[field];
    if (raw == null) continue;
    // The bib parser's raw mode can append a trailing newline to a field; the
    // loader trims it, so trim here too and validate the resulting URL/asset.
    const url = raw.trim();
    if (!url) { err(`publications.bib [${id}]: "${field}" is empty`); continue; }
    if (/^\s*(javascript|data|vbscript):/i.test(url)) err(`publications.bib [${id}]: ${field} has a dangerous scheme: ${url}`);
    if (/\s/.test(url)) warn(`publications.bib [${id}]: "${field}" contains a space: ${url}`);
    if (url.startsWith('/')) {
      const fsPath = path.join(PUBLIC, decodeURIComponent(url));
      if (!fs.existsSync(fsPath)) err(`publications.bib [${id}]: ${field} points to missing file ${url}`);
    } else if (!/^https?:\/\//i.test(url)) {
      warn(`publications.bib [${id}]: ${field} is neither a site path nor http(s) URL: ${url}`);
    }
  }

  // ranking fields
  if (f.ccf && !['A', 'B', 'C'].includes(f.ccf.trim())) err(`publications.bib [${id}]: ccf must be A/B/C, got "${f.ccf}"`);
  if (f.jcr && !/^Q[1-4]$/.test(f.jcr.trim())) err(`publications.bib [${id}]: jcr must be Q1–Q4, got "${f.jcr}"`);
  if (f.cas && !/^[1-4]$/.test(f.cas.trim())) err(`publications.bib [${id}]: cas must be 1–4, got "${f.cas}"`);
  if (f.castop && f.castop.trim() !== 'yes') err(`publications.bib [${id}]: castop must be "yes", got "${f.castop}"`);
  // enum fields
  if (f.corresponding && f.corresponding.trim() !== 'yes') err(`publications.bib [${id}]: corresponding must be "yes", got "${f.corresponding}"`);
  if (f.selected && f.selected.trim() !== 'yes') err(`publications.bib [${id}]: selected must be "yes", got "${f.selected}"`);
  if (f.status && !/^(accepted|in press)$/i.test(f.status.trim())) err(`publications.bib [${id}]: status must be "accepted" or "in press", got "${f.status}"`);
}
// every paper category should map to a known group (else it falls into a raw-key group)
for (const c of usedCats) {
  if (!owner.has(c)) warn(`category "${c}" used by a paper is not listed in any categories.yaml group`);
}

// ---- topics.yaml <-> categories.yaml key coverage ----
const topics = readYaml('topics.yaml');
const topicKeys = new Set(Object.keys(topics || {}));
for (const k of owner.keys()) {
  if (!topicKeys.has(k)) err(`topics.yaml: missing sub-topic label for fine key "${k}" (used in categories.yaml)`);
}
for (const k of topicKeys) {
  if (!owner.has(k)) warn(`topics.yaml: label "${k}" is not used by any categories.yaml group`);
}

// ---- news.yaml: date format + bilingual presence + safe links ----
const news = readYaml('news.yaml');
for (const n of news) {
  if (!/^\d{4}-\d{2}$/.test(String(n.date || ''))) err(`news.yaml: invalid date "${n.date}" (expected YYYY-MM)`);
  if (!n.en) err(`news.yaml [${n.date}]: missing "en" text`);
  if (n.link) checkUrl(`news.yaml [${n.date}] link`, n.link);
}

// ---- honors.yaml: safe links ----
for (const h of readYaml('honors.yaml') || []) {
  if (h.url) checkUrl(`honors.yaml "${(h.title && (h.title.en || h.title)) || ''}"`, h.url);
}

// ---- profile.yaml: required basics + safe social links ----
const profile = readYaml('profile.yaml');
for (const req of ['name', 'photo', 'scholar_id']) {
  if (!profile[req]) err(`profile.yaml: missing "${req}"`);
}
if (profile.photo && profile.photo.startsWith('/') && !fs.existsSync(path.join(PUBLIC, profile.photo))) {
  err(`profile.yaml: photo file not found: ${profile.photo}`);
}
for (const s of profile.socials || []) {
  if (s.url) checkUrl(`profile.yaml social "${s.key || s.label}"`, s.url);
}

// ---- report ----
for (const w of warnings) console.warn('⚠️  ' + w);
if (errors.length) {
  for (const e of errors) console.error('❌ ' + e);
  console.error(`\nData validation failed: ${errors.length} error(s), ${warnings.length} warning(s).`);
  process.exit(1);
}
console.log(`✅ Data OK — ${bib.entries.length} publications, ${news.length} news, ${categories.length} groups, ${warnings.length} warning(s).`);
