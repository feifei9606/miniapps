/**
 * 数据加载：静态 JSON，运行期 fetch，内存缓存 + 并发去重 + 失败重试一次。
 * 路径基于 import.meta.url，保证部署在二级目录（GitHub Pages）时仍然正确。
 */

const BASE = new URL('./data/', import.meta.url);
const cache = new Map();
const inflight = new Map();

async function fetchJson(url, retry = 1) {
  let lastError;
  for (let attempt = 0; attempt <= retry; attempt += 1) {
    try {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < retry) await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  throw lastError;
}

function load(key, url) {
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  if (inflight.has(key)) return inflight.get(key);
  const task = fetchJson(url)
    .then((data) => {
      cache.set(key, data);
      inflight.delete(key);
      return data;
    })
    .catch((error) => {
      inflight.delete(key);
      throw error;
    });
  inflight.set(key, task);
  return task;
}

export function loadBook() {
  return load('book', new URL('book.json', BASE).href);
}

export function loadChapter(id) {
  if (!/^ch\d{2}$/.test(id)) return Promise.reject(new Error(`非法章节 id：${id}`));
  return load(id, new URL(`chapters/${id}.json`, BASE).href);
}

/** 概念注释层：现代翻译注 + 卡点回溯 + 演化边性质。 */
export function loadConceptNotes() {
  return load('concept-notes', new URL('concept-notes.json', BASE).href);
}

/** 批量预取，供概览类页面使用；失败不阻塞。 */
export function prefetchChapters(ids) {
  return Promise.allSettled(ids.map((id) => loadChapter(id)));
}

/* ---------------- 查询辅助 ---------------- */

export function indexChapters(book) {
  const map = new Map();
  for (const chapter of book.chapters) map.set(chapter.id, chapter);
  return map;
}

export function indexConcepts(book) {
  const map = new Map();
  for (const concept of book.concepts) map.set(concept.id, concept);
  return map;
}

export function indexFigures(book) {
  const map = new Map();
  for (const figure of book.figures) map.set(figure.id, figure);
  return map;
}

export function conceptsByChapter(book) {
  const map = new Map();
  for (const concept of book.concepts) {
    const list = map.get(concept.firstChapter) || [];
    list.push(concept);
    map.set(concept.firstChapter, list);
  }
  return map;
}

/** 全文检索：标题、人物、概念、章节标题。用于概念页搜索框。 */
export function searchConcepts(book, keyword) {
  const query = keyword.trim().toLowerCase();
  if (!query) return book.concepts;
  return book.concepts.filter((item) => {
    const haystack = [item.name, item.en, item.definition, item.why]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
}
