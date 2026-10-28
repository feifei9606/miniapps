/** 章节目录：13 章的入口，带状态与篇幅提示。 */

import { getProgress, STATUS_LABEL } from '../store.js';

export async function mount(el, ctx) {
  const { book, escapeHtml } = ctx;
  const progress = getProgress();
  const conceptCount = new Map();
  for (const concept of book.concepts) {
    conceptCount.set(concept.firstChapter, (conceptCount.get(concept.firstChapter) || 0) + 1);
  }

  el.innerHTML = `
    <header class="page-head">
      <p class="page-kicker">第一册 · 第 1–13 章</p>
      <h1 class="page-title">章节目录</h1>
      <p class="page-desc">每章都按“时代背景 → 核心问题 → 关键结论 → 小节脉络 → 概念与人物 → 自测”组织。建议先读导读，再回头读原书对应章节。</p>
    </header>

    <div class="chapter-grid">
      ${book.chapters
        .map((chapter) => {
          const status = STATUS_LABEL[progress[chapter.id]] ? progress[chapter.id] : 'unread';
          return `
          <a class="chapter-card chapter-card-${status}" href="#/chapter/${chapter.id}">
            <div class="chapter-card-head">
              <span class="seal-sm">${chapter.no}</span>
              <span class="chapter-card-era">${escapeHtml(chapter.era)}</span>
              <span class="status-pill status-pill-${status}">${STATUS_LABEL[status]}</span>
            </div>
            <h2 class="chapter-card-title">${escapeHtml(chapter.title)}</h2>
            <p class="chapter-card-blurb">${escapeHtml(chapter.blurb)}</p>
            <div class="chapter-card-meta">
              <span>约 ${chapter.minutes} 分钟</span>
              <span>${conceptCount.get(chapter.id) || 0} 个概念</span>
            </div>
          </a>`;
        })
        .join('')}
    </div>
  `;
}
