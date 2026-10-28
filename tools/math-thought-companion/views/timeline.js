/** 完整时间轴：从美索不达米亚到 17 世纪，点击事件跳到对应章。 */

export async function mount(el, ctx) {
  const { book, escapeHtml } = ctx;
  const events = book.timeline;
  const byChapter = new Map();
  for (const event of events) {
    byChapter.set(event.chapter, (byChapter.get(event.chapter) || 0) + 1);
  }
  const span = book.meta.period;

  el.innerHTML = `
    <header class="page-head">
      <p class="page-kicker">${escapeHtml(span)}</p>
      <h1 class="page-title">时间轴</h1>
      <p class="page-desc">${events.length} 个节点，覆盖第一册全部 13 章。每一格都可点进对应章节的导读；年代以原书叙述为准，古史部分多为约数。</p>
    </header>

    <ol class="timeline timeline-full">
      ${events
        .map((item) => {
          const chapter = ctx.chapters.get(item.chapter);
          const kindLabel = { event: '事件', work: '著作', person: '人物' }[item.kind] || '事件';
          return `
          <li class="timeline-item">
            <span class="timeline-node" aria-hidden="true"></span>
            <div class="timeline-year-col">${escapeHtml(item.label)}</div>
            <a class="timeline-card" href="#/chapter/${item.chapter}">
              <span class="timeline-kind">${kindLabel} · 第 ${chapter ? chapter.no : '?'} 章</span>
              <span class="timeline-text">${escapeHtml(item.text)}</span>
              <span class="timeline-go">${chapter ? escapeHtml(chapter.title) : ''} →</span>
            </a>
          </li>`;
        })
        .join('')}
    </ol>

    <section class="chapter-touch-grid">
      ${book.chapters
        .filter((chapter) => byChapter.has(chapter.id))
        .map(
          (chapter) => `
        <a class="chapter-touch" href="#/chapter/${chapter.id}">
          <span class="chapter-touch-no">${chapter.no}</span>
          <span class="chapter-touch-title">${escapeHtml(chapter.title)}</span>
          <span class="chapter-touch-count">${byChapter.get(chapter.id)} 个节点</span>
        </a>`
        )
        .join('')}
    </section>
  `;
}
