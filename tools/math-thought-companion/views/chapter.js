/** 章节导读：背景、核心问题、关键结论、小节脉络、人物、概念、引文、自测、笔记。 */

import { loadChapter } from '../data.js';
import { renderEntry, bindEntry } from './entry-check.js';
import { openTrouble } from './trouble.js';
import {
  STATUS_LABEL,
  getStatus,
  setStatus,
  getNote,
  setNote,
  getAnswers,
  setAnswer,
  isQuizDone,
  markQuizDone,
  hasBookmark,
  toggleBookmark,
} from '../store.js';

const STATUS_BUTTONS = [
  { key: 'unread', label: '未读' },
  { key: 'reading', label: '在读' },
  { key: 'read', label: '已读' },
];

function statusButtons(current) {
  return STATUS_BUTTONS.map(
    (item) =>
      `<button type="button" class="seg-btn${item.key === current ? ' is-active' : ''}" data-status="${item.key}">${item.label}</button>`
  ).join('');
}

function bookmarkButton(id, label, active) {
  return `<button type="button" class="bookmark-btn${active ? ' is-on' : ''}"
    data-bookmark="${escapeAttr(label)}" aria-pressed="${active}" title="${active ? '取消书签' : '加书签'}">
    <span aria-hidden="true">${active ? '★' : '☆'}</span></button>`;
}

function escapeAttr(text) {
  return String(text ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export async function mount(el, ctx) {
  const { escapeHtml } = ctx;
  const id = ctx.params[0];
  const meta = ctx.chapters.get(id);
  if (!meta) {
    el.innerHTML = `<section class="panel error-panel"><h2>找不到这一章</h2><p>章节编号 ${escapeHtml(id)} 不在第一册范围内。</p>
      <a class="btn btn-primary" href="#/chapters">回到章节目录</a></section>`;
    return;
  }

  el.innerHTML = `<div class="chapter-loading"><span class="spinner" aria-hidden="true"></span>正在取出第 ${meta.no} 章的笔记…</div>`;

  let chapter;
  try {
    chapter = await loadChapter(id);
  } catch (error) {
    el.innerHTML = `<section class="panel error-panel">
      <h2>第 ${meta.no} 章正在整理</h2>
      <p>本章数据暂时无法加载（${escapeHtml(error.message || '未知错误')}）。其余章节不受影响。</p>
      <button class="btn btn-primary" type="button" id="chapterRetry">重试</button>
      <a class="btn btn-ghost" href="#/chapters">回到目录</a>
    </section>`;
    const retry = document.getElementById('chapterRetry');
    if (retry) retry.addEventListener('click', () => mount(el, ctx));
    return;
  }

  const status = getStatus(id);
  const answers = getAnswers(id);
  const quizDone = isQuizDone(id);
  const prevMeta = chapter.links.prev ? ctx.chapters.get(chapter.links.prev) : null;
  const nextMeta = chapter.links.next ? ctx.chapters.get(chapter.links.next) : null;
  const bookmarked = (label) => hasBookmark(id, label);

  el.innerHTML = `
    <article class="chapter">
      <header class="chapter-head">
        <div class="seal" aria-hidden="true">${chapter.no}</div>
        <div class="chapter-head-text">
          <p class="chapter-era">${escapeHtml(chapter.era)}　·　第 ${chapter.no} 章</p>
          <h1 class="chapter-title">${escapeHtml(chapter.title)}</h1>
          <p class="chapter-lead">${escapeHtml(chapter.lead)}</p>
        </div>
      </header>

      <div class="chapter-toolbar">
        <div class="segmented" id="statusSegment" role="group" aria-label="阅读状态">
          ${statusButtons(status)}
        </div>
        <div class="toolbar-right">
          ${bookmarkButton(id, '章首', bookmarked('章首'))}
          <span class="toolbar-hint">${STATUS_LABEL[status]}</span>
        </div>
      </div>

      ${renderEntry(chapter.entryCheck, { ...ctx, chapterId: id })}

      ${chapter.contextCard
        ? `<section class="context-card" id="contextCard">
        <header class="cc-head">
          <span class="cc-badge">${chapter.contextCard.minutes} 分钟语境</span>
          <h2 class="cc-title">${escapeHtml(chapter.contextCard.title)}</h2>
        </header>
        <div class="cc-tools">
          ${chapter.contextCard.tools
            .map(
              (tool) => `
            <div class="cc-tool">
              <span class="cc-tool-name">${escapeHtml(tool.name)}</span>
              <p>${escapeHtml(tool.note)}</p>
            </div>`
            )
            .join('')}
        </div>
        <div class="cc-limits">
          <span class="cc-limits-label">当时的限制</span>
          ${chapter.contextCard.limits.map((item) => `<span class="cc-limit">${escapeHtml(item)}</span>`).join('')}
        </div>
        <p class="cc-consequence">${escapeHtml(chapter.contextCard.consequence)}</p>
        <p class="cc-misread"><span>容易误读</span>${escapeHtml(chapter.contextCard.misread)}</p>
      </section>`
        : ''}

      <section class="chapter-section">
        <h2 class="section-h">时代背景</h2>
        ${chapter.background.map((paragraph) => `<p class="prose">${escapeHtml(paragraph)}</p>`).join('')}
      </section>

      <section class="chapter-section">
        <h2 class="section-h">核心问题</h2>
        <ol class="question-list">
          ${chapter.coreQuestions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
        </ol>
      </section>

      <section class="chapter-section">
        <h2 class="section-h">关键结论</h2>
        <ul class="conclusion-list">
          ${chapter.conclusions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
        </ul>
      </section>

      <section class="chapter-section">
        <h2 class="section-h">小节脉络 <span class="section-h-note">对应原书小节</span></h2>
        <div class="section-map">
          ${chapter.sections
            .map((section) => {
              const on = bookmarked(section.label);
              const trouble = section.trouble;
              return `
              <div class="section-card">
                <div class="section-card-top">
                  <h3>${escapeHtml(section.label)}</h3>
                  <div class="section-card-tools">
                    ${trouble ? `<button type="button" class="trouble-btn" data-trouble="${escapeAttr(section.label)}">读不懂</button>` : ''}
                    ${bookmarkButton(id, section.label, on)}
                  </div>
                </div>
                <p>${escapeHtml(section.gist)}</p>
                ${trouble ? `<p class="section-trouble-hint">常见卡点：${escapeHtml(trouble.symptom)}</p>` : ''}
              </div>`;
            })
            .join('')}
        </div>
      </section>

      ${chapter.figures.length
        ? `<section class="chapter-section">
        <h2 class="section-h">关键人物</h2>
        <div class="figure-list">
          ${chapter.figures
            .map((fid) => {
              const figure = ctx.figures.get(fid);
              if (!figure) return '';
              return `
              <div class="figure-card">
                <div class="figure-avatar" aria-hidden="true">${escapeHtml(figure.name.slice(0, 1))}</div>
                <div>
                  <p class="figure-name">${escapeHtml(figure.name)}<span class="figure-en">${escapeHtml(figure.en)}</span></p>
                  <p class="figure-life">${escapeHtml(figure.life)}</p>
                  <p class="figure-note">${escapeHtml(figure.note)}</p>
                </div>
              </div>`;
            })
            .join('')}
        </div>
      </section>`
        : ''}

      ${chapter.concepts.length
        ? `<section class="chapter-section">
        <h2 class="section-h">关联概念</h2>
        <div class="concept-pills">
          ${chapter.concepts
            .map((cid) => {
              const concept = ctx.concepts.get(cid);
              if (!concept) return '';
              return `<a class="concept-pill" href="#/concept/${concept.id}">${escapeHtml(concept.name)}<span>${escapeHtml(concept.en)}</span></a>`;
            })
            .join('')}
        </div>
      </section>`
        : ''}

      <section class="chapter-section bridge-section">
        <h2 class="section-h">承上启下</h2>
        <p class="prose">${escapeHtml(chapter.links.bridge)}</p>
      </section>

      ${chapter.quotes.length
        ? `<section class="chapter-section">
        <h2 class="section-h">原文摘引</h2>
        ${chapter.quotes
          .map(
            (quote) => `
          <blockquote class="quote">
            <p>${escapeHtml(quote.text)}</p>
            <cite>—— ${escapeHtml(quote.source)}</cite>
          </blockquote>`
          )
          .join('')}
      </section>`
        : ''}

      <section class="chapter-section">
        <div class="section-head-inline">
          <h2 class="section-h">自测</h2>
          <button class="quiz-done-btn${quizDone ? ' is-on' : ''}" type="button" id="quizDoneBtn">
            ${quizDone ? '已完成 ✓' : '标记完成'}
          </button>
        </div>
        <p class="section-note">先写下自己的思路，再展开参考答案对照。作答会记在本机。</p>
        <div class="quiz-list">
          ${chapter.quiz
            .map(
              (item, index) => `
            <div class="quiz-item">
              <p class="quiz-q"><span class="quiz-no">${index + 1}</span>${escapeHtml(item.q)}</p>
              <p class="quiz-hint">提示：${escapeHtml(item.hint)}</p>
              <textarea class="quiz-input" data-index="${index}" rows="2"
                placeholder="先写下自己的想法（可选）…">${escapeHtml(answers[index] || '')}</textarea>
              <button class="answer-toggle" type="button" data-toggle="${index}" aria-expanded="false">查看参考答案</button>
              <div class="quiz-answer" id="answer-${index}">
                <div><p>${escapeHtml(item.answer)}</p></div>
              </div>
            </div>`
            )
            .join('')}
        </div>
      </section>

      <section class="chapter-section note-section">
        <h2 class="section-h">我的笔记</h2>
        <textarea id="chapterNote" class="note-input" rows="5"
          placeholder="记下你的疑问、联想到的其他章节、或在原书里读到的补充…">${escapeHtml(getNote(id))}</textarea>
        <p class="note-status" id="noteStatus">自动保存在本机浏览器</p>
      </section>

      <nav class="chapter-nav" aria-label="章节切换">
        ${prevMeta
          ? `<a class="nav-card nav-prev" href="#/chapter/${prevMeta.id}">
              <span class="nav-dir">← 上一章</span>
              <span class="nav-title">第 ${prevMeta.no} 章　${escapeHtml(prevMeta.title)}</span>
            </a>`
          : `<span class="nav-card nav-empty">已是第一册开篇</span>`}
        ${nextMeta
          ? `<a class="nav-card nav-next" href="#/chapter/${nextMeta.id}">
              <span class="nav-dir">下一章 →</span>
              <span class="nav-title">第 ${nextMeta.no} 章　${escapeHtml(nextMeta.title)}</span>
            </a>`
          : `<a class="nav-card nav-next" href="#/me">
              <span class="nav-dir">第一册读完 →</span>
              <span class="nav-title">整理笔记与导出</span>
            </a>`}
      </nav>
    </article>
  `;

  bindEvents(el, ctx, chapter, meta);
}

function bindEvents(el, ctx, chapter, meta) {
  const id = chapter.id;

  bindEntry(el, chapter.entryCheck, id, ctx);

  // 阅读状态
  const segment = el.querySelector('#statusSegment');
  segment.addEventListener('click', (event) => {
    const button = event.target.closest('[data-status]');
    if (!button) return;
    const next = button.dataset.status;
    setStatus(id, next);
    segment.querySelectorAll('.seg-btn').forEach((item) => {
      item.classList.toggle('is-active', item.dataset.status === next);
    });
    const hint = el.querySelector('.toolbar-hint');
    if (hint) hint.textContent = STATUS_LABEL[next];
    ctx.toast(`已标记为「${STATUS_LABEL[next]}」`);
  });

  // 书签（含章首与各小节）
  el.querySelectorAll('[data-bookmark]').forEach((button) => {
    button.addEventListener('click', () => {
      const label = button.dataset.bookmark;
      const added = toggleBookmark(id, label);
      button.classList.toggle('is-on', added);
      button.setAttribute('aria-pressed', String(added));
      button.querySelector('span').textContent = added ? '★' : '☆';
      ctx.toast(added ? `已加书签：${label}` : `已移除书签：${label}`);
    });
  });

  // 小节级卡点回溯
  el.querySelectorAll('[data-trouble]').forEach((button) => {
    button.addEventListener('click', () => {
      const label = button.dataset.trouble;
      const section = chapter.sections.find((item) => item.label === label);
      if (!section || !section.trouble) return;
      openTrouble(
        {
          title: section.label,
          symptom: section.trouble.symptom,
          backtrack: section.trouble.backtrack,
        },
        ctx
      );
    });
  });

  // 自测作答（防抖保存）
  let answerTimer = 0;
  el.querySelectorAll('.quiz-input').forEach((textarea) => {
    textarea.addEventListener('input', () => {
      clearTimeout(answerTimer);
      answerTimer = setTimeout(() => {
        setAnswer(id, textarea.dataset.index, textarea.value);
      }, 500);
    });
  });

  // 参考答案折叠
  el.querySelectorAll('.answer-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const panel = el.querySelector(`#answer-${button.dataset.toggle}`);
      const open = panel.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(open));
      button.textContent = open ? '收起参考答案' : '查看参考答案';
    });
  });

  // 自测完成
  const doneBtn = el.querySelector('#quizDoneBtn');
  doneBtn.addEventListener('click', () => {
    const done = !doneBtn.classList.contains('is-on');
    markQuizDone(id, done);
    doneBtn.classList.toggle('is-on', done);
    doneBtn.textContent = done ? '已完成 ✓' : '标记完成';
    ctx.toast(done ? `第 ${meta.no} 章自测已完成` : '已取消完成标记');
  });

  // 笔记（防抖保存）
  const noteInput = el.querySelector('#chapterNote');
  const noteStatus = el.querySelector('#noteStatus');
  let noteTimer = 0;
  noteInput.addEventListener('input', () => {
    noteStatus.textContent = '正在保存…';
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => {
      const ok = setNote(id, noteInput.value);
      noteStatus.textContent = ok ? `已保存 · ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}` : '保存失败（浏览器存储不可用）';
    }, 600);
  });
}
