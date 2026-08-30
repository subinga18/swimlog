// utils/parser.js
// 가민 커넥트 수영 인터벌 표 텍스트를 파싱해 영법별로 집계한다.

/**
 * @typedef {Object} StrokeStat
 * @property {string} key   - 영법 키 (free, breast, back, fly, im, drill)
 * @property {string} label - 영법 표시 이름
 * @property {string} color - 테마 컬러 토큰 클래스 이름 (free, breast, ...)
 * @property {number} distance - 총 거리 (m)
 * @property {number} timeSec  - 총 소요 시간 (초)
 * @property {number} paceSec  - 평균 페이스 (100m 당 초)
 * @property {number} hr       - 평균 심박수 (bpm)
 * @property {number} laps     - 랩(인터벌) 개수
 */

// 영법 정의. matchers 순서가 중요하다(더 구체적인 것을 먼저 검사).
export const STROKE_DEFS = [
  { key: 'im', label: '혼영', color: 'im', matchers: [/혼영/, /개인혼영/, /individual\s*medley/i, /\bIM\b/, /medley/i] },
  { key: 'fly', label: '접영', color: 'fly', matchers: [/접영/, /접\b/, /butterfly/i, /\bfly\b/] },
  { key: 'back', label: '배영', color: 'back', matchers: [/배영/, /backstroke/i, /\bback\b/] },
  { key: 'breast', label: '평영', color: 'breast', matchers: [/평영/, /breaststroke/i, /\bbreast\b/] },
  { key: 'drill', label: '드릴/킥', color: 'drill', matchers: [/드릴/, /\bkick\b/i, /킥/, /\bdrill\b/i] },
  { key: 'free', label: '자유형', color: 'free', matchers: [/자유형/, /프리/, /freestyle/i, /\bfree\b/] },
]

const STROKE_ORDER = ['free', 'breast', 'back', 'fly', 'im', 'drill']

/** 한 줄에서 영법 키를 찾는다. 없으면 null. */
function detectStroke(line) {
  for (const def of STROKE_DEFS) {
    if (def.matchers.some((re) => re.test(line))) return def.key
  }
  return null
}

/** "1:23:45" / "1:52" / "52" 형태의 시간을 초로 변환. */
function timeToSec(token) {
  const parts = token.split(':').map((p) => Number(p))
  if (parts.some((n) => Number.isNaN(n))) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 1) return parts[0]
  return null
}

/** 한 줄에서 거리(m)를 추출. "100 m", "100m", "1.5 km", "1,500 m" 등 대응. */
function extractDistance(line) {
  const km = line.match(/(\d+(?:[.,]\d+)?)\s*km/i)
  if (km) return Math.round(parseFloat(km[1].replace(',', '.')) * 1000)
  const m = line.match(/(\d[\d,]*)\s*m(?![a-zA-Z])/i)
  if (m) return parseInt(m[1].replace(/,/g, ''), 10)
  return null
}

/** 한 줄에서 심박수(bpm)를 추출. 키워드 우선, 없으면 휴리스틱. */
function extractHr(line) {
  // '심박수', 'bpm', 'Avg HR', 'HR' 키워드 주변 숫자 우선
  const labeled =
    line.match(/(?:평균\s*)?심박수?\D{0,4}(\d{2,3})/i) ||
    line.match(/(\d{2,3})\s*bpm/i) ||
    line.match(/(?:avg\s*)?hr\D{0,4}(\d{2,3})/i)
  if (labeled) {
    const v = parseInt(labeled[1], 10)
    if (v >= 40 && v <= 230) return v
  }
  // 휴리스틱: 시간/거리 토큰을 제거한 뒤 심박수 범위(80~210)의 정수 후보
  const cleaned = line
    .replace(/\d+(?:[.,]\d+)?\s*km/gi, ' ')
    .replace(/\d[\d,]*\s*m(?![a-zA-Z])/gi, ' ')
    .replace(/\d{1,2}:\d{2}(?::\d{2})?/g, ' ')
  const nums = (cleaned.match(/\b\d{2,3}\b/g) || [])
    .map((n) => parseInt(n, 10))
    .filter((n) => n >= 80 && n <= 210)
  return nums.length ? nums[0] : null
}

/**
 * 가민 인터벌 표 텍스트 파싱.
 * @param {string} text
 * @returns {{ strokes: StrokeStat[], totalDistance: number, totalTimeSec: number, lapCount: number, matched: boolean }}
 */
export function parseIntervals(text) {
  const empty = { strokes: [], totalDistance: 0, totalTimeSec: 0, lapCount: 0, matched: false }
  if (!text || !text.trim()) return empty

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  /** @type {Record<string, { distance: number, timeSec: number, hrWeighted: number, hrDist: number, laps: number }>} */
  const acc = {}
  let lapCount = 0

  for (const line of lines) {
    const strokeKey = detectStroke(line)
    if (!strokeKey) continue

    const distance = extractDistance(line)
    // 시간 토큰들: 거리 제거 후 첫 번째 시간을 랩 시간으로 사용
    const withoutDist = line.replace(/\d[\d,]*\s*m(?![a-zA-Z])/gi, ' ').replace(/\d+(?:[.,]\d+)?\s*km/gi, ' ')
    const timeTokens = withoutDist.match(/\d{1,2}:\d{2}(?::\d{2})?/g) || []
    const timeSec = timeTokens.length ? timeToSec(timeTokens[0]) : null
    const hr = extractHr(line)

    // 거리도 시간도 없으면 헤더/잡음 줄로 간주하고 건너뜀
    if (distance == null && timeSec == null) continue

    if (!acc[strokeKey]) acc[strokeKey] = { distance: 0, timeSec: 0, hrWeighted: 0, hrDist: 0, laps: 0 }
    const a = acc[strokeKey]
    if (distance != null) a.distance += distance
    if (timeSec != null) a.timeSec += timeSec
    if (hr != null) {
      const w = distance != null ? distance : 1
      a.hrWeighted += hr * w
      a.hrDist += w
    }
    a.laps += 1
    lapCount += 1
  }

  const strokes = STROKE_ORDER.filter((k) => acc[k]).map((k) => {
    const def = STROKE_DEFS.find((d) => d.key === k)
    const a = acc[k]
    const paceSec = a.distance > 0 && a.timeSec > 0 ? (a.timeSec / a.distance) * 100 : 0
    const hr = a.hrDist > 0 ? Math.round(a.hrWeighted / a.hrDist) : 0
    return {
      key: k,
      label: def.label,
      color: def.color,
      distance: a.distance,
      timeSec: Math.round(a.timeSec),
      paceSec: Math.round(paceSec),
      hr,
      laps: a.laps,
    }
  })

  const totalDistance = strokes.reduce((s, x) => s + x.distance, 0)
  const totalTimeSec = strokes.reduce((s, x) => s + x.timeSec, 0)

  return { strokes, totalDistance, totalTimeSec, lapCount, matched: strokes.length > 0 }
}

/** 초 -> "h:mm:ss" 또는 "mm:ss" */
export function formatDuration(totalSec) {
  const sec = Math.max(0, Math.round(totalSec || 0))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/** 100m 당 초 -> "m:ss" (페이스) */
export function formatPace(paceSec) {
  const sec = Math.max(0, Math.round(paceSec || 0))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** "m:ss" 또는 "mm:ss" 문자열 -> 초 (편집 폼 입력 처리용) */
export function paceStrToSec(str) {
  if (!str) return 0
  return timeToSec(String(str).trim()) || 0
}

export const STROKE_COLOR_HEX = {
  free: '#4aa3f0',
  breast: '#3fce8b',
  back: '#b478f0',
  fly: '#f0a24a',
  im: '#f0604a',
  drill: '#e0c24a',
}
