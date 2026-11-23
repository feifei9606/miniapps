/**
 * 旁白语音选择。
 *
 * 浏览器的 speechSynthesis 会把所有中文都归到 `zh` 下，
 * 手机 / 平板上经常同时有普通话和粤语（zh-HK、yue），
 * 而 getVoices() 的顺序并不保证普通话在前。如果直接取第一个，
 * 就会出现“故事用粤语读”的问题。
 *
 * 这里只挑普通话（zh-CN / zh-SG / zh-TW / cmn），
 * 明确排除粤语（zh-HK / zh-MO / yue）；一个普通话语音都没有时
 * 返回 null，让上层退回“字幕节奏”，宁可不读也不读错语言。
 */

const CANTONESE_LANG = /^(zh[-_](hk|mo)|yue)\b/i
const MANDARIN_LANG = /^(zh[-_](cn|sg|tw)|cmn)\b/i
const ANY_CHINESE_LANG = /^(zh|cmn)\b/i
const CANTONESE_NAME = /cantonese|sin-?ji|粤|粵|廣東話|广东话|hong\s*kong/i
const MANDARIN_NAME = /mandarin|putonghua|普通话|普通話|國語|国语|xiaoxiao|xiaoyi|yunxi|yunyang|ting-?ting|mei-?jia/i

export function scoreVoice(voice) {
  const lang = String(voice?.lang || '').replace(/_/g, '-').toLowerCase()
  const name = String(voice?.name || '')
  let score = 0

  if (CANTONESE_LANG.test(lang)) score -= 100
  if (MANDARIN_LANG.test(lang)) score += 20
  else if (ANY_CHINESE_LANG.test(lang)) score += 2

  if (MANDARIN_NAME.test(name)) score += 8
  if (CANTONESE_NAME.test(name)) score -= 60
  if (voice?.localService) score += 1

  return score
}

export function pickMandarinVoice(voices = []) {
  let best = null
  let bestScore = 0
  for (const voice of voices) {
    const score = scoreVoice(voice)
    if (score > bestScore) {
      best = voice
      bestScore = score
    }
  }
  return best
}
