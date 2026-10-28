/** 总览：阅读进度、继续阅读、三册脉络、时间轴预览。 */

import { getProgress, countRead, getQuizDone, lastReadingId, STATUS_LABEL } from '../store.js';

function progressRing(percent) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const dash = (circumference * percent) / 100;
  return `
    <svg class="ring" viewBox="0 0 110 110" role="img" aria-label="已读进度 ${percent}%">
      <circle class="ring-track" cx="55" cy="55" r="${radius}"></circle>
      <circle class="ring-value" cx="55" cy="55" r="${radius}"
        stroke-dasharray="${dash.toFixed(1)} ${(circumference - dash).toFixed(1)}"></circle>
      <text class="ring-label" x="55" y="52">${percent}%</text>
      <text class="ring-sub" x="55" y="70">已读</text>
    </svg>`;
}

export async function mount(el, ctx) {
  const { book, escapeHtml } = ctx;
  const ids = book.chapters.map((c) => c.id);
  const progress = getProgress();
  const quizDone = getQuizDone();
  const readCount = countRead(ids);
  const percent = Math.round((readCount / ids.length) * 100);
  const nextId = lastReadingId(ids);
  const nextChapter = ctx.chapters.get(nextId);
  const quizCount = ids.filter((id) => quizDone[id]).length;
  const preview = book.timeline.slice(0, 6);

  el.innerHTML = `
    <section class="hero">
      <div class="hero-ornament" aria-hidden="true"><span></span>❖<span></span></div>
      <p class="hero-kicker">${escapeHtml(book.meta.author)}</p>
      <h1 class="hero-title">${escapeHtml(book.meta.title)}</h1>
      <p class="hero-sub">${escapeHtml(book.meta.scope)}</p>
      <p class="hero-intro">${escapeHtml(book.meta.intro)}</p>
      <p class="hero-period">${escapeHtml(book.meta.period)}</p>
    </section>

    <section class="panel progress-panel">
      <div class="progress-figure">${progressRing(percent)}</div>
      <div class="progress-body">
        <h2 class="panel-title">读到哪儿了</h2>
        <p class="progress-line">
          已读 <strong>${readCount}</strong> 章 · 在读 <strong>${ids.filter((id) => progress[id] === 'reading').length}</strong> 章
          · 自测完成 <strong>${quizCount}</strong> 章
        </p>
        <p class="progress-hint">
          ${readCount === 0
            ? '第一次来？建议从第 1 章开始，先看导读再读原书，读完回来做自测。'
            : readCount === ids.length
              ? '第一册已经读完。可以把笔记与作答导出留存，或重读几个关键章节。'
              : `下一站：第 ${nextChapter.no} 章　${escapeHtml(nextChapter.title)}`}
        </p>
        <div class="progress-actions">
          <a class="btn btn-primary" href="#/chapter/${nextId}">
            ${readCount === 0 ? '开始读第 1 章' : `继续读第 ${nextChapter.no} 章`}
          </a>
          <a class="btn btn-ghost" href="#/timeline">看全书时间轴</a>
        </div>
      </div>
    </section>

    <section class="section-block">
      <div class="section-head">
        <h2 class="section-title">三册脉络</h2>
        <p class="section-note">三册均已上线：13 / 13 / 25 章，共 51 章。</p>
      </div>
      <div class="volume-grid">
        ${book.volumes
          .map((volume) => {
            if (volume.status === 'published') {
              return `
                <article class="volume-card is-published">
                  <header>
                    <h3>${escapeHtml(volume.label)}</h3>
                    <span class="volume-tag">已上线</span>
                  </header>
                  <p class="volume-range">${escapeHtml(volume.range)}　${escapeHtml(volume.period)}</p>
                  <p class="volume-summary">${escapeHtml(volume.summary)}</p>
                  <div class="chapter-chips">
                    ${book.chapters
                      .filter((chapter) => volume.chapters.includes(chapter.id))
                      .map((chapter) => {
                        const status = STATUS_LABEL[progress[chapter.id]] ? progress[chapter.id] : 'unread';
                        return `<a class="chip chip-${status}" href="#/chapter/${chapter.id}" title="${escapeHtml(chapter.title)}">
                          ${String(chapter.no).padStart(2, '0')}
                        </a>`;
                      })
                      .join('')}
                  </div>
                </article>`;
            }
            return `
              <article class="volume-card is-planned">
                <header>
                  <h3>${escapeHtml(volume.label)}</h3>
                  <span class="volume-tag volume-tag-muted">待更新</span>
                </header>
                <p class="volume-range">${escapeHtml(volume.range)}　${escapeHtml(volume.period)}</p>
                <p class="volume-summary">${escapeHtml(volume.summary)}</p>
                <p class="volume-planned-note">内容整理中</p>
              </article>`;
          })
          .join('')}
      </div>
    </section>

    <section class="section-block">
      <div class="section-head">
        <h2 class="section-title">时间轴速览</h2>
        <a class="section-more" href="#/timeline">完整时间轴 →</a>
      </div>
      <ol class="timeline timeline-compact">
        ${preview
          .map(
            (item) => `
            <li class="timeline-item">
              <span class="timeline-node" aria-hidden="true"></span>
              <a class="timeline-card" href="#/chapter/${item.chapter}">
                <span class="timeline-year">${escapeHtml(item.label)}</span>
                <span class="timeline-text">${escapeHtml(item.text)}</span>
              </a>
            </li>`
          )
          .join('')}
      </ol>
    </section>

    <section class="quick-grid">
      <a class="quick-card" href="#/concepts">
        <span class="quick-label">概念卡片</span>
        <strong>${book.concepts.length}</strong>
        <span class="quick-note">个概念与定理，按首次出现章分组</span>
      </a>
      <a class="quick-card" href="#/figures">
        <span class="quick-label">人物索引</span>
        <strong>${book.figures.length}</strong>
        <span class="quick-note">位数学家的生卒、坐标与代表工作</span>
      </a>
      <a class="quick-card" href="#/me">
        <span class="quick-label">我的记录</span>
        <strong>${readCount}<i>/${ids.length}</i></strong>
        <span class="quick-note">进度、书签、笔记与导出</span>
      </a>
    </section>

    <p class="legal-note">${escapeHtml(book.meta.notice)}</p>
  `;
}
