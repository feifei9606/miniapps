/**
 * 本地持久化：所有个人数据只存在当前浏览器，命名空间 gjsx.v1.*。
 * 结构损坏时回退为空态，不抛错，避免整页白屏。
 */

const NS = 'gjsx.v1';
const KEYS = {
  progress: `${NS}.progress`,
  notes: `${NS}.notes`,
  answers: `${NS}.answers`,
  quiz: `${NS}.quiz`,
  bookmarks: `${NS}.bookmarks`,
  check: `${NS}.check`,
};

export const STATUS = ['unread', 'reading', 'read'];
export const STATUS_LABEL = { unread: '未读', reading: '在读', read: '已读' };

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const value = JSON.parse(raw);
    if (value === null || typeof value !== 'object') return fallback;
    return value;
  } catch (error) {
    console.warn('[store] 读取失败，已回退为空态：', key, error);
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('gjsx:change', { detail: { key } }));
    return true;
  } catch (error) {
    console.warn('[store] 写入失败（可能是隐私模式或空间不足）：', key, error);
    return false;
  }
}

/* ---------------- 阅读进度 ---------------- */

export function getProgress() {
  return read(KEYS.progress, {});
}

export function getStatus(id) {
  const status = getProgress()[id];
  return STATUS.includes(status) ? status : 'unread';
}

export function setStatus(id, status) {
  if (!STATUS.includes(status)) return false;
  const progress = { ...getProgress(), [id]: status };
  return write(KEYS.progress, progress);
}

export function cycleStatus(id) {
  const order = { unread: 'reading', reading: 'read', read: 'unread' };
  const next = order[getStatus(id)];
  setStatus(id, next);
  return next;
}

export function countRead(ids) {
  const progress = getProgress();
  return ids.filter((id) => progress[id] === 'read').length;
}

export function lastReadingId(ids) {
  const progress = getProgress();
  const reading = ids.filter((id) => progress[id] === 'reading');
  if (reading.length) return reading[reading.length - 1];
  const read = ids.filter((id) => progress[id] === 'read');
  if (read.length) {
    const index = ids.indexOf(read[read.length - 1]);
    return ids[Math.min(index + 1, ids.length - 1)];
  }
  return ids[0];
}

/* ---------------- 笔记 ---------------- */

export function getNotes() {
  return read(KEYS.notes, {});
}

export function getNote(id) {
  const value = getNotes()[id];
  return typeof value === 'string' ? value : '';
}

export function setNote(id, text) {
  const notes = { ...getNotes(), [id]: text };
  return write(KEYS.notes, notes);
}

/* ---------------- 自测作答 ---------------- */

export function getAnswers(id) {
  const all = read(KEYS.answers, {});
  const value = all[id];
  return value && typeof value === 'object' ? value : {};
}

export function getAllAnswers() {
  return read(KEYS.answers, {});
}

export function setAnswer(id, index, text) {
  const all = read(KEYS.answers, {});
  const chapter = { ...(all[id] || {}), [index]: text };
  const next = { ...all, [id]: chapter };
  return write(KEYS.answers, next);
}

export function getQuizDone() {
  return read(KEYS.quiz, {});
}

export function isQuizDone(id) {
  return getQuizDone()[id] === true;
}

export function markQuizDone(id, done = true) {
  const all = getQuizDone();
  const next = { ...all };
  if (done) next[id] = true;
  else delete next[id];
  return write(KEYS.quiz, next);
}

/* ---------------- 读前诊断 ---------------- */

export function getCheck(id) {
  const all = read(KEYS.check, {});
  const value = all[id];
  if (!value || typeof value !== 'object' || typeof value.answers !== 'object') return null;
  return value;
}

export function saveCheck(id, answers) {
  const all = read(KEYS.check, {});
  return write(KEYS.check, { ...all, [id]: { answers, at: new Date().toISOString() } });
}

export function clearCheck(id) {
  const all = read(KEYS.check, {});
  delete all[id];
  return write(KEYS.check, all);
}

/* ---------------- 书签 ---------------- */

export function getBookmarks() {
  const list = read(KEYS.bookmarks, []);
  return Array.isArray(list) ? list : [];
}

export function toggleBookmark(id, label) {
  const list = getBookmarks();
  const index = list.findIndex((item) => item.chapter === id && item.label === label);
  let next;
  if (index >= 0) {
    next = list.filter((_, i) => i !== index);
  } else {
    next = [...list, { chapter: id, label, createdAt: new Date().toISOString() }];
  }
  write(KEYS.bookmarks, next);
  return index < 0;
}

export function hasBookmark(id, label) {
  return getBookmarks().some((item) => item.chapter === id && item.label === label);
}

export function removeBookmark(id, label) {
  const next = getBookmarks().filter((item) => !(item.chapter === id && item.label === label));
  return write(KEYS.bookmarks, next);
}

/* ---------------- 导出 ---------------- */

function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * 生成 Markdown 文本（纯函数，便于单独测试）。
 * @param {object} book book.json
 * @param {Array<{id:string,no:number,title:string,quiz:Array}>} chapters 已加载的章节数据
 */
export function buildMarkdown(book, chapters) {
  const line = [];
  const ids = book.chapters.map((c) => c.id);
  const progress = getProgress();
  const notes = getNotes();
  const answers = read(KEYS.answers, {});
  const quizDone = getQuizDone();
  const bookmarks = getBookmarks();
  const readCount = countRead(ids);
  const today = formatDate(new Date().toISOString());

  line.push(`# 《${book.meta.title}》${book.meta.subtitle} · 阅读记录`);
  line.push('');
  line.push(`导出日期：${today}　进度：已读 ${readCount} / ${ids.length} 章`);
  line.push('');
  line.push('## 一、进度');
  line.push('');
  line.push('| 章 | 标题 | 状态 | 自测 |');
  line.push('| --- | --- | --- | --- |');
  for (const chapter of book.chapters) {
    const status = STATUS_LABEL[progress[chapter.id]] || '未读';
    const quiz = quizDone[chapter.id] ? '已完成' : '—';
    line.push(`| ${chapter.no} | ${chapter.title} | ${status} | ${quiz} |`);
  }
  line.push('');

  const noted = book.chapters.filter((c) => (notes[c.id] || '').trim());
  line.push('## 二、章节笔记');
  line.push('');
  if (!noted.length) {
    line.push('_尚未记录笔记。_');
    line.push('');
  }
  for (const chapter of noted) {
    line.push(`### 第 ${chapter.no} 章　${chapter.title}`);
    line.push('');
    line.push(notes[chapter.id].trim());
    line.push('');
  }

  const answered = book.chapters.filter((c) => {
    const item = answers[c.id];
    return item && Object.values(item).some((text) => (text || '').trim());
  });
  line.push('## 三、思考题作答');
  line.push('');
  if (!answered.length) {
    line.push('_尚未作答。_');
    line.push('');
  }
  for (const meta of answered) {
    const chapter = chapters.find((c) => c.id === meta.id);
    if (!chapter) continue;
    line.push(`### 第 ${meta.no} 章　${meta.title}`);
    line.push('');
    chapter.quiz.forEach((item, index) => {
      const text = (answers[meta.id] || {})[index];
      if (!text || !text.trim()) return;
      line.push(`**${index + 1}. ${item.q}**`);
      line.push('');
      line.push(`> ${text.trim().replace(/\n/g, '\n> ')}`);
      line.push('');
    });
  }

  line.push('## 四、书签');
  line.push('');
  if (!bookmarks.length) {
    line.push('_尚未添加书签。_');
  } else {
    for (const item of bookmarks) {
      const meta = book.chapters.find((c) => c.id === item.chapter);
      line.push(`- 第 ${meta ? meta.no : '?'} 章　${meta ? meta.title : item.chapter} — ${item.label}（${formatDate(item.createdAt)}）`);
    }
  }
  line.push('');
  line.push('---');
  line.push('');
  line.push('_由《古今数学思想》伴读手册导出。年代与引文以原书为准，个人笔记与作答仅供参考。_');
  line.push('');

  return line.join('\n');
}

export function clearAll() {
  for (const key of Object.values(KEYS)) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('[store] 清除失败：', key, error);
    }
  }
  window.dispatchEvent(new CustomEvent('gjsx:change', { detail: { key: 'all' } }));
}

export function downloadMarkdown(text, filename) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
