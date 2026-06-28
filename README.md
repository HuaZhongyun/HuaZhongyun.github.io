# 花忠云 — 学术主页

> 🌐 **中文** · [English](./README.en.md)

基于 [Astro](https://astro.build/) 构建的、数据驱动的学术主页。
**所有内容都以结构化数据存储**，在构建时解析并渲染——你只需改数据，无需动模板。

## 更新内容（日常只需改这些）

| 内容 | 文件 | 格式 |
|---|---|---|
| 论文 | `src/data/publications.bib` | BibTeX（含自定义字段） |
| 论文分组（顺序 + 中/英名称） | `src/data/categories.yaml` | YAML |
| 新闻动态 | `src/data/news.yaml` | YAML |
| 个人信息 / 简介 / 社交链接 / 研究方向 | `src/data/profile.yaml` | YAML |
| 荣誉奖项 | `src/data/honors.yaml` | YAML |
| 学术服务 | `src/data/service.yaml` | YAML |
| 界面文案（中/英） | `src/i18n/ui.ts` | TS 字典 |

### 新增一篇论文
在 `src/data/publications.bib` 末尾追加一条：

```bibtex
@article{key2026short,
  author = {First Author and Zhongyun Hua and ...},
  authorsraw = {First Author, Zhongyun Hua, ...},   % 展示用的精确作者顺序
  title = {Paper Title},
  venue = {IEEE Transactions on ...},               % 以斜体显示
  year = {2026},
  category = {dedup-audit},     % 细粒度方向 key；在 categories.yaml 中聚合成分组
  corresponding = {yes},        % 可选：标记花忠云为通讯作者（*）
  status = {accepted},          % 可选：accepted | in press
  selected = {yes},             % 可选：在首页“代表性论文”中展示
  doi = {https://doi.org/...},     % 可选
  github = {https://github.com/...}, % 可选：代码仓库链接（GitHub 按钮）
  pdf = {/pdf/your-paper.pdf}
}
```

本人的名字会自动加粗；标记了 `selected = yes` 的论文会出现在首页“代表性论文”
区块（若标记数量不足 8 篇，会自动用最新论文补足）。PDF 放在 `public/pdf/` 目录。
**每篇论文的 BibTeX 由结构化字段自动生成**，点击论文上的 “BibTeX” 按钮会弹出小窗口
（可一键复制），无需手动维护 `bibtexurl`。

### 管理论文分组
每篇论文带一个**细粒度** `category` key（如 `dedup-audit`、`deepfake`、
`chaotic-system`）。论文页的**展示分组**在 `src/data/categories.yaml` 中定义，每个
分组通过 `keys` **聚合多个**细 key（顺序即展示顺序）。一篇论文会出现在第一个 `keys`
包含它的分组里。

- 不动论文标签就能重新分组：把某个细 key 在不同分组的 `keys` 间移动即可。
- 重命名 / 翻译分组：只改 `name`。
- 按标题批量打细 key：编辑 `scripts/reclassify.mjs` 里的规则，再运行
  `node scripts/reclassify.mjs`。
若某篇论文的 key 不在任何分组的 `keys` 中，它也不会消失，而是单独成组、以 key 名显示。

### 新增一条新闻
在 `src/data/news.yaml` 顶部插入一行：

```yaml
- date: 2026-07
  highlight: true            # 可选：高亮强调
  en: "A paper is accepted by IEEE TIFS."
  zh: "一篇论文被 IEEE TIFS 录用。"
```

## 本地开发

```bash
npm install
npm run dev            # http://localhost:4321
npm run validate:data  # 校验数据（分组、必填字段、链接资源、日期等）
npm run build          # 静态产物输出到 dist/（构建前自动跑 validate:data）
npm run preview        # 预览构建产物
npm run check          # 类型检查
```

> 数据校验在 `npm run build` 前会自动执行（`prebuild`），CI 部署前也会跑，数据有问题会让构建失败。请在 Astro 项目根目录运行这些命令。

## 部署

推送到 `main` 分支会触发 `.github/workflows/deploy.yml`，用 Astro 构建并发布到
GitHub Pages（不经过 Jekyll）。在仓库设置中将
**Pages → Build and deployment → Source → 设为 GitHub Actions**。

对于 `用户名.github.io` 仓库，Astro 项目放在仓库根目录，`astro.config.mjs` 里的
`base` 保持为 `/`。若你把项目放在 `site/` 子目录，请在工作流中取消注释 `path: ./site`。

## 目录结构

```
src/
  data/        结构化内容（BibTeX + YAML）——在此处编辑
  lib/         bibtex.ts（解析/排序/分组）、content.ts（YAML + 国际化辅助）
  i18n/        ui.ts —— 中英界面文案字典
  components/  Hero、Nav、PublicationList/Item、NewsList、TagSphere、L 等
  layouts/     Base.astro
  pages/       index、research、publications、honors、service
public/        images、pdf/、favicon（按原样提供）
```

中/英双语通过同时渲染两种语言、用 CSS 切换可见性实现；语言选择记忆在 `localStorage`。
