/**
 * 故事引擎的纯函数部分。
 *
 * 设计原则：
 * - 剧情的“数据”全部来自 JSON；这里只做解释，不写死任何一本故事。
 * - 推进方式是“场景 id + 条件跳转”，但仍然只解释有限的结构，
 *   绝不执行 JSON 里的任意 JS。
 * - 出错、点错都不会让故事失败：门槛只控制“继续”按钮出现的时机。
 */

export function normalizeLine(line) {
  if (typeof line === 'string') return { text: line, audio: null }
  if (line && typeof line === 'object') {
    return { text: String(line.text || ''), audio: line.audio || null }
  }
  return { text: '', audio: null }
}

/**
 * 匹配一个 when 条件对象，例如 { route: 'forest' } 或 { route: ['forest'] }。
 * 没有 when 视为“永远成立”，这样大部分旁白可以保持简单写法。
 */
export function matchWhen(when, vars) {
  if (!when) return true
  if (typeof when === 'string') return Boolean(vars?.[when])
  return Object.entries(when).every(([key, expected]) => {
    const actual = vars?.[key]
    if (Array.isArray(expected)) return expected.includes(actual)
    return actual === expected
  })
}

/**
 * 取出当前变量下该场景的旁白。
 * 旁白既可以是字符串，也可以是 { when, text } —— 让同一页在不同分支说不同的话。
 */
export function narrationLines(scene, vars = {}) {
  if (!scene) return []
  const source = Array.isArray(scene.narration)
    ? scene.narration
    : typeof scene.narration === 'string'
      ? [scene.narration]
      : []
  return source.filter((line) => matchWhen(line?.when, vars)).map(normalizeLine)
}

export function findInteraction(scene, id) {
  if (!scene || !Array.isArray(scene.interactions)) return null
  return scene.interactions.find((item) => item.id === id) || null
}

export function isGateOpen(scene, flags, released) {
  const gate = scene?.gate
  if (!gate) return true
  // gate.flag 可以是一个 flag，也可以是数组（全部满足才放行）
  const needed = Array.isArray(gate.flag) ? gate.flag : gate.flag ? [gate.flag] : []
  if (needed.length === 0) return true
  return needed.every((flag) => Boolean(flags?.[flag])) || Boolean(released)
}

export function canAdvance(scene, flags, released) {
  return isGateOpen(scene, flags, released)
}

export function storyScenes(story) {
  return Array.isArray(story?.scenes) ? story.scenes : []
}

export function sceneById(story, sceneId) {
  return storyScenes(story).find((scene) => scene.id === sceneId) || null
}

export function sceneIndexById(story, sceneId) {
  const index = storyScenes(story).findIndex((scene) => scene.id === sceneId)
  return index < 0 ? 0 : index
}

export function totalScenes(story) {
  return storyScenes(story).length
}

export function clampScene(index, story) {
  const total = totalScenes(story)
  if (total === 0) return 0
  return Math.min(total - 1, Math.max(0, Number(index) || 0))
}

export function isChoiceScene(scene) {
  return scene?.type === 'choice' && Array.isArray(scene.choices) && scene.choices.length > 0
}

/**
 * 解析 next 字段：
 *   "scene-id"
 *   { default: 'x', cases: [{ when: { route: 'beach' }, target: 'y' }] }
 * 仍然兼容早期的条件写法 { conditions: [{ condition: 'flag', target }] }。
 */
export function resolveNext(scene, vars = {}, flags = {}) {
  const next = scene?.next
  if (next === null || next === undefined || next === '') return null
  if (typeof next === 'string') return next
  if (Array.isArray(next.cases)) {
    for (const rule of next.cases) {
      if (matchWhen(rule.when, vars)) return rule.target
    }
  }
  if (Array.isArray(next.conditions)) {
    for (const rule of next.conditions) {
      if (flags?.[rule.condition]) return rule.target
    }
  }
  return next.default || next.target || null
}

/**
 * 一次选择的“结果”拆成两部分：
 * - set：写入剧情变量（vehicle / route / ending …）
 * - next：跳到哪一页
 * 选择本身永远合法，不存在选错。
 */
export function choiceOutcome(choice, vars = {}) {
  const nextVars = { ...vars, ...(choice?.set || {}) }
  return { vars: nextVars, next: choice?.next || null }
}

export function sceneProgressLabel(index, story) {
  return `第 ${index + 1} / ${totalScenes(story)} 页`
}
