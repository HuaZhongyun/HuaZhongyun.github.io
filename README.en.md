# Zhongyun Hua — Academic Homepage

> 🌐 **English** · [中文](./README.md)

A fast, data-driven academic homepage built with [Astro](https://astro.build/).
**All content lives as structured data** and is parsed/rendered at build time —
edit the data, not the templates.

## Update content (the only thing you normally touch)

| What | File | Format |
|---|---|---|
| Publications | `src/data/publications.bib` | BibTeX (+ custom fields) |
| Publication groups (order + 中/英 names) | `src/data/categories.yaml` | YAML |
| News | `src/data/news.yaml` | YAML |
| Profile / bio / socials / interests | `src/data/profile.yaml` | YAML |
| Honors | `src/data/honors.yaml` | YAML |
| Academic service | `src/data/service.yaml` | YAML |
| UI labels (中/英) | `src/i18n/ui.ts` | TS dictionary |

### Add a publication
Append one entry to `src/data/publications.bib`:

```bibtex
@article{key2026short,
  author = {First Author and Zhongyun Hua and ...},
  authorsraw = {First Author, Zhongyun Hua, ...},   % exact display order
  title = {Paper Title},
  venue = {IEEE Transactions on ...},               % shown in italics
  year = {2026},
  category = {dedup-audit},     % fine topic key; grouped via categories.yaml
  corresponding = {yes},        % optional: marks Hua as corresponding (*)
  status = {accepted},          % optional: accepted | in press
  selected = {yes},             % optional: feature on the homepage
  doi = {https://doi.org/...},      % optional
  github = {https://github.com/...}, % optional: code repo link (GitHub button)
  pdf = {/pdf/your-paper.pdf}
}
```

The author's own name is automatically bolded; `selected = yes` papers appear in
the homepage "Selected Publications" block (it back-fills with the most recent
papers if fewer than 8 are flagged). PDFs go in `public/pdf/`. **A BibTeX entry is
generated automatically for every paper** from its fields — clicking the "BibTeX"
button opens a popup with a copy button, so there's no need to maintain `bibtexurl`.

### Manage publication groups
Each paper carries a **fine-grained** `category` key (e.g. `dedup-audit`,
`deepfake`, `chaotic-system`). The **display groups** on the Publications page are
defined in `src/data/categories.yaml`, where each group aggregates **multiple**
fine keys via `keys` (order = display order). A paper appears in the first group
whose `keys` contains its key.

- Regroup without re-tagging papers: move a fine key between groups' `keys`.
- Rename/translate a group: edit its `name`.
- Bulk-assign fine keys from titles: edit the rules in
  `scripts/reclassify.mjs`, then run `node scripts/reclassify.mjs`.
Any paper whose key isn't listed in any group still shows up, in a group labelled
by its raw key.

### Add news
Prepend a line to `src/data/news.yaml`:

```yaml
- date: 2026-07
  highlight: true            # optional emphasis
  en: "A paper is accepted by IEEE TIFS."
  zh: "一篇论文被 IEEE TIFS 录用。"
```

## Local development

```bash
npm install
npm run dev            # http://localhost:4321
npm run validate:data  # validate data (groups, required fields, link assets, dates)
npm run build          # static output -> dist/ (runs validate:data first)
npm run preview        # serve the build
npm run check          # type-check
```

> Data validation runs automatically before `npm run build` (`prebuild`) and in CI
> before deploy, failing the build on bad data. Run these commands from the Astro
> project root.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds with
Astro and publishes to GitHub Pages (no Jekyll). In the repo settings set
**Pages → Build and deployment → Source → GitHub Actions**.

For a `USERNAME.github.io` repo the Astro project sits at the repo root and
`base` stays `/` in `astro.config.mjs`. If you keep the project in a `site/`
subfolder, uncomment the `path: ./site` input in the workflow.

## Structure

```
src/
  data/        structured content (BibTeX + YAML) — edit here
  lib/         bibtex.ts (parse/sort/group), content.ts (YAML + i18n helpers)
  i18n/        ui.ts — bilingual UI dictionary
  components/  Hero, Nav, PublicationList/Item, NewsList, TagSphere, L, ...
  layouts/     Base.astro
  pages/       index, research, publications, honors, service
public/        images, pdf/, favicons (served as-is)
```

Bilingual (中/英) is handled by rendering both languages and toggling visibility
via CSS; the choice is remembered in `localStorage`.
