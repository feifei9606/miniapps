# MiniApps · 小工具合集

纯前端实现的在线小工具合集，无需构建、无需登录，数据全部在浏览器本地计算，通过 GitHub Pages 托管。

## 在线访问

部署到 GitHub Pages 后访问：`https://feifei9606.github.io/miniapps/`

## 工具清单

| 工具 | 说明 |
| --- | --- |
| [提前还款计算器](tools/prepayment-calculator/index.html) | 等额本息 / 等额本金，支持多笔提前还款、缩短期限或减少月供、LPR 浮动利率，图表对比还款计划变化 |

## 目录结构

```
miniapps/
├── index.html                            # 合集首页（工具导航）
├── shared/style.css                      # 全站共享样式
└── tools/
    └── prepayment-calculator/            # 提前还款计算器
        ├── index.html
        ├── style.css
        ├── calc.js                       # 核心计算（纯函数）
        ├── chart.js                      # Chart.js 图表渲染
        └── ui.js                         # 表单交互与结果渲染
```

## 技术说明

- 原生 HTML / CSS / JavaScript（ES Modules），无构建流程
- 图表使用 Chart.js（CDN 引入，加载失败时自动降级，不影响核心计算）
- 新增工具时：在 `tools/` 下新建目录，并在首页 `index.html` 的工具卡片网格中添加入口

## 部署（GitHub Pages）

1. 仓库设置 → Pages → Source 选择 `main` 分支 / 根目录
2. 保存后等待 1–2 分钟即可访问
