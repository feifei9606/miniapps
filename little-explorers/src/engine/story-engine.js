/**
 * 故事引擎的纯函数部分。
 *
 * 设计原则：
 * - 剧情的“数据”全部来自 JSON；这里只做解释，不写死任何一本故事。
 * - 页面推进永远是顺序 + 可选门槛（gate），不做任意 JS 执行。
 * - 出错、点错都不会让故事失败：门槛只控制“继续”按钮出现的时机。
 */

export function normalizeLine(line) {
  if (typeof line === 'string') return { text: line, audio: null }
  if (line && typeof line === 'object') {
    return { text: String(line.text || ''), audio: line.audio || null }
  }
  return { text: '', audio: null }
}

export function narrationLines(scene) {
  if (!scene) return []
  if (Array.isArray(scene.narration)) return scene.narration.map(normalizeLine)
  if (typeof scene.narration === 'string') return [normalizeLine(scene.narration)]
  return []
}

export function findInteraction(scene, id) {
  if (!scene || !Array.isArray(scene.interactions)) return null
  return scene.interactions.find((item) => item.id === id) || null
}

export function isGateOpen(scene, flags, released) {
  if (!scene?.gate?.flag) return true
  return Boolean(flags?.[scene.gate.flag]) || Boolean(released)
}

export function canAdvance(scene, flags, released) {
  return isGateOpen(scene, flags, released)
}

export function sceneIndexById(story, sceneId) {
  if (!story || !Array.isArray(story.scenes)) return 0
  const index = story.scenes.findIndex((scene) => scene.id === sceneId)
  return index < 0 ? 0 : index
}

export function totalScenes(story) {
  return Array.isArray(story?.scenes) ? story.scenes.length : 0
}

export function progressDots(story, index) {
  const total = totalScenes(story)
  return Array.from({ length: total }, (_, i) => ({
    index: i,
    current: i === index,
    done: i < index,
  }))
}

export function clampScene(index, story) {
  const total = totalScenes(story)
  if (total === 0) return 0
  return Math.min(total - 1, Math.max(0, Number(index) || 0))
}

/**
 * 供未来分支剧情使用：读取场景的 next 字段。
 * 当前故事全部是顺序线性剧情。
 */
export function resolveNext(story, scene, flags) {
  const next = scene?.next
  if (!next) return null
  if (typeof next === 'string') return next
  if (Array.isArray(next?.conditions)) {
    for (const rule of next.conditions) {
      if (flags?.[rule.condition]) return rule.target
    }
  }
  return next.default || next.target || null
}
