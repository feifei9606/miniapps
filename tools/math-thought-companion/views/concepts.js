/** 概念索引、概念详情与人物索引（三者共用导航归属）。 */

import { conceptsByChapter } from '../data.js';
import { openTrouble } from './trouble.js';

export async function mount(el, ctx) {
  const conceptId = ctx.params[0];
  if (conceptId) {
    renderConcept(el, ctx, conceptId);
    return;
  }
  if (location.hash.startsWith('#/figures')) {
    renderFigures(el, ctx);
    return;
  }
  renderList(el, ctx);
}

/* ---------------- 概念列表 ---------------- */

function renderList(el, ctx) {
  const { book, escapeHtml } = ctx;
  const grouped = conceptsByChapter(book);
  const chapters = book.chapters.filter((chapter) => grouped.has(chapter.id));

  el.innerHTML = `
    <header class="page-head">
      <p class="page-kicker">概念与定理</p>
      <h1 class="page-title">概念索引</h1>
      <p class="page-desc">按首次出现章分组。点开卡片可以看到这个概念在后面的章节里如何被继承、改造或推翻。</p>
      <div class="search-row">
        <input type="search" id="conceptSearch" class="search-input" placeholder="搜索概念、英文名或定义…" aria-label="搜索概念">
        <a class="btn btn-ghost btn-sm" href="#/figures">人物索引 →</a>
      </div>
    </header>

    <p class="search-empty" id="searchEmpty" hidden>没有匹配的概念，换个关键词试试。</p>

    <div class="concept-groups" id="conceptGroups">
      ${chapters
        .map((chapter, index) => {
          const list = grouped.get(chapter.id);
          return `
          <details class="concept-group" ${index === 0 ? 'open' : ''}>
            <summary>
              <span class="group-seal">${chapter.no}</span>
              <span class="group-title">${escapeHtml(chapter.title)}</span>
              <span class="group-count">${list.length}</span>
            </summary>
            <div class="concept-items">
              ${list
                .map(
                  (concept) => `
                <a class="concept-item" href="#/concept/${concept.id}" data-search="${escapeHtml(
                    [concept.name, concept.en, concept.definition].join(' ').toLowerCase()
                  )}">
                  <span class="concept-item-name">${escapeHtml(concept.name)}</span>
                  <span class="concept-item-en">${escapeHtml(concept.en)}</span>
                  <span class="concept-item-def">${escapeHtml(concept.definition)}</span>
                </a>`
                )
                .join('')}
            </div>
          </details>`;
        })
        .join('')}
    </div>
  `;

  const input = el.querySelector('#conceptSearch');
  const empty = el.querySelector('#searchEmpty');
  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    let visible = 0;
    el.querySelectorAll('.concept-group').forEach((group) => {
      let groupVisible = 0;
      group.querySelectorAll('.concept-item').forEach((item) => {
        const hit = !query || item.dataset.search.includes(query);
        item.hidden = !hit;
        if (hit) groupVisible += 1;
      });
      group.hidden = groupVisible === 0;
      if (query && groupVisible > 0) group.open = true;
      visible += groupVisible;
    });
    empty.hidden = visible > 0;
  });
}

/* ---------------- 概念详情 ---------------- */

function renderConcept(el, ctx, conceptId) {
  const { escapeHtml, concepts } = ctx;
  const concept = concepts.get(conceptId);
  if (!concept) {
    el.innerHTML = `<section class="panel error-panel"><h2>找不到这张卡片</h2>
      <a class="btn btn-primary" href="#/concepts">回到概念索引</a></section>`;
    return;
  }

  const firstChapter = ctx.chapters.get(concept.firstChapter);
  const evolution = concept.evolution || [];
  const figures = (concept.figures || []).map((id) => ctx.figures.get(id)).filter(Boolean);
  const note = ctx.conceptNotes.get(conceptId) || {};
  const modern = note.modernNote;
  const trouble = note.trouble;
  const edges = note.edges || {};

  el.innerHTML = `
    <a class="back-inline" href="#/concepts">← 概念索引</a>

    <article class="concept-card">
      <header class="concept-card-head">
        <p class="page-kicker">概念卡片 · 首次出现于第 ${firstChapter.no} 章</p>
        <h1 class="concept-card-title">${escapeHtml(concept.name)}</h1>
        <p class="concept-card-en">${escapeHtml(concept.en)}</p>
        ${
          trouble
            ? `<button class="trouble-open" type="button" id="conceptTrouble">
            <span aria-hidden="true">?</span>读到这里卡住了
          </button>`
            : ''
        }
      </header>

      <section class="concept-block">
        <h2 class="section-h">是什么</h2>
        <p class="prose">${escapeHtml(concept.definition)}</p>
      </section>

      <section class="concept-block">
        <h2 class="section-h">为什么重要</h2>
        <p class="prose">${escapeHtml(concept.why)}</p>
      </section>

      ${
        modern
          ? `<section class="concept-block">
        <h2 class="section-h">现代翻译注 <span class="section-h-note">先看它像什么，再看它不是什么</span></h2>
        <div class="mn-list">
          <div class="mn-row mn-same">
            <span class="mn-key" aria-hidden="true">≈</span>
            <p>${escapeHtml(modern.similar)}</p>
          </div>
          <div class="mn-row mn-diff">
            <span class="mn-key" aria-hidden="true">≠</span>
            <p>${escapeHtml(modern.different)}</p>
          </div>
          <div class="mn-row mn-func">
            <span class="mn-key">功能</span>
            <p>${escapeHtml(modern.function)}</p>
          </div>
        </div>
      </section>`
          : ''
      }

      ${
        evolution.length
          ? `<section class="concept-block">
        <h2 class="section-h">后续演化 <span class="section-h-note">边表示“它制造了什么困难 / 谁回应了它”</span></h2>
        <ol class="evolution-list">
          ${evolution
            .map((item) => {
              const chapter = ctx.chapters.get(item.chapter);
              if (!chapter) return '';
              const edge = edges[item.chapter] || {};
              const type = edge.type || 'inherit';
              const tag = { problem: '制造困难', response: '回应', inherit: '沿用' }[type] || '沿用';
              return `<li class="edge edge-${type}">
                <div class="edge-head">
                  <a class="evolution-year" href="#/chapter/${chapter.id}">第 ${chapter.no} 章</a>
                  <span class="edge-tag edge-tag-${type}">${tag}</span>
                </div>
                <p>${escapeHtml(item.text)}</p>
                ${type === 'problem' && edge.gap ? `<p class="edge-gap">留下的困难：${escapeHtml(edge.gap)}</p>` : ''}
              </li>`;
            })
            .join('')}
        </ol>
      </section>`
          : ''
      }

      ${
        figures.length
          ? `<section class="concept-block">
        <h2 class="section-h">相关人物</h2>
        <div class="figure-list figure-list-compact">
          ${figures
            .map(
              (figure) => `
            <div class="figure-card">
              <div class="figure-avatar" aria-hidden="true">${escapeHtml(figure.name.slice(0, 1))}</div>
              <div>
                <p class="figure-name">${escapeHtml(figure.name)}<span class="figure-en">${escapeHtml(figure.en)}</span></p>
                <p class="figure-life">${escapeHtml(figure.life)}</p>
                <p class="figure-note">${escapeHtml(figure.note)}</p>
              </div>
            </div>`
            )
            .join('')}
        </div>
      </section>`
          : ''
      }

      <footer class="concept-card-foot">
        <a class="btn btn-primary" href="#/chapter/${firstChapter.id}">回到第 ${firstChapter.no} 章　${escapeHtml(firstChapter.title)}</a>
      </footer>
    </article>
  `;

  const troubleBtn = el.querySelector('#conceptTrouble');
  if (troubleBtn && trouble) {
    troubleBtn.addEventListener('click', () => {
      openTrouble(
        { title: concept.name, symptom: trouble.symptom, backtrack: trouble.backtrack },
        ctx
      );
    });
  }
}

/* ---------------- 人物索引 ---------------- */

function renderFigures(el, ctx) {
  const { book, escapeHtml } = ctx;
  const groups = book.chapters
    .map((chapter) => ({
      chapter,
      list: book.figures.filter((figure) => figure.chapters.includes(chapter.id)),
    }))
    .filter((group) => group.list.length);

  el.innerHTML = `
    <header class="page-head">
      <p class="page-kicker">人物索引</p>
      <h1 class="page-title">谁在什么时候做了什么</h1>
      <p class="page-desc">按出现章排列。同一个人若跨越多章，会在各章重复出现——这正是他影响延续的痕迹。</p>
      <div class="search-row">
        <a class="btn btn-ghost btn-sm" href="#/concepts">← 概念索引</a>
      </div>
    </header>

    <div class="figure-groups">
      ${groups
        .map(
          (group) => `
        <section class="figure-group">
          <h2 class="figure-group-title">
            <a href="#/chapter/${group.chapter.id}">
              <span class="group-seal">${group.chapter.no}</span>${escapeHtml(group.chapter.title)}
            </a>
          </h2>
          <div class="figure-list">
            ${group.list
              .map(
                (figure) => `
              <div class="figure-card">
                <div class="figure-avatar" aria-hidden="true">${escapeHtml(figure.name.slice(0, 1))}</div>
                <div>
                  <p class="figure-name">${escapeHtml(figure.name)}<span class="figure-en">${escapeHtml(figure.en)}</span></p>
                  <p class="figure-life">${escapeHtml(figure.life)}</p>
                  <p class="figure-note">${escapeHtml(figure.note)}</p>
                </div>
              </div>`
              )
              .join('')}
          </div>
        </section>`
        )
        .join('')}
    </div>
  `;
}
