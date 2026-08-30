'use client'

import { useState } from 'react'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import {
  STROKE_DEFS,
  STROKE_COLOR_HEX,
  STROKE_ORDER_KEYS,
  aggregate,
  createInterval,
  formatPace,
  paceFromInterval,
} from '@/utils/parser'

export type Interval = {
  id: string
  strokeKey: string
  label: string
  color: string
  distance: number
  timeStr: string
  hr: number
}

const HEX: Record<string, string> = STROKE_COLOR_HEX

type Props = {
  intervals: Interval[]
  onChange: (next: Interval[]) => void
}

/**
 * 직접 수정 탭.
 * - 영법별로 접힌 카드(총거리/페이스/심박)를 보여주고,
 * - 카드를 클릭하면 그 영법에 속한 인터벌(랩)이 펼쳐져 개별 수정/삭제가 가능하다.
 */
export function StrokeEditor({ intervals, onChange }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const usedKeys = new Set(intervals.map((s) => s.strokeKey))
  const available = STROKE_DEFS.filter((d) => !usedKeys.has(d.key))
  const { strokes } = aggregate(intervals)

  const groupKeys = STROKE_ORDER_KEYS.filter((k) => usedKeys.has(k))

  const patch = (id: string, p: Partial<Interval>) =>
    onChange(intervals.map((it) => (it.id === id ? { ...it, ...p } : it)))
  const removeInterval = (id: string) =>
    onChange(intervals.filter((it) => it.id !== id))
  const removeStroke = (key: string) =>
    onChange(intervals.filter((it) => it.strokeKey !== key))
  const addInterval = (key: string) => {
    setOpen((o) => ({ ...o, [key]: true }))
    onChange([...intervals, createInterval(key)])
  }
  const addStroke = (key: string) => {
    setOpen((o) => ({ ...o, [key]: true }))
    onChange([...intervals, createInterval(key)])
  }

  return (
    <div className="flex flex-col gap-3">
      {intervals.length === 0 && (
        <p className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          아직 데이터가 없어요. 표를 붙여넣거나 아래에서 영법을 직접 추가하세요.
        </p>
      )}

      {groupKeys.map((key) => {
        const agg = strokes.find((s) => s.key === key)
        const rows = intervals.filter((it) => it.strokeKey === key)
        const isOpen = !!open[key]
        const c = HEX[agg?.color ?? 'free']
        return (
          <div
            key={key}
            className="overflow-hidden rounded-xl border border-border bg-card/60"
          >
            {/* 접힌 요약 헤더 (클릭 시 펼침) */}
            <div className="flex items-center gap-2 p-3">
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}
                className="flex flex-1 items-center gap-3 text-left"
                aria-expanded={isOpen}
              >
                <span
                  className="h-8 w-1 rounded-full"
                  style={{ backgroundColor: c }}
                  aria-hidden
                />
                <span className="w-14 text-sm font-semibold">
                  {agg?.label}
                </span>
                <span className="ml-1 shrink-0 whitespace-nowrap rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {rows.length}구간
                </span>
                <div className="ml-auto flex items-center gap-3 text-right text-xs">
                  <MiniCell
                    label="거리"
                    value={`${(agg?.distance ?? 0).toLocaleString()}m`}
                  />
                  <MiniCell
                    label="페이스"
                    value={agg && agg.paceSec > 0 ? formatPace(agg.paceSec) : '—'}
                  />
                  <MiniCell
                    label="심박"
                    value={agg && agg.hr > 0 ? `${agg.hr}` : '—'}
                    color={c}
                  />
                </div>
                <ChevronDown
                  size={16}
                  className="ml-1 text-muted-foreground transition-transform"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
                />
              </button>
              <button
                type="button"
                onClick={() => removeStroke(key)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                aria-label={`${agg?.label} 전체 삭제`}
              >
                <Trash2 size={15} />
              </button>
            </div>

            {/* 펼친 인터벌 목록 */}
            {isOpen && (
              <div className="flex flex-col gap-2 border-t border-border bg-background/40 p-3">
                {rows.map((it, idx) => (
                  <div
                    key={it.id}
                    className="rounded-lg border border-border/70 bg-card/70 p-2.5"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        구간 {idx + 1}
                        <span className="ml-2 font-normal text-muted-foreground/70">
                          {paceLabel(it)}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeInterval(it.id)}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                        aria-label="이 구간 삭제"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Field label="거리 (m)">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={it.distance || ''}
                          onChange={(e) =>
                            patch(it.id, { distance: Number(e.target.value) || 0 })
                          }
                          className="ed-input"
                          placeholder="0"
                        />
                      </Field>
                      <Field label="시간 (mm:ss)">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={it.timeStr}
                          onChange={(e) => patch(it.id, { timeStr: e.target.value })}
                          className="ed-input"
                          placeholder="1:52"
                        />
                      </Field>
                      <Field label="심박 (bpm)">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={230}
                          value={it.hr || ''}
                          onChange={(e) =>
                            patch(it.id, { hr: Number(e.target.value) || 0 })
                          }
                          className="ed-input"
                          placeholder="0"
                        />
                      </Field>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addInterval(key)}
                  className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Plus size={13} />
                  구간 추가
                </button>
              </div>
            )}
          </div>
        )
      })}

      {available.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="w-full text-[11px] font-medium text-muted-foreground">
            영법 추가
          </span>
          {available.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => addStroke(d.key)}
              className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus size={13} />
              {d.label}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .ed-input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--border);
          background-color: var(--background);
          padding: 0.5rem 0.6rem;
          font-size: 0.875rem;
          color: var(--foreground);
          font-variant-numeric: tabular-nums;
          outline: none;
        }
        .ed-input:focus {
          border-color: var(--ring);
        }
      `}</style>
    </div>
  )
}

function paceLabel(it: Interval) {
  const pace = paceFromInterval(it.distance, it.timeStr)
  return pace > 0 ? `${formatPace(pace)} /100m` : ''
}

function MiniCell({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="min-w-12">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div
        className="text-sm font-semibold tabular-nums"
        style={color ? { color } : undefined}
      >
        {value}
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  )
}
