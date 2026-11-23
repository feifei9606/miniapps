# 🌙 小小探险家 · Little Explorers

面向 2–5 岁儿童的互动数字绘本。孩子打开网页 → 选故事 → 听旁白、看动画 → 点画面里的东西探索 → 翻到下一页。

第一本：《小巴士嘟嘟去接朋友》—— 8 个场景，黄色小巴士嘟嘟依次接上小兔子、小熊、小鸭子，经过红绿灯、下雨和彩虹，最后到公园野餐。

- 纯前端、无后端、无账号、无广告
- 故事内容与程序分离：新增故事 = 新增 JSON + 复用角色组件
- 低文字依赖：旁白优先，画面里的东西都可以点
- 没有失败机制：点错也有温和反馈；找小熊有提示和自动放行

## 快速开始

```bash
cd little-explorers
npm install
npm run dev          # 本地开发
npm run build        # 产物在 dist/
npm run preview -- --port 4173 --strictPort
```

打开 `http://localhost:5173/`（dev）或 `http://localhost:4173/`（preview）。

## 目录结构

```
little-explorers/
├── src/
│   ├── data/
│   │   ├── stories/bus-adventure.json   # 故事内容（元数据 + 场景 + 交互）
│   │   ├── stories.js                   # 故事注册表
│   │   └── categories.js                # 年龄筛选、分类、即将上线
│   ├── engine/
│   │   ├── story-engine.js              # 纯函数：旁白、门槛、翻页
│   │   ├── progress.js                  # localStorage 进度与设置
│   │   ├── audio.js                     # 旁白 / 语音合成 / 音频解锁
│   │   ├── music.js                     # 程序化 BGM（Web Audio）
│   │   └── sfx.js                       # 程序化音效
│   ├── components/
│   │   ├── art/                         # 原创内联 SVG 角色与场景
│   │   ├── StoryCard.vue
│   │   ├── EndingCard.vue
│   │   ├── ParentSettings.vue
│   │   └── DevSheet.vue
│   └── views/
│       ├── LibraryView.vue              # 书架
│       └── PlayerView.vue               # 播放器
└── docs/
```

## 故事 JSON

故事是数据，不是代码。播放器只解释有限的字段，**不会执行 JSON 里的任意 JS**。

```jsonc
{
  "id": "bus-adventure",
  "title": "小巴士嘟嘟去接朋友",
  "shortTitle": "小巴士嘟嘟",
  "ageRange": [2, 4],
  "ageLabel": "2–4 岁",
  "cover": { "art": "cover" },
  "scenes": [
    {
      "id": "scene-01",
      "art": "morning",
      "title": "早上好，嘟嘟",
      "narration": ["早上好！太阳公公出来啦。", "小巴士嘟嘟，醒来啦。"],
      "interactions": [
        {
          "id": "sun",
          "label": "太阳公公",
          "bubble": "太阳公公笑啦！",
          "speech": "太阳公公笑啦！",
          "sfx": "chime",
          "at": { "x": 17, "y": 18 }
        }
      ],
      "next": "scene-02"
    }
  ]
}
```

字段说明：

| 字段 | 说明 |
| --- | --- |
| `art` | 场景画面类型，对应 `SceneArt.vue` 里的分支：`cover` / `morning` / `rabbit-stop` / `bear-hide` / `traffic-light` / `rainy-duck` / `rainbow` / `park` / `goodnight` |
| `narration` | 字符串数组，逐句播放；也可以写 `{ "text": "...", "audio": "..." }` |
| `interactions[].at` | 气泡位置，画面百分比坐标（1000×620 基准） |
| `interactions[].flag` | 点击后置位的标记，供后续场景/门槛使用 |
| `gate` | 例如 `{ "flag": "bear_found", "hint": "...", "hintAfter": 14, "releaseAfter": 45 }`：未找到小熊时“继续”不可用，14 秒给提示，45 秒自动放行，不会卡死 |
| `next` | 字符串，或 `{ "default": "...", "conditions": [{ "condition": "flag", "target": "..." }] }` |

## 新增一个故事

1. 在 `src/data/stories/` 新建 `my-story.json`，按上面的结构写场景。
2. 在 `src/data/stories.js` 里 import 并加入 `stories` 数组。
3. 复用 `src/components/art/` 里的角色；需要新场景时在 `SceneArt.vue` 增加一个 `v-else-if="art === '...'"` 分支。
4. 在 `categories.js` 的 `COMING_SOON` 里移除对应占位（如果已登记）。
5. `npm run build`，用 `?story=my-story&scene=0&narration=0` 逐页检查。

美术原则：角色一致性优先。嘟嘟固定为黄色车身、蓝色车窗、圆眼睛、红色顶灯；新故事只换场景和动作，不重新设计主角。

## 音频

第一版没有录音文件，全部是程序化音频：

- **旁白**：优先 `speechSynthesis`（zh-CN），没有可用语音时按字数节奏推进字幕。
- **BGM**：`music.js` 用 Web Audio 合成 84 BPM 的 C 大调五声音阶循环。
- **音效**：`sfx.js` 合成 chime / pop / horn / boing / quack / raindrop 等。

手机/平板浏览器要求先有一次用户手势才能出声：首页的“开始故事”或任意点击会调用 `audio.unlock()`。旁白播放时 BGM 自动 duck（降到 30%）。

后续要换真实录音时，在场景旁白里写 `audio` 字段即可，`audio.narrate()` 会优先播放文件，失败再退回语音合成。

## 开发预览与视觉验证

`?view=sheet` 打开角色/场景总览（`DevSheet.vue`），`?story=bus-adventure&scene=N&narration=0` 直接进入第 N 页并跳过自动旁白，适合逐页截图。

### 本机 Chromium 依赖（重要，不要重复排查）

本机的 Playwright Chromium 在：

```
/home/hudahui/.cache/ms-playwright/chromium-1134/chrome-linux/chrome
```

它需要把已解包的 Ubuntu 依赖库加入 `LD_LIBRARY_PATH`（其中包含 `libgbm.so.1` 等）：

```
LD_LIBRARY_PATH=/home/hudahui/local/deps/usr/lib/x86_64-linux-gnu
```

`libgbm.so.1` 的另一份在 `/bi/7.hudahui/soft/lib/libgbm.so.1`，但截图时用上面的 `local/deps` 目录即可。

中文与 emoji 字体已放在 `/home/hudahui/.local/share/fonts`（思源黑体 SourceHanSansSC + NotoColorEmoji）。如果截图里中文是方框，执行：

```bash
fc-cache -f
fc-list :lang=zh | head
```

### 截图命令

```bash
LD_LIBRARY_PATH=/home/hudahui/local/deps/usr/lib/x86_64-linux-gnu \
~/.cache/ms-playwright/chromium-1134/chrome-linux/chrome \
  --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=1440,980 --virtual-time-budget=3000 \
  --screenshot=/tmp/lx/scene-01.png \
  'http://localhost:4173/?story=bus-adventure&scene=0&narration=0'
```

移动端把 `--window-size` 换成 `390,844`。

### 交互回归（Playwright）

在 `/tmp/lxqa` 安装 `playwright-core` 后，用系统 Chromium：

```js
const { chromium } = require('playwright-core')
const browser = await chromium.launch({
  executablePath: '/home/hudahui/.cache/ms-playwright/chromium-1134/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-gpu'],
})
```

注意：气泡有 `<transition>`，读文案时取最后一个 `.speech-bubble`，或等 400ms 以上；继续按钮有脉冲动画，自动化点击用 `{ force: true }`。

## 部署

GitHub Pages 由根目录的 `.github/workflows/deploy.yml` 负责：

1. `npm ci && npm run build`（在 `little-explorers/`）
2. 把根 `index.html`、`shared/`、`tools/` 和 `little-explorers/dist/` 一起 stage 到 `_site/`
3. 上传 `_site/` 并部署

线上地址：`https://feifei9606.github.io/miniapps/little-explorers/`

`vite.config.js` 使用 `base: './'`，因此放在任意子路径下都能正确加载资源。

## 已实现 / 后续

已实现：

- 书架、年龄筛选、继续阅读、家长设置、localStorage 进度
- 8 页完整故事、点击探索、找小熊门槛、红黄绿灯、彩虹三色、结尾卡
- 旁白逐句、BGM、音效、音量/语速/减少动画设置
- 手机 / 平板 / 桌面响应式；键盘可 Tab 聚焦 + Enter 触发，←/→ 翻页
- 结束页为全屏覆盖层，移动端不会被 278px 高的舞台裁切

交互兜底：`PlayerView.vue` 里的 `PART_FALLBACK = { door: 'bus', wheel: 'bus', star: 'sun' }`。某个场景没有单独定义车门/车轮/星星的交互时，自动退回整车/太阳的交互，保证“点哪里都有回应”，不会出现点了没反应。

后续可以加：小恐龙找妈妈、消防车忙碌的一天、真实录音、更多场景组件、故事分支。
