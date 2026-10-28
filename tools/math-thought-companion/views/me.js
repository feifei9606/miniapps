/** 我的：进度矩阵、书签、笔记总览、自测完成度、导出与清空。 */

import { loadChapter } from '../data.js';
import {
  STATUS_LABEL,
  getProgress,
  getStatus,
  getNotes,
  getBookmarks,
  removeBookmark,
  getQuizDone,
  getAllAnswers,
  buildMarkdown,
  downloadMarkdown,
  clearAll,
} from '../store.js';

export async function mount(el, ctx) {
  const { book, escapeHtml } = ctx;
  const progress = getProgress();
  const notes = getNotes();
  const bookmarks = getBookmarks();
  const quizDone = getQuizDone();
  const answers = getAllAnswers();
  const ids = book.chapters.map((c) => c.id);

  const readCount = ids.filter((id) => progress[id] === 'read').length;
  const readingCount = ids.filter((id) => progress[id] === 'reading').length;
  const quizCount = ids.filter((id) => quizDone[id]).length;
  const notedCount = ids.filter((id) => (notes[id] || '').trim()).length;
  const answeredCount = ids.filter((id) => {
    const item = answers[id];
    return item && Object.values(item).some((text) => (text || '').trim());
  }).length;

  el.innerHTML = `
    <header class="page-head">
      <p class="page-kicker">个人记录</p>
      <h1 class="page-title">我的</h1>
      <p class="page-desc">所有数据只保存在这台设备的浏览器里，不上传、不同步。换设备或清理浏览器数据会丢失，建议定期导出。</p>
    </header>

    <section class="stat-row">
      <div class="stat-card"><strong>${readCount}</strong><span>已读章</span></div>
      <div class="stat-card"><strong>${readingCount}</strong><span>在读章</span></div>
      <div class="stat-card"><strong>${quizCount}</strong><span>完成自测</span></div>
      <div class="stat-card"><strong>${notedCount}</strong><span>写了笔记</span></div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2 class="panel-title">进度矩阵</h2>
        <span class="panel-note">点击进入章节；状态在章节页内切换</span>
      </div>
      <div class="progress-matrix">
        ${book.chapters
          .map((chapter) => {
            const status = STATUS_LABEL[getStatus(chapter.id)] ? getStatus(chapter.id) : 'unread';
            return `<a class="matrix-cell matrix-${status}" href="#/chapter/${chapter.id}"
              title="第 ${chapter.no} 章 ${escapeHtml(chapter.title)}·${STATUS_LABEL[status]}">
              <span class="matrix-no">${String(chapter.no).padStart(2, '0')}</span>
              <span class="matrix-status">${STATUS_LABEL[status]}</span>
            </a>`;
          })
          .join('')}
      </div>
      <div class="legend">
        <span class="legend-item"><i class="legend-dot status-unread"></i>未读</span>
        <span class="legend-item"><i class="legend-dot status-reading"></i>在读</span>
        <span class="legend-item"><i class="legend-dot status-read"></i>已读</span>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2 class="panel-title">自测与作答</h2>
        <span class="panel-note">${quizCount} / ${ids.length} 章已完成，${answeredCount} 章留有作答</span>
      </div>
      <div class="meter" role="img" aria-label="自测完成度 ${Math.round((quizCount / ids.length) * 100)}%">
        <span style="width:${Math.round((quizCount / ids.length) * 100)}%"></span>
      </div>
      <p class="panel-hint">自测题在每章末尾。写得下就写，写不下也可以直接看参考答案——关键是先自己想一遍。</p>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2 class="panel-title">书签</h2>
        <span class="panel-note">${bookmarks.length} 条</span>
      </div>
      ${
        bookmarks.length
          ? `<ul class="bookmark-list">
        ${bookmarks
          .map((item) => {
            const chapter = ctx.chapters.get(item.chapter);
            if (!chapter) return '';
            return `<li>
              <a class="bookmark-link" href="#/chapter/${item.chapter}">
                <span class="bookmark-chapter">第 ${chapter.no} 章</span>
                <span class="bookmark-label">${escapeHtml(item.label)}</span>
                <span class="bookmark-chapter-title">${escapeHtml(chapter.title)}</span>
              </a>
              <button class="bookmark-remove" type="button" data-remove="${escapeHtml(item.chapter)}" data-label="${escapeHtml(item.label)}" aria-label="删除书签">×</button>
            </li>`;
          })
          .join('')}
      </ul>`
          : `<p class="panel-hint">还没有书签。在章节页的小节卡片右上角点 ☆ 即可标记。</p>`
      }
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2 class="panel-title">笔记</h2>
        <span class="panel-note">${notedCount} 章有内容</span>
      </div>
      ${
        notedCount
          ? `<ul class="note-list">
        ${book.chapters
          .filter((chapter) => (notes[chapter.id] || '').trim())
          .map(
            (chapter) => `
          <li>
            <a href="#/chapter/${chapter.id}">
              <span class="note-chapter">第 ${chapter.no} 章　${escapeHtml(chapter.title)}</span>
              <span class="note-preview">${escapeHtml((notes[chapter.id] || '').trim().slice(0, 90))}${(notes[chapter.id] || '').length > 90 ? '…' : ''}</span>
            </a>
          </li>`
          )
          .join('')}
      </ul>`
          : `<p class="panel-hint">还没有笔记。每章末尾有笔记框，输入即自动保存。</p>`
      }
    </section>

    <section class="panel export-panel">
      <div class="panel-head">
        <h2 class="panel-title">导出与清理</h2>
      </div>
      <p class="panel-hint">导出为 Markdown：含阅读进度、各章笔记、思考题作答与书签，可直接放进 Obsidian 或笔记库。</p>
      <div class="export-actions">
        <button class="btn btn-primary" type="button" id="exportBtn">导出 Markdown</button>
        <button class="btn btn-danger" type="button" id="clearBtn">清空全部数据</button>
      </div>
    </section>

    <p class="legal-note">${escapeHtml(book.meta.notice)}</p>
  `;

  el.querySelectorAll('.bookmark-remove').forEach((button) => {
    button.addEventListener('click', () => {
      removeBookmark(button.dataset.remove, button.dataset.label);
      ctx.toast('书签已删除');
      mount(el, ctx);
    });
  });

  const exportBtn = el.querySelector('#exportBtn');
  exportBtn.addEventListener('click', async () => {
    exportBtn.disabled = true;
    const original = exportBtn.textContent;
    exportBtn.textContent = '正在汇总…';
    try {
      const answerMap = getAllAnswers();
      const idsWithAnswers = Object.keys(answerMap).filter((id) =>
        Object.values(answerMap[id] || {}).some((text) => (text || '').trim())
      );
      const chapters = (
        await Promise.all(
          idsWithAnswers.map((id) => loadChapter(id).catch(() => null))
        )
      ).filter(Boolean);
      const markdown = buildMarkdown(book, chapters);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadMarkdown(markdown, `古今数学思想-第一册-伴读笔记-${stamp}.md`);
      ctx.toast('已导出 Markdown');
    } catch (error) {
      console.error(error);
      ctx.toast('导出失败，请重试');
    } finally {
      exportBtn.disabled = false;
      exportBtn.textContent = original;
    }
  });

  const clearBtn = el.querySelector('#clearBtn');
  let armed = false;
  let armTimer = 0;
  clearBtn.addEventListener('click', () => {
    if (!armed) {
      armed = true;
      clearBtn.textContent = '再点一次确认清空';
      clearBtn.classList.add('is-armed');
      armTimer = setTimeout(() => {
        armed = false;
        clearBtn.textContent = '清空全部数据';
        clearBtn.classList.remove('is-armed');
      }, 4000);
      return;
    }
    clearTimeout(armTimer);
    clearAll();
    ctx.toast('数据已清空');
    mount(el, ctx);
  });
}
