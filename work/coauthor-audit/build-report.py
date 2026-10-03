# -*- coding: utf-8 -*-
import json, re, html, pathlib, difflib
p=pathlib.Path(__file__).parent
def read(n): return json.loads((p/n).read_text())
findings=[
 dict(title='Two-dimensional multi-tooth hyperchaotic map and application in medical secure transmission',venue='Expert Systems with Applications 290:128448 (2025)',authors='Han Bao; Zheng Fan; Zhongyun Hua; Yunzhen Zhang; Quan Xu; Bocheng Bao',doi='10.1016/j.eswa.2025.128448',url='https://www.sciencedirect.com/science/article/abs/pii/S0957417425020676'),
 dict(title='Frequency-driven deep learning network for image splicing forgery detection',venue='Knowledge-Based Systems 330:114365 (2025)',authors='Enji Liang; Kuiyuan Zhang; Zhongyun Hua; Xiaohua Jia',doi='10.1016/j.knosys.2025.114365',url='https://www.sciencedirect.com/science/article/pii/S0950705125014042'),
 dict(title='Controllable facial protection against malicious translation-based attribute editing',venue='Knowledge-Based Systems 309:112873 (2025)',authors='Yiyi Xie; Yuqian Zhou; Tao Wang; Zhongyun Hua; Wenying Wen; Shuang Yi; Yushu Zhang',doi='10.1016/j.knosys.2024.112873',url='https://www.sciencedirect.com/science/article/abs/pii/S0950705124015077'),
 dict(title='Generation of n-dimensional complex chaotic system via parameter matrix configuration',venue='Chaos, Solitons & Fractals 197:116453 (2025)',authors='Jinhui Yao; Yinxing Zhang; Han Bao; Zhongyun Hua',doi='10.1016/j.chaos.2025.116453',url='https://www.sciencedirect.com/science/article/pii/S0960077925004667'),
 dict(title='High-precision privacy-protected image retrieval based on multi-feature fusion',venue='Knowledge-Based Systems 315:113243 (2025)',authors='Miao Tian; Moting Su; Xiangli Xiao; Shuang Yi; Zhongyun Hua; Yushu Zhang',doi='10.1016/j.knosys.2025.113243',url='https://www.sciencedirect.com/science/article/pii/S0950705125002904'),
 dict(title='A fair and scalable watermarking scheme for the digital content trading industry',venue='Computers in Industry 161:104125 (2024)',authors='出版商 CRediT 作者贡献声明明确列出 Zhongyun Hua；完整作者顺序仍待补齐。已见 Xiangli Xiao、Moting Su、Jiajia Jiang、Yushu Zhang、Zhongyun Hua。',doi='10.1016/j.compind.2024.104125',url='https://www.sciencedirect.com/science/article/abs/pii/S0166361524000538'),
 dict(title='Metaverse: Security and Privacy Concerns',venue='Journal of Metaverse 3(2):93–99 (2023)',authors='Ruoyu Zhao; Yushu Zhang; Youwen Zhu; Rushi Lan; Zhongyun Hua',doi='10.57019/jmv.1286526',url='https://dergipark.org.tr/en/pub/jmv/issue/75916/1286526')]
pending=[
 dict(title='Lightweight Joint Audio-Visual Deepfake Detection via Single-Stream Multi-Modal Learning Framework',status='arXiv 2506.07358，2025；作者包含 Zhongyun Hua。未核实正式发表版本。',url='https://arxiv.org/abs/2506.07358'),
 dict(title='Prior-Attack Defense: Feature-Preserving Perturbations Through Bi-level Meta-learning',status='SSRN 5898399，2025；作者包含 Zhongyun Hua。未核实正式发表版本。',url='https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5898399'),
 dict(title='Rethinking Data Augmentation for Adversarial Distillation: An Excess Risk Perspective',status='第三方聚合页列出 Zhongyun Hua 并标为 ICLR 2026，但查到的 OpenReview PDF 为匿名投稿版本，未核实官方录用决定；不能计入正式发表遗漏。',url='https://openreview.net/pdf/4af32dbe34ad2a69203a2477e557331f10522fad.pdf')]
home={
'Yifeng Zheng':('https://yifengzcs.github.io/publications.html','已核对联合论文；SecureComm 条目此前已补录'),
'Yushu Zhang':('https://yushuzhang.cn/','已读取个人主页公开论文列表；列表并非全部历史成果'),
'Han Bao':('https://hanbao.wiki/en/publications/','已读取论文列表；发现遗漏'),
'Bocheng Bao':('https://bochengbao.com/publications/','已读取论文列表；页面更新范围有限'),
'Kuiyuan Zhang':('https://redamancyay.github.io/publications/','已核对个人论文列表，并补查出版商'),
'Songlei Wang':('https://songleiw.github.io/homepage/','已核对主页联合论文'),
'Yongyong Chen':('https://cyyhit.github.io/publications/','已读取精选论文列表'),
'Yansong Gao':('https://garrisongys.github.io/garrison//publications/','已核对联合论文'),
'Yinxing Zhang':('https://xzy.kust.edu.cn/info/1127/3120.htm','已读取学校主页论文列表'),
'Shuren Qi':('https://shurenqi.github.io/','已读取精选论文'),
'Keke Tang':('https://tangbohu.github.io/','已读取；HHA/NHHA 为既有条目标题差异'),
'Rongqin Liang':('https://blessinglrq.github.io/blessing.github.io/','已读取主页论文'),
'Jinhao Cui':('https://gcjh.github.io/2024/08/08/Homepage/','已读取主页论文'),
'Haibo Hu':('https://haibohu.org/publication/','已检索联合署名 Z. Hua'),
'Leo Yu Zhang':('https://riselabgriffith.github.io/publications/','已检索实验室长列表联合署名，并核对返回条目'),
'Yiming Li':('https://liyiming.tech/publications/','页面主要提供学术索引链接，非完整本地列表'),
'Xiaohua Jia':('https://www.cs.cityu.edu.hk/~jia/','主页提供 DBLP 链接；另核对出版商记录'),
'Jian Weng':('https://jessy-js.github.io/cryptjweng.github.io/','已读取主页；完整列表依赖学术索引'),
'Xingliang Yuan':('https://xyuancs.github.io/','已读取精选论文'),
'Cong Wang':('https://www.cs.cityu.edu.hk/~congwang/','已读取主页；完整论文外链未全部覆盖'),
'Nankun Mu':('https://faculty.cqu.edu.cn/NankunMu/zh_CN/lwcg/343342/list/index.htm','已访问主页及论文栏目；可解析内容有限'),
'Tao Xiang':('https://faculty.cqu.edu.cn/txiang/en/lwcg/291870/list/index.htm','已访问主页及论文栏目；可解析内容有限'),
'Lei Xu':('https://leixu-crypto.github.io/','已读取精选论文'),
'Weilong Peng':('https://terrypangooo.github.io/','已读取精选论文；更新范围有限'),
'Daizong Liu':('https://liudaizong.github.io/publications/','已读取精选论文'),
'Zheng Zhang':('https://cszhengzhang.cn/Pubdate/','已读取论文页'),
'Jingyong Su':('https://su-cps.github.io/','已读取精选论文'),
'Heyan Chai':('https://aisc.szu.edu.cn/info/1041/1377.htm','已读取学校个人介绍'),
'Yicong Zhou':('https://www.fst.um.edu.mo/personal/yicongzhou/publication/','直接访问失败；使用搜索索引与公开 CV 补查，不能保证最新完整覆盖'),
'Jiantao Zhou':('https://www.fst.um.edu.mo/personal/jtzhou/','直接访问超时；仅完成检索'),
'Yuanman Li':('https://yuanmanli.github.io/','动态页面未返回完整论文；补查搜索索引'),
'Qing Liao':('https://www.liaoqing.me/','个人站点无法读取；学校页动态内容不完整'),
'Chengqing Li':('https://www.chengqingli.com/','直接访问失败；仅完成检索'),
'Yuming Fang':('https://jxufeai.github.io/','实验室页面为动态内容；未完整读取')}
norm=lambda s: re.sub(r'[^a-z0-9]','',s.lower())
local=read('local-publications.json')
for f in findings:
 assert not any(norm(f['title'])==norm(x.get('title','')) for x in local),f['title']
 assert not any(f['doi'].lower() in str(x).lower() for x in local),f['doi']
(p/'confirmed-missing.json').write_text(json.dumps(findings,ensure_ascii=False,indent=2))
(p/'pending.json').write_text(json.dumps(pending,ensure_ascii=False,indent=2))
authors=read('normalized-authors.json'); joint={x['name']:x for x in read('search-results.json')}; searches={x['name']:x for x in read('homepage-searches.json')}
e=html.escape
rows=[]; audit=[]
for a in authors:
 name=a['name']; url,note=home.get(name,('', '已完成联合署名及个人主页检索；未唯一确认可完整核对的个人主页。不能据此认定没有遗漏。'))
 rec=dict(name=name,local_coauthored_count=a['count'],joint_search_record=name in joint,homepage_search_record=name in searches,homepage=url,note=note); audit.append(rec)
 rows.append('<tr><td>'+e(name)+'</td><td>'+str(a['count'])+'</td><td>'+('<a href="'+e(url)+'">主页/论文页</a>' if url else '未确认')+'</td><td>'+e(note)+'</td></tr>')
(p/'author-coverage.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2))
cards=''.join('<article><h3>'+str(i+1)+'. <a href="'+e(f['url'])+'">'+e(f['title'])+'</a></h3><p>'+e(f['venue'])+'</p><p>'+e(f['authors'])+'</p><small>DOI: '+e(f['doi'])+'；本站题名与 DOI 均无匹配。</small></article>' for i,f in enumerate(findings))
more=''.join('<article><h3><a href="'+e(f['url'])+'">'+e(f['title'])+'</a></h3><p>'+e(f['status'])+'</p></article>' for f in pending)
doc='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>合作作者论文遗漏核对</title><style>body{max-width:1120px;margin:40px auto;padding:0 24px;font:16px/1.7 system-ui;color:#203049;background:#f5f7fb}h1,h2{color:#102746}article{background:white;border:1px solid #dce4ee;padding:20px;margin:15px 0;border-radius:12px}h3{margin:0 0 10px;font-size:18px}a{color:#185eab}table{width:100%;border-collapse:collapse;background:white}td,th{padding:12px;border:1px solid #dce4ee;text-align:left}small{color:#617086}input{padding:12px;width:80%;margin:15px 0;font:inherit}</style><h1>合作作者论文遗漏核对</h1><p>核对日期：2026-10-03。比较基线：本站 src/data/publications.bib 的 170 条记录。</p><p><b>确认 7 篇正式发表论文缺失；另有 2 篇预印本和 1 篇录用状态待核实的候选。</b>本轮未修改论文数据，也未判断或更改通讯作者身份。</p><h2>覆盖范围与限制</h2><p>从已有论文提取作者，清理大小写、部分姓名变体和解析噪声，得到 193 个姓名检索条目；每个条目均进行联合署名检索与个人主页检索。姓名条目不等于已完全消歧的人数，中文/英文别名仍可能重复。本次不是 193 个完整主页的逐页成功读取。</p><p>对能确认身份和访问的个人站点、学校主页及实验室论文列表核对联合署名，再用出版商、会议官方记录或预印本平台复核候选。部分主页没有完整列表、停止更新、动态内容无法读取或无法访问；同名作者未强行合并。结论是已确认遗漏的下限，不能保证公开网页之外不存在其他遗漏。</p><h2>正式发表、本站缺失</h2>'''+cards+'<h2>单独保留：预印本与待核实投稿</h2>'+more+'''<h2>逐位检索记录</h2><p>表格列出明确确认的主页，以及尚未确认或访问受限的条目。原始检索证据保存在同目录 JSON 文件。</p><input id="q" placeholder="搜索姓名或状态" aria-label="搜索姓名或状态"><table><thead><tr><th>姓名</th><th>本站合作篇数</th><th>来源</th><th>核对范围</th></tr></thead><tbody>'''+''.join(rows)+'''</tbody></table><script>document.querySelector('#q').addEventListener('input',function(){const s=this.value.toLowerCase();document.querySelectorAll('tbody tr').forEach(r=>r.hidden=!r.textContent.toLowerCase().includes(s))})</script></html>'''
(p/'report.html').write_text(doc)
print(json.dumps({'baseline':len(local),'author_queries':len(authors),'joint_queries':len(joint),'homepage_queries':len(searches),'confirmed_missing':len(findings),'pending':len(pending),'mapped_homepages':sum(bool(x['homepage']) for x in audit)},ensure_ascii=False))
