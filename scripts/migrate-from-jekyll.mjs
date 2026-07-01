// One-time migration: parses the old Jekyll about.md publication list into
// publications.bib. Kept for reference / re-runs. Override paths via env:
//   OLD_ABOUT=/path/to/old/_pages/about.md node scripts/migrate-from-jekyll.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = process.env.OLD_ABOUT || path.join(ROOT, '..', 'old-site', '_pages', 'about.md');
const OUT = path.join(ROOT, 'src', 'data', 'publications.bib');

const src = fs.readFileSync(SRC, 'utf8');
const start = src.indexOf('<h1 id="-Publications">');
const end = src.indexOf('<h1 id="-Peer Review">');
const region = src.slice(start, end);

const CAT_MAP = {
  'Applied Cryptography': 'crypto',
  'Multimedia Security': 'multimedia',
  'Nonlinear Systems': 'nonlinear',
};
function catKey(h4text) {
  if (/Applied Cryptography/i.test(h4text)) return 'crypto';
  if (/Multimedia|Forensics|AI Security|Trustworthy/i.test(h4text)) return 'multimedia';
  if (/Nonlinear/i.test(h4text)) return 'nonlinear';
  return 'other';
}

const chunks = region.split('<li id="paperdistance">');
let currentCat = 'crypto';
// preamble (chunks[0]) — first h4
{
  const m = [...chunks[0].matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>/g)];
  if (m.length) currentCat = catKey(m[m.length - 1][1]);
}

const entries = [];
for (let i = 1; i < chunks.length; i++) {
  let chunk = chunks[i];
  let thisCat = currentCat;
  // a trailing <h4> in this chunk announces the next category
  const h4 = chunk.match(/<h4[^>]*>([\s\S]*?)<\/h4>/);
  if (h4) {
    chunk = chunk.slice(0, chunk.indexOf('<h4'));
    currentCat = catKey(h4[1]);
  }
  const parsed = parseEntry(chunk, thisCat);
  if (parsed) entries.push(parsed);
}

// Rewrite links to site-relative paths and verify the target exists in public/.
// Returns a usable URL, or null when the asset is missing (drop the dead link).
const PUBLIC = path.join(ROOT, 'public');
function resolveAsset(u) {
  if (/^https?:/i.test(u) && !/github\.com\/HuaZhongyun/i.test(u)) return u; // external link, keep
  // normalize: github-raw prefix or stale wp-content path -> /pdf/ or /BibTex/
  let p = u
    .replace(/^https?:\/\/github\.com\/HuaZhongyun\/HuaZhongyun\.github\.io\/raw\/main\//i, '/')
    .replace(/\\/g, '/');
  const m = p.match(/\/(pdf|BibTex|Code)\/(.+)$/i);
  if (!m) return null;
  p = `/${m[1]}/${m[2]}`;
  const variants = [p, p.replace(/[ %20]+/g, '_'), p.replace(/ /g, '_')];
  for (const c of variants) {
    if (fs.existsSync(PUBLIC + decodeURIComponent(c))) return c.replace(/ /g, '%20');
  }
  return null;
}

function clean(s) {
  return s
    .replace(/<\/?li>/g, '')
    .replace(/<\/?ol[^>]*>/g, '')
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseEntry(raw, cat) {
  let text = raw;
  // --- links ---
  const links = {};
  const linkRe = /<a\s+href="([^"]+)"[^>]*>\s*\[([^\]]+)\]\s*<\/a>/gi;
  let lm;
  while ((lm = linkRe.exec(text)) !== null) {
    const label = lm[2].trim().toLowerCase();
    // URLs never contain whitespace; drop anything after it (guards against
    // malformed source hrefs like `href="... target="_blank"`).
    links[label] = lm[1].trim().split(/\s/)[0];
  }
  text = text.replace(linkRe, ' ');

  // --- award ---
  let award = '';
  const aw = text.match(/\[([^\]]*(?:Distinguished|Best)\s+Paper[^\]]*)\]/i);
  if (aw) { award = aw[1].trim(); text = text.replace(aw[0], ' '); }
  if (/nominated for the Best Paper/i.test(raw)) award = award || 'Best Paper Award Nominee';

  // split around the title quotes
  const titleM = text.match(/["“]([^"”]+)["”]/);
  if (!titleM) return null;
  const title = titleM[1]
    .replace(/<\/?[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[\s,，]+$/, '')
    .trim();

  // --- venue --- prefer bold-italic; else plain-text after the title (older confs)
  let venue = '';
  let tail = '';
  const vm = text.match(/<B>\s*<I>([\s\S]*?)<\/I>\s*<\/B>/i);
  const afterTitle = text.slice(titleM.index + titleM[0].length);
  if (vm) {
    venue = clean(vm[1]).replace(/<\/?[BI]>/gi, '').trim();
    tail = clean(text.slice((vm.index ?? 0) + vm[0].length));
  } else {
    let v = clean(afterTitle).replace(/<\/?[^>]+>/g, '');
    v = v.replace(/^[\s,，.]*/, '').replace(/^in\s+/i, '');
    tail = v; // keep full text for year/page parsing below
    v = v.replace(/（EI）|\(EI\)/g, '').trim();
    v = v.replace(/\b\d{4}\.\d{1,2}[.\-–\d]*/g, '').trim(); // conference dates
    v = v.replace(/,?\s*pp?\.?\s*[\dMm\-–]+.*$/i, '').trim(); // page info onward
    v = v.replace(/,\s*\d{1,4}\s*[-–]\s*\d{1,4}\s*\(?\d{0,4}\)?\.?\s*$/, '').trim();
    v = v.replace(/[\s,，.]+$/, '').trim();
    venue = v;
  }

  // authors = before the opening quote
  let authorsRaw = text.slice(0, titleM.index);
  const corresponding = /<B>[^<]*Hua[^<]*\*[^<]*<\/B>|Hua\s*\*/i.test(authorsRaw);
  authorsRaw = authorsRaw
    .replace(/<\/?[BI]>/gi, '')
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[，,]\s*[，,]/g, ', ')
    .replace(/^[\s,，]+|[\s,，]+$/g, '')
    .trim();
  const authors = authorsRaw
    .split(/\s*(?:,|，|\band\b)\s*/)
    .map((a) => a.trim())
    .filter((a) => a.length > 1);

  const year = (tail.match(/\b(19|20)\d{2}\b/g) || []).slice(-1)[0] || '';
  const volume = (tail.match(/vol\.?\s*([0-9]+)/i) || [])[1] || '';
  const number = (tail.match(/no\.?\s*([0-9]+)/i) || [])[1] || '';
  const pages = (tail.match(/pp\.?\s*([0-9]+\s*[-–]+\s*[0-9]+|[0-9]+)/i) || [])[1] || '';
  let status = '';
  if (/in\s*press/i.test(tail)) status = 'in press';
  else if (/accepted/i.test(tail)) status = 'accepted';

  const isConf = !vm
    || (/Proc\.|Conference|Symposium|Workshop|USENIX|Computer and Communications Security/i.test(venue)
      && !/Transactions|Journal|Letters|Sciences?\b/i.test(venue));

  return {
    cat, type: isConf ? 'inproceedings' : 'article',
    authors, authorsRaw, corresponding, title, venue, year,
    volume, number, pages: (pages || '').replace(/\s/g, ''), status, award, links,
  };
}

// --- emit BibTeX ---
function bibField(k, v) {
  if (v === undefined || v === null || v === '') return '';
  return `  ${k} = {${String(v).replace(/[{}]/g, '')}},\n`;
}
function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 14);
}
const usedKeys = new Set();
function makeKey(e) {
  const last = (e.authors[0] || 'anon').split(/\s+/).slice(-1)[0];
  const firstTitle = (e.title.split(/\s+/)[0] || 'x');
  let base = slug(last) + (e.year || 'na') + slug(firstTitle);
  let key = base, n = 1;
  while (usedKeys.has(key)) key = base + (++n);
  usedKeys.add(key);
  return key;
}

let bib = `% Publications for Zhongyun Hua — structured source of truth.
% Standard BibTeX fields + custom fields:
%   category = crypto | multimedia | nonlinear
%   correspondingauthors = {Zhongyun Hua; Other Name}
%   status = accepted | in press
%   pdf / doi / code = links
%   award = award text;  selected = yes (featured on the homepage)
% Add a paper: append one entry below. Set "selected = yes" to feature it.\n\n`;

let selectedCount = 0;
for (const e of entries) {
  const key = makeKey(e);
  const venueKey = e.type === 'inproceedings' ? 'booktitle' : 'journal';
  const selected = e.award ? 'yes' : '';
  if (selected) selectedCount++;
  bib += `@${e.type}{${key},\n`;
  bib += bibField('author', e.authors.join(' and '));
  bib += bibField('title', e.title);
  bib += bibField(venueKey, e.venue);
  bib += bibField('year', e.year || '');
  bib += bibField('volume', e.volume);
  bib += bibField('number', e.number);
  bib += bibField('pages', e.pages);
  bib += bibField('category', e.cat);
  if (e.corresponding) bib += bibField('corresponding', 'yes');
  if (e.status) bib += bibField('status', e.status);
  if (e.award) bib += bibField('award', e.award);
  if (selected) bib += bibField('selected', 'yes');
  const pdfLink = e.links['pdf'] ? resolveAsset(e.links['pdf']) : null;
  const codeLink = e.links['code'] ? resolveAsset(e.links['code']) : null;
  if (e.links['doi']) bib += bibField('doi', e.links['doi']);
  if (pdfLink) bib += bibField('pdf', pdfLink);
  if (codeLink) bib += bibField('code', codeLink);
  bib = bib.replace(/,\n$/, '\n');
  bib += `}\n\n`;
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, bib);

const byCat = entries.reduce((a, e) => ((a[e.cat] = (a[e.cat] || 0) + 1), a), {});
console.log(`Wrote ${entries.length} entries to publications.bib`);
console.log('By category:', byCat);
console.log('With year:', entries.filter((e) => e.year).length, '/ missing:', entries.filter((e) => !e.year).length);
console.log('Corresponding-author papers:', entries.filter((e) => e.corresponding).length);
console.log('Award papers (auto-selected):', selectedCount);
console.log('With doi:', entries.filter((e) => e.links['doi']).length, ' with pdf:', entries.filter((e) => e.links['pdf']).length);
// sanity: show a few that failed to get a venue or authors
const noVenue = entries.filter((e) => !e.venue);
const noAuthors = entries.filter((e) => e.authors.length === 0);
console.log('No venue:', noVenue.length, ' No authors:', noAuthors.length);
if (noVenue.length) console.log('  e.g. title:', noVenue.slice(0, 3).map((e) => e.title));
