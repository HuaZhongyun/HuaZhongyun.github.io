import { parse } from '@retorquere/bibtex-parser';
// Import the .bib as a raw string so Vite bundles it — no fs / process.cwd().
import bibText from '../data/publications.bib?raw';
import { getPubCategories } from './content';

// Category keys are data-driven (see src/data/categories.yaml); kept as string.
export type Category = string;

export interface Publication {
  key: string;
  type: 'article' | 'inproceedings' | string;
  authorsRaw: string;
  title: string;
  venue: string;
  year: number;
  volume?: string;
  number?: string;
  pages?: string;
  category: Category;
  corresponding: boolean;
  status?: string; // "accepted" | "in press"
  award?: string;
  selected: boolean;
  doi?: string;
  code?: string;
  ccf?: string;      // A | B | C
  jcr?: string;      // Q1..Q4
  cas?: string;      // 中科院大类分区 1..4
  castop?: boolean;  // 中科院 Top
}

function loadPublications(): Publication[] {
  const bib = parse(bibText, { raw: true });
  // `raw: true` keeps values verbatim, which can leave trailing newlines on the
  // last field of an entry — trim everything (URLs especially) to avoid bad hrefs.
  const s = (v?: string) => (v ?? '').trim();
  const opt = (v?: string) => {
    const t = s(v);
    return t.length ? t : undefined;
  };
  const pubs: Publication[] = bib.entries.map((e) => {
    const f = e.fields as Record<string, string>;
    return {
      key: e.key,
      type: e.type,
      authorsRaw: s(f.authorsraw ?? f.author),
      title: s(f.title),
      venue: s(f.venue ?? f.journal ?? f.booktitle),
      year: parseInt(s(f.year) || '0', 10) || 0,
      volume: opt(f.volume),
      number: opt(f.number),
      pages: opt(f.pages),
      category: (opt(f.category) as Category) ?? 'crypto',
      corresponding: s(f.corresponding) === 'yes',
      status: opt(f.status),
      award: opt(f.award),
      selected: s(f.selected) === 'yes',
      doi: opt(f.doi),
      code: opt(f.code),
      ccf: opt(f.ccf),
      jcr: opt(f.jcr),
      cas: opt(f.cas),
      castop: s(f.castop) === 'yes',
    };
  });
  // newest first; keep stable order within a year by venue/title
  pubs.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  return pubs;
}

let _cache: Publication[] | null = null;
export function getPublications(): Publication[] {
  if (!_cache) _cache = loadPublications();
  return _cache;
}

/** Map each fine-grained paper key -> its display group key (from categories.yaml). */
export function getGroupMap(): Map<string, string> {
  const map = new Map<string, string>();
  // First group that claims a fine key wins (matches categories.yaml's documented
  // behavior); a duplicate key in a later group is ignored (and flagged by validate).
  for (const g of getPubCategories()) {
    for (const k of g.keys && g.keys.length ? g.keys : [g.key]) {
      if (!map.has(k)) map.set(k, g.key);
    }
  }
  return map;
}

/** The display group a publication belongs to (falls back to its own key). */
export function groupOf(p: Publication, map = getGroupMap()): string {
  return map.get(p.category) ?? p.category;
}

/** Display groups present in the data, in categories.yaml order, with counts. */
export function getCategories(): { key: string; count: number }[] {
  const map = getGroupMap();
  const counts = new Map<string, number>();
  for (const p of getPublications()) {
    const g = groupOf(p, map);
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  const ordered = getPubCategories().map((c) => c.key).filter((k) => counts.has(k));
  const extras = [...counts.keys()].filter((k) => !ordered.includes(k));
  return [...ordered, ...extras].map((k) => ({ key: k, count: counts.get(k)! }));
}

export function getYears(): number[] {
  return [...new Set(getPublications().map((p) => p.year))].filter(Boolean).sort((a, b) => b - a);
}

/** Featured papers for the homepage: explicitly selected, then filled with most recent. */
export function getSelected(limit = 8): Publication[] {
  const pubs = getPublications();
  const flagged = pubs.filter((p) => p.selected);
  if (flagged.length >= limit) return flagged.slice(0, limit);
  const rest = pubs.filter((p) => !p.selected);
  return [...flagged, ...rest].slice(0, limit);
}

/** A bibliographic detail line, e.g. "vol. 19, pp. 4700-4715, 2024" or "accepted, 2026". */
export function pubDetail(p: Publication): string {
  const parts: string[] = [];
  if (p.volume) parts.push(`vol. ${p.volume}`);
  if (p.number) parts.push(`no. ${p.number}`);
  if (p.pages) parts.push(`pp. ${p.pages}`);
  if (p.status) parts.push(p.status);
  if (p.year) parts.push(String(p.year));
  return parts.join(', ');
}

const VENUE_MAP: [RegExp, string][] = [
  // conferences (when no parenthetical acronym is present)
  [/European Conference on Computer Vision/i, 'ECCV'],
  [/Learning Representations/i, 'ICLR'],
  [/International Conference on Machine Learning/i, 'ICML'],
  [/Computer Vision and Pattern Recognition/i, 'CVPR'],
  [/International Conference on Computer Vision/i, 'ICCV'],
  [/Web Information Systems Engineering/i, 'WISE'],
  [/Neural Information Processing Systems/i, 'NeurIPS'],
  [/Neural Information Processing/i, 'ICONIP'],
  [/Joint Conference on Neural Networks/i, 'IJCNN'],
  [/Computer and Communications Security/i, 'CCS'],
  [/USENIX Security/i, 'USENIX'],
  [/Cyberspace Safety and Security/i, 'CSS'],
  [/Nonlinear Theory and its Applications/i, 'NOLTA'],
  [/Proc\. SPIE|SPIE \d/i, 'SPIE'],
  // journals
  [/ACM Transactions on Multimedia/i, 'TOMM'],
  [/Information Forensics and Security/i, 'TIFS'],
  [/Dependable and Secure Computing/i, 'TDSC'],
  [/Services Computing/i, 'TSC'],
  [/Mobile Computing/i, 'TMC'],
  [/Transactions on Computers/i, 'TC'],
  [/Image Processing/i, 'TIP'],
  [/Industrial Informatics/i, 'TII'],
  [/Industrial Electronics/i, 'TIE'],
  [/Circuits and Systems for Video Technology/i, 'TCSVT'],
  [/Circuits and Systems II/i, 'TCAS-II'],
  [/Circuits and Systems I/i, 'TCAS-I'],
  [/Transactions on Multimedia/i, 'TMM'],
  [/Biometrics, Behavior, and Identity/i, 'TBIOM'],
  [/Vehicular Technology/i, 'TVT'],
  [/Computational Social Systems/i, 'TCSS'],
  [/Transactions on Cybernetics/i, 'TCYB'],
  [/Signal Processing Letters/i, 'SPL'],
  [/Transactions on Signal Processing/i, 'TSP'],
  [/Pattern Analysis and Machine Intelligence/i, 'TPAMI'],
  [/Knowledge and Data Engineering/i, 'TKDE'],
  [/Knowledge Discovery from Data/i, 'TKDD'],
  [/Internet of Things Journal/i, 'IoTJ'],
  [/Parallel and Distributed Systems/i, 'TPDS'],
  [/Neural Networks and Learning Systems/i, 'TNNLS'],
  [/Intelligent Transportation Systems/i, 'TITS'],
  [/Transactions on Big Data/i, 'TBD'],
  [/Systems, Man,? and Cybernetics: Systems/i, 'TSMC'],
  [/Nonlinear Dynamics/i, 'Nonlinear Dyn.'],
  [/Information Sciences/i, 'Inf. Sci.'],
  [/Science China Technological Sciences?/i, 'Sci. China'],
  [/Chaos,? Solitons/i, 'CSF'],
  [/Computers? & Security/i, 'C&S'],
  [/Computer Networks/i, 'Comput. Netw.'],
  [/Applied Intelligence/i, 'Appl. Intell.'],
  [/Neurocomputing/i, 'Neurocomputing'],
  [/Signal Processing: Image Communication/i, 'SPIC'],
  [/Signal Processing/i, 'Signal Process.'],
  [/IEEE Systems Journal/i, 'ISJ'],
  [/IEEE Access/i, 'IEEE Access'],
  [/King Saud University/i, 'JKSU-CIS'],
];

/** Short venue tag, e.g. "TIFS", "CCS", "ICML". */
export function venueAbbrev(venue: string): string {
  const v = (venue || '').trim();
  if (!v) return '';
  // 1) explicit parenthetical acronym, e.g. "(ACM CCS)" -> "CCS"
  const par = v.match(/\(([^)]+)\)/);
  if (par) {
    let a = par[1].replace(/\b(19|20)\d{2}\b/g, '').replace(/^ACM\s+/i, '').replace(/\s+\d+$/, '').trim();
    if (a) return a;
  }
  // 2) known venues
  for (const [re, a] of VENUE_MAP) if (re.test(v)) return a;
  // 3) fallback: "Transactions on X Y" -> T+initials; else initials of key words
  const stop = new Set(['and', 'of', 'for', 'the', 'on', 'in', 'a', 'an', 'its', 'with']);
  const tx = v.match(/Transactions on (.+)/i);
  const base = tx ? tx[1] : v.replace(/^Proc\.?\s+of\s+/i, '');
  const initials = base
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w) && !stop.has(w.toLowerCase())) // skip ordinals like "29th"
    .map((w) => w[0].toUpperCase())
    .join('')
    .slice(0, 5);
  return (tx ? 'T' + initials : initials) || v.slice(0, 6);
}

// Escape LaTeX-special characters for human-text BibTeX fields (not URLs).
const escTex = (v: string) => v.replace(/([&%$#_])/g, '\\$1');
// For URL/DOI values: escape only chars that break BibTeX (% starts a comment).
const escBibUrl = (v: string) => v.replace(/([%{}])/g, '\\$1');

/** The DOI field is sometimes a publisher page URL; emit `doi` or `url` accordingly. */
function doiOrUrl(p: Publication): [string, string] | null {
  if (!p.doi) return null;
  const m = p.doi.match(/10\.\d{4,9}\/\S+/); // a real DOI embedded in the string
  if (m) return ['doi', m[0]];
  if (/^https?:\/\//i.test(p.doi)) return ['url', p.doi];
  return ['doi', p.doi];
}

/** Generate a clean, standard BibTeX entry string for any publication. */
export function toBibtex(p: Publication): string {
  const authors = p.authorsRaw
    .split(/\s*,\s*and\s+|\s*,\s*|\s+and\s+/i)
    .map((a) => a.trim())
    .filter((a) => a.length > 1);
  const venueField = p.type === 'inproceedings' ? 'booktitle' : 'journal';
  const link = doiOrUrl(p);
  const fields: [string, string | undefined][] = [
    ['author', escTex(authors.join(' and '))],
    ['title', escTex(p.title)],
    [venueField, escTex(p.venue)],
    ['volume', p.volume],
    ['number', p.number],
    ['pages', p.pages],
    ['year', p.year ? String(p.year) : undefined],
    ...(link ? [[link[0], escBibUrl(link[1])]] as [string, string][] : []),
  ];
  const body = fields
    .filter(([, v]) => v && v.length)
    .map(([k, v]) => `  ${k} = {${v}}`)
    .join(',\n');
  const type = p.type === 'inproceedings' ? 'inproceedings' : 'article';
  return `@${type}{${p.key},\n${body}\n}`;
}

const ME_RE = /(zhong\s*yun\s+hua|hua\s+zhong\s*yun|花忠云)/i;

/** Render the author list as HTML, bolding the site owner's name. */
export function authorsHTML(p: Publication): string {
  const escaped = p.authorsRaw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  let html = escaped.replace(ME_RE, (m) => `<strong class="me">${m}</strong>`);
  if (p.corresponding) {
    html = html.replace(/(<strong class="me">[^<]*<\/strong>)/, '$1<sup title="Corresponding author">*</sup>');
  }
  return html;
}
