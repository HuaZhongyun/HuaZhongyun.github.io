import type { Lang } from '../lib/content';

export type { Lang };
export const LANGS: Lang[] = ['en', 'zh'];
export const DEFAULT_LANG: Lang = 'en';

/** UI string dictionary. Keep keys flat; values are { en, zh }. */
export const UI = {
  'nav.home': { en: 'About', zh: '关于' },
  'nav.research': { en: 'Research', zh: '研究' },
  'nav.honors': { en: 'Awards', zh: '获奖' },
  'nav.service': { en: 'Service', zh: '学术服务' },

  'section.news': { en: 'News', zh: '新闻动态' },
  'section.selected': { en: 'Representative Publications', zh: '代表性论文' },
  'section.editorial': { en: 'Editorial Service', zh: '编委服务' },
  'section.chair': { en: 'Conference Organization', zh: '会议组织' },
  'section.membership': { en: 'Membership', zh: '学会会员' },
  'section.pc': { en: 'Program Committee', zh: '程序委员会' },
  'section.review': { en: 'Journal Reviewing', zh: '期刊审稿' },

  'pub.all': { en: 'All', zh: '全部' },
  'pub.corresponding': { en: '* Corresponding author', zh: '* 通讯作者' },

  // Publication category labels live in src/data/categories.yaml (single source).

  'btn.viewAll': { en: 'View all publications', zh: '查看全部论文' },
  'btn.allPubs': { en: 'All publications →', zh: '全部论文 →' },
  'research.intro': {
    en: 'My current research interests focus on Applied Cryptography, Multimedia Security, Forensics & AI Security, and Nonlinear Systems & Applications. The word cloud on the right summarizes my current research focuses; for the complete list, see all publications.',
    zh: '我的研究涵盖以下方向，每个方向列出部分代表性工作；完整列表请见全部论文。',
  },

  'footer.updated': { en: 'Last updated', zh: '最近更新' },
  'footer.built': { en: 'Built with Astro · data-driven from BibTeX & YAML', zh: '基于 Astro 构建 · 数据由 BibTeX 与 YAML 驱动' },
} as const;

export type UIKey = keyof typeof UI;

export function t(key: UIKey, lang: Lang): string {
  const entry = UI[key];
  return entry[lang] ?? entry.en;
}
