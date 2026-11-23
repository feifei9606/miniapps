export const AGE_FILTERS = [
  { id: 'all', label: '全部年龄', short: '全部', emoji: '🌈', range: null },
  { id: '2-3', label: '2–3 岁', short: '2–3 岁', emoji: '🍼', range: [2, 3] },
  { id: '3-4', label: '3–4 岁', short: '3–4 岁', emoji: '🌱', range: [3, 4] },
  { id: '4-5', label: '4–5 岁', short: '4–5 岁', emoji: '🚀', range: [4, 5] },
]

export const CATEGORIES = [
  { id: 'all', label: '全部', emoji: '✨' },
  { id: 'transportation', label: '交通工具', emoji: '🚌' },
  { id: 'dinosaur', label: '恐龙世界', emoji: '🦕' },
  { id: 'animal', label: '动物朋友', emoji: '🐾' },
  { id: 'nature', label: '自然探索', emoji: '🌱' },
  { id: 'habit', label: '生活习惯', emoji: '🏠' },
  { id: 'emotion', label: '情绪社交', emoji: '💞' },
]

export const COMING_SOON = [
  {
    id: 'dino-mama',
    title: '小恐龙找妈妈',
    subtitle: '走过森林，听见熟悉的声音……',
    emoji: '🦕',
    ageLabel: '2–4 岁',
    ageRange: [2, 4],
    category: ['dinosaur', 'emotion'],
    tint: '#DCEBD3',
    tint2: '#C5DFC4',
  },
  {
    id: 'fire-truck',
    title: '消防车忙碌的一天',
    subtitle: '呜哇呜哇，今天要去帮助谁呢？',
    emoji: '🚒',
    ageLabel: '3–5 岁',
    ageRange: [3, 5],
    category: ['transportation', 'habit'],
    tint: '#FBE0D6',
    tint2: '#F6C9BC',
  },
]

export function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label || id
}

export function categoryEmoji(id) {
  return CATEGORIES.find((c) => c.id === id)?.emoji || '✨'
}
