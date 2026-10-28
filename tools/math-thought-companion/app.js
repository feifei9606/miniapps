/**
 * 单页外壳：hash 路由、侧栏、导航高亮、滚动位置记忆。
 * 视图模块各自负责自己的 DOM 与事件，统一签名为 mount(el, ctx)。
 */

import { loadBook, loadConceptNotes, indexChapters, indexConcepts, indexFigures } from './data.js';
import { getProgress, countRead, STATUS_LABEL } from './store.js';
import * as homeView from './views/home.js';
import * as chaptersView from './views/chapters.js';
import * as chapterView from './views/chapter.js';
import * as conceptsView from './views/concepts.js';
import * as timelineView from './views/timeline.js';
import * as meView from './views/me.js';

const appEl = document.getElementById('app');
const sidebarEl = document.getElementById('sidebar');
const chapterListEl = document.getElementById('chapterList');
const sidebarProgressEl = document.getElementById('sidebarProgress');
const drawerBtn = document.getElementById('drawerBtn');
const drawerVeil = document.getElementById('drawerVeil');
const toastEl = document.getElementById('toast');

const ctx = {
  book: null,
  chapters: new Map(),
  concepts: new Map(),
  figures: new Map(),
  conceptNotes: new Map(),
  navigate,
  toast,
  reloadSidebar,
};

const scrollMemory = new Map();
let currentRoute = '';
let renderToken = 0;

const ROUTES = [
  { pattern: /^#\/home$/, view: homeView, nav: 'home', title: '总览' },
  { pattern: /^#\/chapters$/, view: chaptersView, nav: 'chapters', title: '章节' },
  { pattern: /^#\/chapter\/(ch\d{2})$/, view: chapterView, nav: 'chapters', title: '章节导读' },
  { pattern: /^#\/timeline$/, view: timelineView, nav: 'timeline', title: '时间轴' },
  { pattern: /^#\/concepts$/, view: conceptsView, nav: 'concepts', title: '概念索引' },
  { pattern: /^#\/concept\/([\w-]+)$/, view: conceptsView, nav: 'concepts', title: '概念卡片' },
  { pattern: /^#\/figures$/, view: conceptsView, nav: 'concepts', title: '人物索引' },
  { pattern: /^#\/me$/, view: meView, nav: 'me', title: '我的' },
];

function navigate(hash) {
  if (location.hash === hash) {
    render();
    return;
  }
  location.hash = hash;
}

function toast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('is-visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toastEl.classList.remove('is-visible'), 1800);
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function reloadSidebar() {
  if (!ctx.book) return;
  const progress = getProgress();
  const read = countRead(ctx.book.chapters.map((c) => c.id));
  sidebarProgressEl.textContent = `${read} / ${ctx.book.chapters.length}`;
  chapterListEl.innerHTML = ctx.book.chapters
    .map((chapter) => {
      const status = STATUS_LABEL[progress[chapter.id]] ? progress[chapter.id] : 'unread';
      return `
        <li class="chapter-list-item">
          <a href="#/chapter/${chapter.id}" data-chapter="${chapter.id}" class="chapter-list-link">
            <span class="chapter-list-no">${String(chapter.no).padStart(2, '0')}</span>
            <span class="chapter-list-title">${escapeHtml(chapter.title)}</span>
            <span class="status-dot status-${status}" title="${STATUS_LABEL[status]}"></span>
          </a>
        </li>`;
    })
    .join('');
}

function setActiveNav(nav) {
  document.querySelectorAll('[data-nav]').forEach((el) => {
    el.classList.toggle('is-active', el.dataset.nav === nav);
  });
  if (ctx.book) {
    const match = location.hash.match(/^#\/chapter\/(ch\d{2})$/);
    document.querySelectorAll('.chapter-list-link').forEach((link) => {
      link.classList.toggle('is-current', Boolean(match) && link.dataset.chapter === match[1]);
    });
  }
}

function resolveRoute() {
  const hash = location.hash || '#/home';
  for (const route of ROUTES) {
    const match = hash.match(route.pattern);
    if (match) return { route, params: match.slice(1) };
  }
  return { route: ROUTES[0], params: [] };
}

async function render() {
  const token = ++renderToken;
  const { route, params } = resolveRoute();
  if (currentRoute) scrollMemory.set(currentRoute, window.scrollY);

  appEl.classList.remove('view-enter');
  appEl.innerHTML = '';

  try {
    await route.view.mount(appEl, { ...ctx, params, escapeHtml });
  } catch (error) {
    console.error('[app] 视图渲染失败', error);
    appEl.innerHTML = `
      <section class="panel error-panel">
        <h2>这页暂时打不开</h2>
        <p>${error && error.message ? escapeHtml(error.message) : '数据加载失败。'}</p>
        <button class="btn btn-primary" type="button" id="retryBtn">重试</button>
      </section>`;
    const retry = document.getElementById('retryBtn');
    if (retry) retry.addEventListener('click', () => render());
  }

  if (token !== renderToken) return;

  currentRoute = location.hash || '#/home';
  document.title = `${route.title} · 古今数学思想 伴读`;
  // 先重建侧栏再标记高亮：reloadSidebar 会重写列表 DOM，顺序反了会丢掉 is-current
  reloadSidebar();
  setActiveNav(route.nav);

  window.scrollTo(0, scrollMemory.get(currentRoute) || 0);
  requestAnimationFrame(() => appEl.classList.add('view-enter'));
}

function closeDrawer() {
  document.body.classList.remove('drawer-open');
  drawerBtn.setAttribute('aria-expanded', 'false');
  drawerVeil.hidden = true;
}

function setupDrawer() {
  drawerBtn.addEventListener('click', () => {
    const open = document.body.classList.toggle('drawer-open');
    drawerBtn.setAttribute('aria-expanded', String(open));
    drawerVeil.hidden = !open;
  });
  drawerVeil.addEventListener('click', closeDrawer);
  sidebarEl.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeDrawer();
  });
}

async function boot() {
  setupDrawer();
  try {
    ctx.book = await loadBook();
    ctx.chapters = indexChapters(ctx.book);
    ctx.concepts = indexConcepts(ctx.book);
    ctx.figures = indexFigures(ctx.book);
    // 注释层缺失不应阻塞主流程：降级为空 Map，视图自行隐藏相关区块
    try {
      const notes = await loadConceptNotes();
      ctx.conceptNotes = new Map(Object.entries(notes.notes || {}));
    } catch (error) {
      console.warn('[app] concept-notes.json 加载失败，翻译注与回溯将不可用', error);
    }
  } catch (error) {
    console.error('[app] book.json 加载失败', error);
    appEl.innerHTML = `
      <section class="panel error-panel">
        <h2>书页没能打开</h2>
        <p>数据文件加载失败，请检查网络后重试。若在本地打开，请用 HTTP 服务器而非 file:// 访问。</p>
        <button class="btn btn-primary" type="button" id="bootRetry">重试</button>
      </section>`;
    const retry = document.getElementById('bootRetry');
    if (retry) retry.addEventListener('click', () => boot());
    return;
  }

  if (!location.hash) {
    history.replaceState(null, '', '#/home');
  }
  window.addEventListener('hashchange', render);
  window.addEventListener('gjsx:change', reloadSidebar);
  await render();
}

boot();
