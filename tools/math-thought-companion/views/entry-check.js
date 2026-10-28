/**
 * 动作一：读前准入门槛诊断。
 * 单选 + 每个错误项映射具体缺口；结果给两条路径（补概念 / 直接进入 / 低门槛）。
 */

import { getCheck, saveCheck, clearCheck } from '../store.js';

function compute(entry, answers) {
  const details = entry.items.map((item, index) => {
    const picked = answers[index];
    const option = item.options[Number(picked)];
    return {
      index,
      ok: Boolean(option && option.correct),
      note: option ? option.note : '',
      gap: option && option.gap ? option.gap : null,
    };
  });
  const correct = details.filter((item) => item.ok).length;
  const total = entry.items.length;
  const level = correct === total ? 'ready' : correct >= Math.ceil(total / 2) ? 'patch' : 'lite';
  const gaps = [...new Set(details.filter((item) => !item.ok && item.gap).map((item) => item.gap))];
  return { details, correct, total, level, gaps };
}

function idleHtml(entry, ctx) {
  return `
    <p class="ec-intro">${ctx.escapeHtml(entry.intro)}</p>
    <div class="ec-actions">
      <button class="btn btn-primary btn-sm" type="button" data-ec="start">开始诊断</button>
      <span class="ec-hint">不记分，只用来决定“怎么读”</span>
    </div>`;
}

function formHtml(entry, ctx) {
  return `
    <form class="ec-form" novalidate>
      ${entry.items
        .map(
          (item, i) => `
        <fieldset class="ec-item">
          <legend class="ec-q"><span class="ec-q-no">${i + 1}</span>${ctx.escapeHtml(item.q)}</legend>
          ${item.options
            .map(
              (option, j) => `
            <label class="ec-option">
              <input type="radio" name="q${i}" value="${j}">
              <span class="ec-option-text">${ctx.escapeHtml(option.text)}</span>
            </label>`
            )
            .join('')}
        </fieldset>`
        )
        .join('')}
      <div class="ec-actions">
        <button class="btn btn-primary btn-sm" type="submit">看结论</button>
        <button class="btn btn-ghost btn-sm" type="button" data-ec="cancel">取消</button>
      </div>
    </form>`;
}

function resultHtml(entry, answers, ctx) {
  const { details, correct, total, level, gaps } = compute(entry, answers);
  const path = entry.paths[level] || {};
  const wrong = details.filter((item) => !item.ok);
  const gapChips = gaps
    .map((id) => {
      const concept = ctx.concepts.get(id);
      if (!concept) return '';
      return `<a class="ec-gap" href="#/concept/${concept.id}">${ctx.escapeHtml(concept.name)}</a>`;
    })
    .filter(Boolean)
    .join('');

  return `
    <div class="ec-verdict ec-${level}">
      <span class="ec-score">${correct}<i>/${total}</i></span>
      <div>
        <p class="ec-verdict-title">${ctx.escapeHtml(path.label || '诊断完成')}</p>
        <p class="ec-verdict-note">${ctx.escapeHtml(path.note || '')}</p>
      </div>
    </div>
    ${
      wrong.length
        ? `<ul class="ec-details">
      ${wrong
        .map(
          (item) => `
        <li class="ec-detail">
          <span class="ec-detail-mark">第 ${item.index + 1} 题</span>
          <p>${ctx.escapeHtml(item.note)}</p>
        </li>`
        )
        .join('')}
    </ul>`
        : `<p class="ec-perfect">四题全对——可以直接进入正文，留意本章的关键转折即可。</p>`
    }
    ${
      gapChips
        ? `<div class="ec-gaps"><span class="ec-gaps-label">缺口</span>${gapChips}</div>`
        : ''
    }
    <div class="ec-actions">
      <button class="btn btn-primary btn-sm" type="button" data-ec="enter">进入正文</button>
      <button class="btn btn-ghost btn-sm" type="button" data-ec="redo">重做</button>
    </div>`;
}

export function renderEntry(entry, ctx) {
  if (!entry) return '';
  const saved = getCheck(ctx.chapterId);
  return `
    <section class="entry-check" id="entryCheck">
      <header class="ec-head">
        <span class="ec-badge">读前</span>
        <h2 class="ec-title">这一章你现在读得动吗</h2>
        <span class="ec-meta">${entry.items.length} 题 · 约 1 分钟</span>
      </header>
      <div class="ec-body">${saved ? resultHtml(entry, saved.answers, ctx) : idleHtml(entry, ctx)}</div>
    </section>`;
}

export function bindEntry(root, entry, chapterId, ctx) {
  const card = root.querySelector('#entryCheck');
  if (!card) return;
  const body = card.querySelector('.ec-body');

  const show = (html) => {
    body.innerHTML = html;
  };

  card.addEventListener('click', (event) => {
    const action = event.target.closest('[data-ec]');
    if (!action) return;
    const kind = action.dataset.ec;

    if (kind === 'start') {
      show(formHtml(entry, ctx));
      const first = body.querySelector('input');
      if (first) first.focus();
      return;
    }
    if (kind === 'redo') {
      clearCheck(chapterId);
      show(formHtml(entry, ctx));
      return;
    }
    if (kind === 'cancel') {
      const saved = getCheck(chapterId);
      show(saved ? resultHtml(entry, saved.answers, ctx) : idleHtml(entry, ctx));
      return;
    }
    if (kind === 'enter') {
      const target = root.querySelector('.chapter-section');
      if (target) target.scrollIntoView({ block: 'start' });
    }
  });

  card.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.target;
    const answers = {};
    let missing = -1;
    entry.items.forEach((_, i) => {
      const picked = form.querySelector(`input[name="q${i}"]:checked`);
      if (picked) answers[i] = Number(picked.value);
      else if (missing < 0) missing = i;
    });
    if (missing >= 0) {
      ctx.toast(`第 ${missing + 1} 题还没有选`);
      return;
    }
    saveCheck(chapterId, answers);
    show(resultHtml(entry, answers, ctx));
    ctx.toast('诊断完成，结论已按你的选择生成');
    card.scrollIntoView({ block: 'start' });
  });
}
