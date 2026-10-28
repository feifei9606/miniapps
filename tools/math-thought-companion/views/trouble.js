/**
 * 卡点回溯浮层：小节与概念共用。
 * 数据形如 { title, symptom, backtrack: [{ concept } | { chapter, label, why }] }。
 */

export function openTrouble(data, ctx) {
  closeTrouble();
  if (!data || !Array.isArray(data.backtrack) || !data.backtrack.length) return;

  const { escapeHtml } = ctx;
  const sheet = document.createElement('div');
  sheet.className = 'sheet';

  const steps = data.backtrack
    .map((step) => {
      if (step.concept) {
        const concept = ctx.concepts.get(step.concept);
        if (!concept) return '';
        return `
          <li class="bt-item">
            <span class="bt-tag">补概念</span>
            <a class="bt-target" href="#/concept/${concept.id}">
              ${escapeHtml(concept.name)}<span class="bt-en">${escapeHtml(concept.en)}</span>
            </a>
            <p class="bt-why">${escapeHtml(step.why)}</p>
          </li>`;
      }
      const chapter = ctx.chapters.get(step.chapter);
      if (!chapter) return '';
      return `
        <li class="bt-item">
          <span class="bt-tag bt-tag-chapter">回原文</span>
          <a class="bt-target" href="#/chapter/${chapter.id}">
            第 ${chapter.no} 章 · ${escapeHtml(step.label || chapter.title)}
          </a>
          <p class="bt-why">${escapeHtml(step.why)}</p>
        </li>`;
    })
    .join('');

  sheet.innerHTML = `
    <div class="sheet-veil" data-close></div>
    <section class="sheet-panel" role="dialog" aria-modal="true" aria-labelledby="sheetTitle">
      <header class="sheet-head">
        <div>
          <p class="sheet-kicker">卡点回溯</p>
          <h2 class="sheet-title" id="sheetTitle">${escapeHtml(data.title || '读不懂的地方')}</h2>
        </div>
        <button class="sheet-close" type="button" data-close aria-label="关闭">×</button>
      </header>
      ${data.symptom ? `<p class="sheet-symptom">${escapeHtml(data.symptom)}</p>` : ''}
      <ol class="bt-list">${steps}</ol>
      <p class="sheet-foot">回溯不是“再读一遍”，而是指出缺的那一层：左侧是缺口，点进去就能补。</p>
    </section>`;

  document.body.appendChild(sheet);
  document.body.classList.add('sheet-open');

  const onKey = (event) => {
    if (event.key === 'Escape') closeTrouble();
  };
  sheet.addEventListener('click', (event) => {
    if (event.target.closest('[data-close]') || event.target.closest('a')) closeTrouble();
  });
  document.addEventListener('keydown', onKey);
  sheet.addEventListener('remove', () => document.removeEventListener('keydown', onKey));
  sheet._onKey = onKey;

  const closeBtn = sheet.querySelector('.sheet-close');
  if (closeBtn) closeBtn.focus();
}

export function closeTrouble() {
  const sheet = document.querySelector('.sheet');
  if (!sheet) return;
  if (sheet._onKey) document.removeEventListener('keydown', sheet._onKey);
  sheet.remove();
  document.body.classList.remove('sheet-open');
}
