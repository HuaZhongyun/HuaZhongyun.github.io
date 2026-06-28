# 学术主页配置指南

这是一套**数据驱动**的个人学术主页：所有内容都写在 `src/data/` 下的几个数据文件里
（YAML + 一个 BibTeX），网站在构建时自动解析渲染。**你几乎只需要改数据文件，不用碰代码。**

技术栈：[Astro](https://astro.build/)（静态站）+ 中/英双语 + GitHub Pages 部署。

> 配套还有 [README.md](./README.md)（简版）。本文是给「拿到这套模板、要换成自己信息」的人用的详细说明。

---

## 目录

1. [环境准备与本地运行](#1-环境准备与本地运行)
2. [改成你自己的主页：最小清单](#2-改成你自己的主页最小清单)
3. [数据文件逐个详解](#3-数据文件逐个详解)
4. [头像与图片](#4-头像与图片)
5. [词云关键词](#5-词云关键词)
6. [中英双语怎么工作](#6-中英双语怎么工作)
7. [论文分区（CCF / 中科院 / JCR）](#7-论文分区ccf--中科院--jcr)
8. [数据校验](#8-数据校验)
9. [构建与部署到 GitHub Pages](#9-构建与部署到-github-pages)
10. [常见任务速查](#10-常见任务速查)
11. [故障排查](#11-故障排查)

---

## 1. 环境准备与本地运行

需要 **Node.js 18+**（建议 20）。在 `site/` 目录下：

```bash
npm install            # 安装依赖（只需第一次）
npm run dev            # 本地预览，打开 http://localhost:4321
npm run validate:data  # 校验数据是否合法（也会在 build 前自动跑）
npm run build          # 生成静态站到 dist/
npm run preview        # 预览构建产物
npm run check          # TypeScript 类型检查
```

改任何数据文件后，`npm run dev` 会自动热刷新浏览器。**所有命令都要在 `site/` 目录下运行。**

---

## 2. 改成你自己的主页：最小清单

按顺序改这几处，就能把示例（花忠云）换成你自己：

1. **`src/data/profile.yaml`** — 姓名、职称、单位、邮箱、头像、社交链接、简介、招生信息。
2. **`public/images/`** — 把头像换成你自己的（见 [第 4 节](#4-头像与图片)）。
3. **`src/data/news.yaml`** — 新闻动态。
4. **`src/data/publications.bib`** — 论文列表（见 [3.2](#32-publicationsbib--论文)）。
5. **`src/data/categories.yaml`** + **`src/data/topics.yaml`** — 研究方向分组与子方向名。
6. **`src/data/honors.yaml`** / **`src/data/service.yaml`** — 获奖、学术服务。
7. **`src/components/TagSphere.astro`** — 右上角旋转词云的关键词（见 [第 5 节](#5-词云关键词)）。
8. **`astro.config.mjs`** 的 `site` 字段 — 改成你的网址。

页面结构（导航栏）：**About（首页） / Research / Service / Awards**。论文完整列表在 Research 页里通过「All publications」进入（不单独放进导航）。

---

## 3. 数据文件逐个详解

所有数据文件在 `src/data/`。YAML 里凡是 `{ en: ..., zh: ... }` 的字段都是**双语**，按当前语言显示；只写一种也可以。

### 3.1 `profile.yaml` — 个人信息

| 字段 | 说明 |
|---|---|
| `name` | 姓名（双语） |
| `title` | 职称，如 教授/Professor（双语） |
| `affiliation` | 单位全称（双语）。目前页面用的是下面的 `university` 短名 |
| `university` | 单位短名（双语），显示在页眉「职称 · 单位」那一行 |
| `location` | 所在地（双语）。注：当前页眉已合并为一行，未单独显示 location |
| `photo` | 头像路径，如 `/images/你的头像.jpg`（文件放 `public/images/`） |
| `emails` | 邮箱列表（可多个），显示在页眉、可点击发邮件 |
| `scholar_id` | 谷歌学术个人主页 id（地址栏 `user=` 后那串） |
| `news_preview` | 首页 News 默认显示几条（其余进「更多新闻」滚动区） |
| `socials` | 社交/学术链接列表，见下 |
| `bio` | 个人简介段落（双语）；`bio.contact` 是简介后的联系语 |
| `recruiting` | 招生广告框（双语）。**整块删掉即可隐藏该栏目** |
| `interests` | ⚠️ 遗留字段，当前页面已不显示，可忽略或删除 |

**socials（社交图标）**：每条 `{ key, label, url }`。`key` 决定显示哪个图标，支持：
`scholar`（谷歌学术）、`github`、`orcid`、`email`，其它 key 用通用链接图标。
删掉某条或留空 `url` 即隐藏该图标。
> 图标定义在 `src/components/Icon.astro`，需要新图标可在那里加。

### 3.2 `publications.bib` — 论文

标准 BibTeX，外加几个自定义字段。**新增一篇论文 = 在文件末尾粘一个条目。** 例：

```bibtex
@article{key2026short,
  author = {First Author and Your Name and ...},
  authorsraw = {First Author, Your Name, ...},   % 展示用的精确作者顺序（含你本人）
  title = {Paper Title},
  venue = {IEEE Transactions on ...},            % 展示用的会议/期刊名（斜体显示）
  year = {2026},
  volume = {19}, number = {3}, pages = {100-115},% 可选
  category = {dedup-audit},      % 细粒度方向 key（见下）
  corresponding = {yes},         % 可选：标记你本人为通讯作者（显示 *）
  status = {accepted},           % 可选：accepted | in press
  selected = {yes},             % 可选：在首页“代表性论文”中展示
  doi = {https://doi.org/10.1109/...},  % 可选：链接（DOI 或论文页 URL）
  github = {https://github.com/user/repo},  % 可选：代码仓库链接（显示 GitHub 按钮）
  ccf = {A},                     % 可选：CCF 分区 A/B/C
  jcr = {Q1},                    % 可选：JCR 分区 Q1–Q4
  cas = {2},                     % 可选：中科院大类分区 1–4
  castop = {yes}                 % 可选：中科院 Top 期刊
}
```

要点：
- **你本人的名字会自动加粗**。识别规则在 `src/lib/bibtex.ts` 的 `ME_RE`——换人时把里面的
  `zhongyun hua` / `花忠云` 改成新主人的姓名（中英文各种写法）。
- `category` 是**细粒度子方向**的 key（如 `deepfake`、`chaotic-system`），它决定论文归到哪个
  子方向；再由 `categories.yaml` 把子方向聚合成大方向。见 [3.3](#33-categoriesyaml--研究大方向) / [3.4](#34-topicsyaml--子方向名称)。
- 点击论文上的「**BibTeX**」会弹出窗口（内容由这些字段**自动生成**），无需手动维护。
- `ccf/jcr/cas` 等分区怎么批量获得，见 [第 7 节](#7-论文分区ccf--中科院--jcr)。
- 论文 PDF **不在网站上展示**（设计如此）；如需展示需改 `PublicationItem.astro`。

### 3.3 `categories.yaml` — 研究大方向

定义论文页/Research 页的**展示分组**（大方向），以及每个大方向**聚合哪些细方向 key**：

```yaml
- key: crypto
  name: { en: Applied Cryptography, zh: 应用密码学 }
  desc:
    en: "One-line description of this area."
    zh: "该方向的一句话简介。"
  keys: [dedup-audit, encrypted-query, ppml, rdh, ...]   # 包含哪些细方向
```

- 顺序 = 页面显示顺序。
- 一篇论文的 `category`（细 key）落在哪个分组的 `keys` 里，就归到那个大方向。
- 想**重新分组**：把某个细 key 在不同大方向的 `keys` 间移动即可，**不用改论文**。

### 3.4 `topics.yaml` — 子方向名称

把每个细 key 映射成**子方向的中英显示名**（Research 页每个大方向下的小标题）：

```yaml
dedup-audit: { en: "Secure deduplication & integrity auditing", zh: "安全去重与完整性审计" }
deepfake:    { en: "Deepfake & synthetic-media detection", zh: "深度伪造检测" }
```

> 规则：`publications.bib` 里用到的每个 `category` 都应在 `topics.yaml` 有名字，且应被
> `categories.yaml` 某个分组的 `keys` 收录。`npm run validate:data` 会检查这三者是否对齐。

### 3.5 `news.yaml` — 新闻动态

倒序排列（最新在最上）。新增就在**顶部**加一条：

```yaml
- date: 2026-07            # 格式 YYYY-MM
  highlight: true          # 可选：加粗强调
  en: "A paper is accepted by IEEE TIFS."
  zh: "一篇论文被 IEEE TIFS 录用。"
  link: "https://..."      # 可选：点击跳转
```

首页默认显示 `profile.yaml` 里 `news_preview` 条，其余在「更多新闻」里展开滚动。

### 3.6 `honors.yaml` — 获奖（Awards 页）

项目符号列表，倒序：

```yaml
- year: "2022–2025"
  highlight: true                 # 可选：用主题色强调
  title: { en: "Clarivate Highly Cited Researcher", zh: "科睿唯安“高被引学者”" }
  note:  { en: "four consecutive years", zh: "连续四年" }   # 可选：括注
  url: "https://..."              # 可选：链接
```

### 3.7 `service.yaml` — 学术服务（Service 页）

分为编委(`editorial`)、会议组织(`chair`)、学会会员(`membership`)、程序委员(`pc`)、审稿(`review`)：

```yaml
editorial:
  - period: "2025 – Now"
    role:  { en: "Associate Editor", zh: "副编辑" }
    venue: "IEEE Transactions on Dependable and Secure Computing"
chair: [ ... 同上结构 ... ]
membership:
  - period: "2023 – Now"
    role: { en: "IEEE Senior Member", zh: "IEEE 高级会员" }
pc:     ["AAAI 2024", "ICME 2024", ...]      # 纯字符串列表
review: ["IEEE TIFS", "IEEE TPAMI", ...]     # 纯字符串列表
```

---

## 4. 头像与图片

- 头像放在 `public/images/`，然后在 `profile.yaml` 的 `photo` 写路径（如 `/images/me.jpg`）。
- 建议尺寸 ≥ 360px、压缩后 < 100KB（页面显示约 180px）。PNG 照片偏大时建议转 JPEG。
- 其它图片（如机构 logo）也放 `public/`，用 `/xxx.png` 这种**站点根路径**引用。

---

## 5. 词云关键词

Research 页右上角的**旋转 3D 词云球**，关键词写死在 `src/components/TagSphere.astro` 顶部的
`tags` 数组里（每条 `{ en, zh, s }`，`s` 是字号档 1/2/3，3 最大）：

```js
const tags = [
  { en: 'Applied Cryptography', zh: '应用密码学', s: 3 },
  { en: 'Deepfake Detection', zh: '深度伪造检测', s: 2 },
  ...
];
```

改成主人的研究关键词即可。球会自动旋转、鼠标可拨动、支持「减少动态」系统设置。

---

## 6. 中英双语怎么工作

- 页眉右上角有**中/英切换**按钮，选择记在浏览器 `localStorage`。
- 数据里 `{ en, zh }` 的字段按当前语言显示；界面固定文案在 `src/i18n/ui.ts`。
- 实现方式：页面同时渲染中英两份，用 CSS 按 `<html data-lang>` 显示其一。
- 论文标题/作者/会议名一般只有英文（学术惯例），不需要翻译。

---

## 7. 论文分区（CCF / 中科院 / JCR）

论文条目里的 `ccf` / `jcr` / `cas` / `castop` 字段就是分区数据。它们用于：
**Research 页只展示 `ccf == A` 或 `cas == 1`（中科院一区）的代表性论文**（过滤规则在
`src/pages/research.astro`，可改）。

### 怎么批量补全分区

仓库自带脚本 `scripts/enrich-rankings.py`，从一个本地分区数据库 `jcr.db` 查询并写回 bib。
数据库来自开源项目 [jcr_mcp](https://github.com/yosh3289/jcr_mcp)（聚合了 CCF / 中科院 / JCR）。
步骤（一次性）：

```bash
# 1) 准备 jcr.db（在 jcr_mcp 项目里）
git clone https://github.com/yosh3289/jcr_mcp.git
cd jcr_mcp && python3 -m venv .venv && ./.venv/bin/pip install -r requirements.txt
printf "1\n4\n" | ./.venv/bin/python data_sync.py     # 同步分区数据 -> 生成 jcr.db

# 2) 回到本项目，按标题匹配并写回 ccf/jcr/cas 字段
#    （先看脚本顶部的 DB 路径，指向上面的 jcr.db）
./.venv/bin/python /path/to/site/scripts/enrich-rankings.py            # 先 dry-run 预览
./.venv/bin/python /path/to/site/scripts/enrich-rankings.py --write    # 确认无误后写入
```

> 会议论文只有 CCF（JCR/中科院是期刊专属，脚本会自动区分）。不在榜单的期刊留空属正常。
> 不想用分区功能：删掉 bib 里这些字段，并把 Research 页的过滤条件去掉即可。

---

## 8. 数据校验

`npm run validate:data` 会检查：BibTeX 必填字段、链接安全(只允许 http(s)/mailto/站内)、
`ccf/jcr/cas/status/selected` 等取值合法、`categories.yaml ↔ topics.yaml` key 是否对齐、
新闻日期格式等。**它会在 `npm run build` 前自动运行**，数据有问题会让构建失败，避免坏数据上线。

---

## 9. 构建与部署到 GitHub Pages

仓库已带 `.github/workflows/deploy.yml`：推送到 `main` 分支后，自动用 Astro 构建并发布到
GitHub Pages（不经过 Jekyll）。

**首次设置（很重要）：**
1. 仓库名建议为 `用户名.github.io`（个人主页），`astro.config.mjs` 的 `base` 保持 `/`。
2. 把 `astro.config.mjs` 的 `site` 改成你的网址。
3. 仓库 **Settings → Pages → Build and deployment → Source 选「GitHub Actions」**。
   ⚠️ 如果停留在「Deploy from a branch」，GitHub 会用 Jekyll 处理 Astro 源码导致页面错乱。
4. `git push` 到 `main`，等 Actions 跑完即上线。

> 项目若放在仓库的 `site/` 子目录，需在 `deploy.yml` 里给 `withastro/action` 加
> `with: { path: ./site }`。

---

## 10. 常见任务速查

| 想做的事 | 改哪里 |
|---|---|
| 换名字/职称/单位/邮箱/头像 | `profile.yaml`（+ `public/images/`），并改 `bibtex.ts` 的 `ME_RE` 姓名识别 |
| 加一篇论文 | 在 `publications.bib` 末尾加一个 `@...{}` 条目 |
| 把论文设为“代表作” | 给它加 `selected = {yes}` |
| 加一条新闻 | `news.yaml` 顶部加一行 |
| 改首页新闻显示条数 | `profile.yaml` 的 `news_preview` |
| 调整研究大方向/顺序 | `categories.yaml` |
| 改子方向名字 | `topics.yaml` |
| 某篇论文归错方向 | 改它的 `category` |
| 改词云关键词 | `src/components/TagSphere.astro` |
| 隐藏招生广告 | 删掉 `profile.yaml` 的 `recruiting` 整块 |
| 改导航项 | `src/components/Nav.astro` 的 `links` 数组 + `src/i18n/ui.ts` 文案 |
| 改主题色 | `src/styles/global.css` 顶部的 `--accent` 等变量 |

---

## 11. 故障排查

- **`npm run build` 失败、提示 data validation failed**：按报错信息改对应数据文件
  （多半是 bib 字段取值非法、或 `categories.yaml`/`topics.yaml` 的 key 不一致）。
- **命令报错找不到文件**：确认在 `site/` 目录下运行。
- **线上页面样式全乱**：GitHub Pages 的 Source 没设成「GitHub Actions」（见第 9 节）。
- **谷歌学术链接 404**：`profile.yaml` 的 `scholar_id` 或 socials 里的链接不对；登录谷歌学术
  打开自己主页，复制地址栏 `user=` 后那串。
- **本地预览端口被占**：先 `pkill -f "astro dev"` 再 `npm run dev`。

---

目录结构一览：

```
src/
  data/        ← 内容数据（你主要改这里）
  i18n/ui.ts   ← 界面固定文案（中/英）
  lib/         ← 解析逻辑（bibtex.ts / content.ts，一般不用动）
  components/  ← Nav、PublicationList、TagSphere 等
  pages/       ← index、research、publications、honors、service
  styles/global.css  ← 全站样式与主题变量
public/        ← 图片等静态资源（按原样发布）
scripts/       ← 数据迁移/分类/分区补全等一次性脚本
```
