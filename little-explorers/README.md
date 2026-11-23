# 🌙 小小探险家 · Little Explorers

面向 2–5 岁儿童的互动数字绘本。孩子打开网页 → 选故事 → 听旁白、看动画 → 点画面里的东西探索 → 做选择 → 故事继续。

第一本：《嘟嘟巴士的奇妙旅行》—— 分支互动冒险。早上醒来选**公交车 / 消防车**，岔路口选**森林 / 海边**，各走 3 个帮忙场景，公园汇合后选**野餐 / 跳舞**，最后都是同一个温暖的晚安结局。一次 5–8 分钟，同一条故事线重玩可以换车、换路、换活动。

分支设计规则（新增故事也遵守）：

- 每次只给 **2 个选项**，两张卡片的画面区别明显（黄公交 vs 红消防车、绿森林 vs 蓝海边），孩子看图就能选。
- 选择后立刻有反馈（音效 + 气泡 + 卡片放大），不会点了没反应。
- 分支只决定**中间经历什么**，最后一定收敛到同一个温暖结局，不存在“走错”。
- 选择写进 `vars`（`vehicle` / `route` / `ending`），后面的旁白、画面、结尾摘要都用它。

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
│   │   ├── story-engine.js              # 纯函数：旁白、门槛、分支解析
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

顶层结构：

```jsonc
{
  "id": "bus-adventure",
  "title": "嘟嘟巴士的奇妙旅行",
  "shortTitle": "嘟嘟巴士",
  "ageRange": [2, 5],
  "ageLabel": "2–5 岁",
  "duration": 7,
  "cover": { "art": "cover" },
  "vars": { "vehicle": null, "route": null, "ending": null },
  "scenes": [ /* 故事页与选择页混排 */ ],
  "ending": {
    "title": "故事结束啦！",
    "message": { "route": { "forest": "…", "beach": "…" }, "fallback": "…" },
    "recap": {
      "vehicle": { "bus": { "emoji": "🚌", "label": "开了公交车" }, "firetruck": { "emoji": "🚒", "label": "开了消防车" } },
      "route":   { "forest": { "emoji": "🌲", "label": "去了森林" }, "beach": { "emoji": "🌊", "label": "去了海边" } },
      "ending":  { "picnic": { "emoji": "🍎", "label": "一起野餐" }, "dance": { "emoji": "🎵", "label": "唱歌跳舞" } }
    },
    "friends": [ { "name": "小兔子", "emoji": "🐰" }, { "name": "小松鼠", "emoji": "🐿️", "when": { "route": "forest" } } ],
    "hint": "再玩一次，换一辆车、换一条路试试看吧。"
  }
}
```

**故事页（`type` 省略）** 和以前一样，重点是 `interactions`、`gate`、`next`：

```jsonc
{
  "id": "forest-2",
  "art": "forest-2",
  "title": "小兔子找不到家",
  "narration": ["嘟嘟开进森林，听见小小的哭声。", { "when": { "vehicle": "firetruck" }, "text": "消防车嘟嘟说：我云梯上有小灯，看得更清楚！" }],
  "interactions": [
    { "id": "rabbit", "label": "小兔子", "bubble": "呜呜，我找不到家了…", "sfx": "boing", "at": { "x": 60, "y": 62 } },
    { "id": "rabbit-home", "label": "小木屋", "bubble": "找到啦！这就是我的家！", "sfx": "chime", "flag": "rabbit_home", "at": { "x": 76, "y": 60 } }
  ],
  "gate": { "flag": "rabbit_home", "hint": "找一找，小兔子的家藏在树丛后面", "hintAfter": 9000, "releaseAfter": 45000 },
  "next": "forest-3"
}
```

**选择页（`type: "choice"`）** 不画点画面的交互，只放两张卡片：

```jsonc
{
  "id": "vehicle-choice",
  "type": "choice",
  "art": "wake-up",
  "title": "今天开什么车呢？",
  "prompt": "今天开哪一辆车出门呀？",
  "narration": ["嘟嘟的车库里有两位好朋友。"],
  "choices": [
    {
      "id": "bus",
      "label": "公交巴士",
      "hint": "接好朋友",
      "emoji": "🚌",
      "art": "bus",              // ChoiceArt 缩略图：bus / firetruck / forest / beach / picnic / dance
      "set": { "vehicle": "bus" },
      "speech": "我们开公交车，去接好朋友吧！",
      "sfx": "horn",
      "next": "fork"
    },
    {
      "id": "firetruck",
      "label": "消防车",
      "hint": "帮助好朋友",
      "emoji": "🚒",
      "art": "firetruck",
      "set": { "vehicle": "firetruck" },
      "speech": "我们开消防车，去帮助好朋友吧！",
      "sfx": "siren",
      "next": "fork"
    }
  ]
}
```

字段说明：

| 字段 | 说明 |
| --- | --- |
| `art` | 场景画面类型，对应 `SceneArt.vue` 里的分支：`cover` / `wake-up` / `fork` / `forest-1` / `forest-2` / `forest-3` / `beach-1` / `beach-2` / `beach-3` / `park` / `picnic` / `dance` / `goodnight` |
| `narration` | 字符串数组，逐句播放；也可以写 `{ "text": "...", "audio": "..." }` |
| `narration[].when` | 条件台词，例如 `{ "when": { "route": "forest" }, "text": "…" }`，只有变量匹配时才播 |
| `interactions[].at` | 气泡位置，画面百分比坐标（1000×620 基准） |
| `interactions[].flag` | 点击后置位的标记，供后续场景/门槛使用 |
| `gate.flag` | 可以是一个标记名，也可以是数组：`["shell_a","shell_b","shell_c"]` 表示三个都完成才放行 |
| `gate` | 例如 `{ "flag": "rabbit_home", "hint": "…", "hintAfter": 9000, "releaseAfter": 45000 }`：门槛没开时“继续”不可用，9 秒给提示，45 秒自动放行，不会卡死 |
| `next` | 字符串；或 `{ "default": "…", "cases": [{ "when": { "route": "beach" }, "target": "…" }] }` |
| `type: "choice"` | 选择页，渲染 `.choice-panel` 里的两张卡片，点卡片即选 |
| `choices[].set` | 选择结果写进 `vars`，后面的旁白 `when`、`next` 分支、结尾摘要都读它 |

分支解析逻辑在 `src/engine/story-engine.js`：

- `resolveNext(scene, vars, flags)` —— 依次尝试 `cases`，都不匹配就回退 `default`；字符串 `next` 直接返回。
- `narrationLines(scene, vars)` —— 过滤掉 `when` 不成立的旁白。
- `isGateOpen(scene, flags, released)` —— 数组形式的 `gate.flag` 会 `every()` 检查。
- `choiceOutcome(choice, vars)` —— 返回 `{ vars: {...vars, ...choice.set}, next: choice.next }`。

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
- **分支互动冒险**：15 个场景（12 个故事页 + 3 个选择页），4 条主路线都收敛到同一个晚安结局
- 选择写进 `vars` 并持久化，深链 / 继续旅行都能还原上一次的车、路、活动和已经帮过的朋友
- 点击探索、找一找门槛（小鸟、小兔子的家、松果、大海方向、三颗贝壳）
- 旁白逐句（支持按变量分支的台词）、BGM、音效、音量/语速/减少动画设置
- 手机 / 平板 / 桌面响应式；键盘可 Tab 聚焦 + Enter 触发，←/→ 翻页
- **手机横屏单独适配**（`orientation: landscape and max-height: 560px`）：舞台按可用高度撑满（不再被 `100dvh - 200px` 压成 304px）、上下控制压成一行、选择卡改成左图右字、书架在矮横屏收起装饰插画，首屏就能看到故事卡
- 旁白字幕、气泡、门槛提示都设了 `pointer-events: none`，不会挡住下面可点的物体；贝壳等小物件外面套了透明热区，手指点得中
- 结束页为全屏覆盖层，显示本次的车辆 / 路线 / 活动，移动端不会被舞台裁切

交互兜底：`PlayerView.vue` 里的 `PART_FALLBACK = { door: 'bus', wheel: 'bus', star: 'sun' }`。某个场景没有单独定义车门/车轮/星星的交互时，自动退回整车/太阳的交互，保证“点哪里都有回应”，不会出现点了没反应。

以后新增分支故事只需换 JSON：`type: "choice"` + `choices[].set/next` + 旁白 `when` + `next.cases`，引擎和组件都不用改。新角色画在 `FriendArt.vue`（`kind`），新场景画在 `SceneArt.vue`（`art`），选择卡缩略图画在 `ChoiceArt.vue`（`art`）。

后续可以加：小恐龙找妈妈、消防车忙碌的一天、真实录音、更多选择点（比如“雨天走哪条路”）、故事库分类。
