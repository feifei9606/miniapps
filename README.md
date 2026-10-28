# MiniApps · 小工具合集

纯前端实现的在线小工具合集，无需构建、无需登录，数据全部在浏览器本地计算，通过 GitHub Pages 托管。

## 在线访问

部署到 GitHub Pages 后访问：`https://feifei9606.github.io/miniapps/`

## 工具清单

| 工具 | 说明 |
| --- | --- |
| [提前还款计算器](tools/prepayment-calculator/index.html) | 等额本息 / 等额本金，支持多笔提前还款、缩短期限或减少月供、LPR 浮动利率，图表对比还款计划变化 |
| [古今数学思想 · 伴读](tools/math-thought-companion/index.html) | 克莱因《古今数学思想》全三册（51 章）伴读手册：读前门槛诊断、历史语境卡、现代翻译注、卡点回溯，配合章节导读、159 个概念卡片跨章追踪、读后自测与本地笔记（可导出 Markdown） |

## 目录结构

```
miniapps/
├── index.html                            # 合集首页（工具导航）
├── shared/style.css                      # 全站共享样式
├── scripts/
│   ├── extract_gjsx.py                   # 内容生产：azw3/epub → 每章素材（输出到 /tmp，不入库）
│   └── check_content.py                  # 内容校验：schema、引用完整性、小节与 toc 对齐
└── tools/
    ├── prepayment-calculator/            # 提前还款计算器
    │   ├── index.html
    │   ├── style.css
    │   ├── calc.js                       # 核心计算（纯函数）
    │   ├── chart.js                      # Chart.js 图表渲染
    │   └── ui.js                         # 表单交互与结果渲染
    └── math-thought-companion/           # 古今数学思想伴读
        ├── index.html                    # 单页外壳
        ├── style.css                     # 古典书卷风设计系统
        ├── app.js                        # hash 路由、侧栏、滚动记忆
        ├── data.js                       # JSON 加载、缓存、并发去重、失败重试
        ├── store.js                      # localStorage 持久化与 Markdown 导出
        ├── views/                        # home / chapters / chapter / concepts / timeline / me
        └── data/
            ├── book.json                 # 三册索引、时间轴、人物、概念卡片
            └── chapters/ch01–ch13.json   # 各章导读、小节脉络、引文、自测
```

## 技术说明

- 原生 HTML / CSS / JavaScript（ES Modules），无构建流程
- 图表使用 Chart.js（CDN 引入，加载失败时自动降级，不影响核心计算）
- 新增工具时：在 `tools/` 下新建目录，并在首页 `index.html` 的工具卡片网格中添加入口
- 伴读应用不引任何外部字体或 CDN：纸纹与装饰全部由 CSS 渐变实现，衬线标题走系统字体栈

## 伴读的四个动作

| 动作 | 解决的问题 | 数据落点 |
| --- | --- | --- |
| 准入门槛诊断 | 这一章我现在读得动吗 | `chapter.entryCheck`：3–5 题单选，每个错误项映射 `gap`（缺哪个概念），结果分 ready / patch / lite 三条路径 |
| 历史语境卡 | 当时的人为什么这样写 | `chapter.contextCard`：当时的工具清单、当时还没有的东西、由此导致什么、容易误读成什么 |
| 现代翻译注 | 相当于什么，以及不等于什么 | `concept-notes.json` 的 `modernNote`：≈ / ≠ / 承担的功能 |
| 演化图谱与卡点回溯 | 这一句读不懂，缺的是哪一层 | `concept-notes.json` 的 `trouble`（回溯目标）与 `edges`（problem / response / inherit 三类边） |

四动作已覆盖全部 51 章：157 道诊断题、51 张语境卡、159 条现代翻译注、86 处小节级卡点与 195 条演化边（其中 13 条标为“制造困难”）。

## 伴读内容维护

内容与代码分离：`data/book.json`（册目录、时间轴、人物、概念卡片）+ `data/chapters/chNN.json`（每章导读、小节脉络、引文、自测、诊断题、语境卡）+ `data/concept-notes.json`（翻译注、卡点回溯、演化边性质），改动数据无需碰 JS。

```bash
# 1) 从原书抽取素材（只写 /tmp，不入库；ref/ 已被 .gitignore 排除）
python3 -m venv /tmp/kf8venv
/tmp/kf8venv/bin/pip install -i https://pypi.tuna.tsinghua.edu.cn/simple mobi
/tmp/kf8venv/bin/python scripts/extract_gjsx.py --input ref/<book>.azw3 --out /tmp/gjsx_extract

# 2) 改完 JSON 后校验 schema、章号连续性、概念/人物引用、小节与 toc 对齐
python3 scripts/check_content.py
```

三册已全部收录（第 1–13 章、14–26 章、27–51 章）。新增册时只需在 `book.json` 的 `volumes` 里登记章号并补 `chapters/chNN.json`，视图与路由无需改动。

## 部署（GitHub Pages）

采用 GitHub Actions 自动部署（`.github/workflows/deploy.yml`）：

1. 仓库 Settings → Pages → Source 选择 **GitHub Actions**
2. 推送到 `main` 分支即自动部署（也可在 Actions 页手动 Run workflow）
3. 部署成功后访问 `https://feifei9606.github.io/miniapps/`
