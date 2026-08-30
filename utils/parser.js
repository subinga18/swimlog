// utils/parser.js
// 가민 커넥트 수영 인터벌 표 텍스트를 파싱해 "인터벌(랩) 단위"로 추출한 뒤
// 영법별로 집계한다. 표의 맨 윗줄(헤더: 인터벌/수영/거리/시간/평균 페이스/평균 심박 ...)은
// 자동으로 인식해 제거하며, 영법으로 취급하지 않는다.

/**
 * @typedef {Object} Interval
 * @property {string} id        - 고유 id
 * @property {string} strokeKey - 영법 키 (free, breast, back, fly, im, drill)
 * @property {string} label     - 영법 표시 이름
 * @property {string} color     - 테마 컬러 토큰 키
 * @property {number} distance  - 거리 (m)
 * @property {string} timeStr   - 소요 시간 문자열 ("mm:ss" / "0:39.2" 등, 편집 가능)
 * @property {number} hr        - 평균 심박수 (bpm), 없으면 0
 */

// 영법 정의. matchers 순서가 중요하다(더 구체적인 것을 먼저 검사).
export const STROKE_DEFS = [
  { key: 'im', label: '혼영', color: 'im', matchers: [/개인\s*혼영/, /혼영/, /individual\s*medley/i, /\bIM\b/, /medley/i] },
  { key: 'fly', label: '접영', color: 'fly', matchers: [/접영/, /butterfly/i, /\bfly\b/i] },
  { key: 'back', label: '배영', color: 'back', matchers: [/배영/, /backstroke/i, /\bback\b/i] },
  { key: 'breast', label: '평영', color: 'breast', matchers: [/평영/, /breaststroke/i, /\bbreast\b/i] },
  { key: 'drill', label: '드릴/킥', color: 'drill', matchers: [/드릴/, /킥/, /\bkick\b/i, /\bdrill\b/i] },
  { key: 'free', label: '자유형', color: 'free', matchers: [/자유형/, /프리\s*스타일/, /freestyle/i, /\bfree\b/i] },
]

const STROKE_ORDER = ['free', 'breast', 'back', 'fly', 'im', 'drill']

// 편집 UI 등에서 사용할 영법 정렬 순서(공개용).
export const STROKE_ORDER_KEYS = STROKE_ORDER

export const STROKE_COLOR_HEX = {
  free: '#4aa3f0',
  breast: '#3fce8b',
  back: '#b478f0',
  fly: '#f0a24a',
  im: '#f0604a',
  drill: '#e0c24a',
}

export function strokeDef(key) {
  return STROKE_DEFS.find((d) => d.key === key)
}

/** 문자열에서 영법 키를 찾는다. 없으면 null. */
function detectStroke(text) {
  if (!text) return null
  for (const def of STROKE_DEFS) {
    if (def.matchers.some((re) => re.test(text))) return def.key
  }
  return null
}

/** "1:23:45" / "1:52" / "0:39.2" / "52" 형태의 시간을 초로 변환. */
export function timeToSec(token) {
  if (token == null) return null
  const t = String(token).trim()
  if (!/[\d]/.test(t)) return null
  const clean = t.match(/\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?|\d+(?:\.\d+)?/)
  if (!clean) return null
  const parts = clean[0].split(':').map((p) => Number(p))
  if (parts.some((n) => Number.isNaN(n))) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 1) return parts[0]
  return null
}

/** 셀/문자열에서 거리(m)를 추출. "100 m", "725", "1.5 km", "1,500 m" 등 대응. */
function parseDistanceCell(cell) {
  if (cell == null) return null
  const s = String(cell)
  const km = s.match(/(\d+(?:[.,]\d+)?)\s*km/i)
  if (km) return Math.round(parseFloat(km[1].replace(',', '.')) * 1000)
  const m = s.match(/(\d[\d,]*(?:\.\d+)?)\s*m\b/i)
  if (m) return Math.round(parseFloat(m[1].replace(/,/g, '')))
  const plain = s.match(/\d[\d,]*(?:\.\d+)?/)
  if (plain) return Math.round(parseFloat(plain[0].replace(/,/g, '')))
  return null
}

/** 셀/문자열에서 심박수(bpm)를 추출. 40~230 범위만 허용. */
function parseHrCell(cell) {
  if (cell == null) return 0
  const m = String(cell).match(/\d{2,3}/)
  if (!m) return 0
  const v = parseInt(m[0], 10)
  return v >= 40 && v <= 230 ? v : 0
}

// ── 헤더(표의 맨 윗줄) 인식용 컬럼 정의 ───────────────────────────
// 순서 중요: 더 구체적인 컬럼을 먼저 검사한다(예: '누적 시간'을 '시간'보다 먼저).
const HEADER_FIELDS = [
  ['index', [/인터벌/, /^lap$/i, /interval/i, /^#$/, /^번호$/, /^구간$/]],
  ['stroke', [/영법/, /^수영$/, /스트로크\s*타입/, /stroke\s*type/i, /^type$/i, /^stroke$/i]],
  ['strokeLen', [/스트로크\s*길이/, /stroke\s*length/i]],
  ['distance', [/거리/, /distance/i, /^dist/i]],
  ['cumTime', [/누적/, /cumulative/i, /elapsed/i, /경과/]],
  ['maxPace', [/최대\s*페이스/, /max\.?\s*pace/i, /best\s*pace/i]],
  ['avgPace', [/평균\s*페이스/, /avg\.?\s*pace/i, /^페이스$/, /^pace$/i]],
  ['maxHr', [/최대\s*심박/, /max\.?\s*hr/i]],
  ['avgHr', [/평균\s*심박/, /avg\.?\s*hr/i, /^심박수?$/, /\bbpm\b/i, /심박/]],
  ['avgSwolf', [/swolf/i]],
  ['totalStroke', [/총\s*스트로크/, /total\s*stroke/i]],
  ['avgStroke', [/평균\s*스트로크/, /avg\.?\s*stroke/i, /스트로크/]],
  ['calories', [/칼로리/, /calorie/i, /kcal/i]],
  ['time', [/시간/, /^time$/i, /무브|moving/i]],
]

/** 한 셀이 어떤 헤더 필드인지 판정. */
function cellToField(cell) {
  for (const [field, res] of HEADER_FIELDS) {
    if (res.some((re) => re.test(cell))) return field
  }
  return null
}

/** 한 줄을 셀 배열로 분리. 탭 → 2칸 이상 공백 순으로 시도. */
function splitCells(line) {
  if (line.includes('\t')) return line.split('\t').map((c) => c.trim())
  const bySpaces = line.split(/ {2,}/).map((c) => c.trim()).filter(Boolean)
  if (bySpaces.length > 1) return bySpaces
  return [line.trim()]
}

/** 셀 배열이 헤더 행인지 판정: 영법 값이 하나도 없고 헤더 키워드가 2개 이상. */
function isHeaderRow(cells) {
  if (cells.some((c) => detectStroke(c))) return false
  let hits = 0
  for (const c of cells) if (cellToField(c)) hits++
  return hits >= 2
}

let _idSeq = 0
function nextId() {
  _idSeq += 1
  return `iv-${_idSeq}`
}

function makeInterval(strokeKey, distance, timeStr, hr) {
  const def = strokeDef(strokeKey)
  return {
    id: nextId(),
    strokeKey,
    label: def ? def.label : strokeKey,
    color: def ? def.color : 'free',
    distance: distance || 0,
    timeStr: timeStr || '',
    hr: hr || 0,
  }
}

/** 컬럼(헤더) 기반 파싱. 성공 시 Interval[] 반환, 실패 시 null. */
function parseByColumns(lines) {
  let headerIdx = -1
  let colMap = null
  for (let i = 0; i < lines.length; i++) {
    const cells = splitCells(lines[i])
    if (cells.length < 2) continue
    if (isHeaderRow(cells)) {
      const map = {}
      cells.forEach((c, idx) => {
        const f = cellToField(c)
        if (f && map[f] == null) map[f] = idx
      })
      if (map.stroke != null && (map.distance != null || map.time != null)) {
        headerIdx = i
        colMap = map
        break
      }
    }
  }
  if (!colMap) return null

  const intervals = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cells = splitCells(lines[i])
    if (cells.length < 2) continue
    const strokeKey =
      detectStroke(cells[colMap.stroke]) || detectStroke(lines[i])
    if (!strokeKey) continue
    const distance =
      colMap.distance != null ? parseDistanceCell(cells[colMap.distance]) : null
    const timeRaw = colMap.time != null ? cells[colMap.time] : ''
    const timeStr = timeToSec(timeRaw) != null ? String(timeRaw).trim() : ''
    const hr = colMap.avgHr != null ? parseHrCell(cells[colMap.avgHr]) : 0
    if (distance == null && !timeStr) continue
    intervals.push(makeInterval(strokeKey, distance ?? 0, timeStr, hr))
  }
  return intervals.length ? intervals : null
}

/** 휴리스틱(줄 단위) 파싱. 헤더 줄은 영법이 없어 자연히 제외된다. */
function parseByLines(lines) {
  const intervals = []
  for (const line of lines) {
    const strokeKey = detectStroke(line)
    if (!strokeKey) continue

    const km = line.match(/\d+(?:[.,]\d+)?\s*km/i)
    const mm = line.match(/\d[\d,]*\s*m(?![a-zA-Z])/i)
    const distance = km
      ? parseDistanceCell(km[0])
      : mm
        ? parseDistanceCell(mm[0])
        : null

    const withoutDist = line
      .replace(/\d[\d,]*\s*m(?![a-zA-Z])/gi, ' ')
      .replace(/\d+(?:[.,]\d+)?\s*km/gi, ' ')
    const timeTokens = withoutDist.match(/\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?/g) || []
    const timeStr = timeTokens.length ? timeTokens[0] : ''

    const labeled =
      line.match(/(?:평균\s*)?심박수?\D{0,4}(\d{2,3})/i) ||
      line.match(/(\d{2,3})\s*bpm/i) ||
      line.match(/(?:avg\s*)?hr\D{0,4}(\d{2,3})/i)
    let hr = 0
    if (labeled) hr = parseHrCell(labeled[1])
    if (!hr) {
      const cleaned = withoutDist.replace(/\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?/g, ' ')
      const nums = (cleaned.match(/\b\d{2,3}\b/g) || [])
        .map((n) => parseInt(n, 10))
        .filter((n) => n >= 80 && n <= 210)
      hr = nums.length ? nums[0] : 0
    }

    if (distance == null && !timeStr) continue
    intervals.push(makeInterval(strokeKey, distance ?? 0, timeStr, hr))
  }
  return intervals
}

/**
 * 가민 인터벌 표 텍스트 파싱.
 * @param {string} text
 * @returns {{ intervals: Interval[], matched: boolean, mode: 'column' | 'line' | 'none' }}
 */
export function parseIntervals(text) {
  if (!text || !text.trim()) return { intervals: [], matched: false, mode: 'none' }

  let normalized = text

  // 줄바꿈/탭이 전혀 없이 한 줄로 붙여넣어진 경우, 인터벌 경계(숫자+영법) 앞에서 줄을 나눠 본다.
  if (!/\r?\n/.test(normalized) && !/\t/.test(normalized)) {
    normalized = normalized.replace(
      /(?=\d+\s*(?:개인\s*혼영|혼영|평영|배영|접영|자유형|드릴|킥))/g,
      '\n',
    )
  }

  const lines = normalized
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const byColumns = parseByColumns(lines)
  if (byColumns) return { intervals: byColumns, matched: true, mode: 'column' }

  const byLines = parseByLines(lines)
  return {
    intervals: byLines,
    matched: byLines.length > 0,
    mode: byLines.length > 0 ? 'line' : 'none',
  }
}

/**
 * Interval[] → 영법별 집계.
 * @param {Interval[]} intervals
 */
export function aggregate(intervals) {
  const acc = {}
  for (const it of intervals || []) {
    const k = it.strokeKey
    if (!acc[k]) acc[k] = { distance: 0, timeSec: 0, hrW: 0, hrD: 0, laps: 0 }
    const a = acc[k]
    const dist = Number(it.distance) || 0
    const timeSec = timeToSec(it.timeStr) || 0
    a.distance += dist
    a.timeSec += timeSec
    if (it.hr > 0) {
      const w = dist > 0 ? dist : 1
      a.hrW += it.hr * w
      a.hrD += w
    }
    a.laps += 1
  }

  const strokes = STROKE_ORDER.filter((k) => acc[k]).map((k) => {
    const def = strokeDef(k)
    const a = acc[k]
    const paceSec = a.distance > 0 && a.timeSec > 0 ? (a.timeSec / a.distance) * 100 : 0
    return {
      key: k,
      label: def.label,
      color: def.color,
      distance: a.distance,
      timeSec: Math.round(a.timeSec),
      paceSec: Math.round(paceSec),
      hr: a.hrD > 0 ? Math.round(a.hrW / a.hrD) : 0,
      laps: a.laps,
    }
  })

  const totalDistance = strokes.reduce((s, x) => s + x.distance, 0)
  const totalTimeSec = strokes.reduce((s, x) => s + x.timeSec, 0)
  return { strokes, totalDistance, totalTimeSec }
}

/** 새 인터벌 하나 생성(수동 추가용). */
export function createInterval(strokeKey) {
  return makeInterval(strokeKey, 0, '', 0)
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

/** 거리(m)와 시간 문자열로 100m 당 페이스(초) 계산. */
export function paceFromInterval(distance, timeStr) {
  const d = Number(distance) || 0
  const t = timeToSec(timeStr) || 0
  return d > 0 && t > 0 ? (t / d) * 100 : 0
}
