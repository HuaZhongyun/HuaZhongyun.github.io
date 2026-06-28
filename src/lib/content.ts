import yaml from 'js-yaml';

// Import every YAML data file as a raw string at build time. Vite bundles them,
// so loading no longer depends on fs or the process working directory.
const RAW = import.meta.glob('../data/*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export type Lang = 'en' | 'zh';

/** A field that may be a plain string or a { en, zh } object. */
export type I18nField = string | { en?: string; zh?: string } | undefined;

/** Resolve a possibly-bilingual field for the given language (falls back to en). */
export function tf(field: I18nField, lang: Lang): string {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  return field[lang] ?? field.en ?? field.zh ?? '';
}

/** Normalize a possibly-bilingual field into an { en, zh } pair (both filled). */
export function pair(field: I18nField): { en: string; zh: string } {
  const en = tf(field, 'en');
  const zh = tf(field, 'zh');
  return { en, zh: zh || en };
}

function load<T>(name: string): T {
  const txt = RAW[`../data/${name}`];
  if (txt == null) throw new Error(`Missing data file: src/data/${name}`);
  return yaml.load(txt) as T;
}

// ---- typed shapes (loose; data is authored by hand) ----
export interface Profile {
  name: I18nField;
  title: I18nField;
  affiliation: I18nField;
  university?: I18nField;
  location: I18nField;
  photo: string;
  emails: string[];
  scholar_id: string;
  news_preview?: number;
  socials: { key: string; label: string; url: string }[];
  bio: { en: string; zh: string; contact: I18nField };
  recruiting?: { title: I18nField; body: I18nField };
  interests: { key: string; name: I18nField; desc: I18nField }[];
}
export interface NewsItem { date: string; en: string; zh: string; highlight?: boolean; link?: string }
export interface Honor { year?: string; title: I18nField; note?: I18nField; url?: string; highlight?: boolean }
export interface ServiceData {
  editorial: { period: string; role: I18nField; venue: I18nField }[];
  chair: { period: string; role: I18nField; venue: I18nField }[];
  membership: { period: string; role: I18nField }[];
  pc: string[];
  review: string[];
}
export interface PubCategory { key: string; name: I18nField; desc?: I18nField; keys?: string[] }

export const getProfile = () => load<Profile>('profile.yaml');
export const getNews = () => load<NewsItem[]>('news.yaml');
export const getHonors = () => load<Honor[]>('honors.yaml');
export const getService = () => load<ServiceData>('service.yaml');
export const getPubCategories = () => load<PubCategory[]>('categories.yaml');
export const getTopics = () => load<Record<string, I18nField>>('topics.yaml');

/** Format a "YYYY-MM" news date for display. */
export function formatNewsDate(date: string): string {
  const [y, m] = date.split('-');
  if (!m) return y;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}
