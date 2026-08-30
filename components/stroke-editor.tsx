'use client'

import { Plus, Trash2 } from 'lucide-react'
import { STROKE_DEFS, STROKE_COLOR_HEX } from '@/utils/parser'

export type EditableStroke = {
  key: string
  label: string
  color: string
  distance: number
  paceStr: string
  hr: number
}

const HEX: Record<string, string> = STROKE_COLOR_HEX

type Props = {
  strokes: EditableStroke[]
  onChange: (next: EditableStroke[]) => void
}

export function StrokeEditor({ strokes, onChange }: Props) {
  const usedKeys = new Set(strokes.map((s) => s.key))
  const available = STROKE_DEFS.filter((d) => !usedKeys.has(d.key))

  const update = (key: string, patch: Partial<EditableStroke>) => {
    onChange(strokes.map((s) => (s.key === key ? { ...s, ...patch } : s)))
  }
  const remove = (key: string) => onChange(strokes.filter((s) => s.key !== key))
  const add = (key: string) => {
    const def = STROKE_DEFS.find((d) => d.key === key)
    if (!def) return
    onChange([
      ...strokes,
      { key: def.key, label: def.label, color: def.color, distance: 0, paceStr: '0:00', hr: 0 },
    ])
  }

  return (
    <div className="flex flex-col gap-3">
      {strokes.length === 0 && (
        <p className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          아직 집계된 영법이 없어요. 표를 붙여넣거나 아래에서 영법을 직접 추가하세요.
        </p>
      )}

      {strokes.map((s) => (
        <div
          key={s.key}
          className="rounded-xl border border-border bg-card/60 p-3"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: HEX[s.color] }}
                aria-hidden
              />
              <span className="text-sm font-semibold">{s.label}</span>
            </div>
            <button
              type="button"
              onClick={() => remove(s.key)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
              aria-label={`${s.label} 삭제`}
            >
              <Trash2 size={15} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="거리 (m)">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={s.distance || ''}
                onChange={(e) =>
                  update(s.key, { distance: Number(e.target.value) || 0 })
                }
                className="input"
                placeholder="0"
              />
            </Field>
            <Field label="페이스 (/100m)">
              <input
                type="text"
                inputMode="numeric"
                value={s.paceStr}
                onChange={(e) => update(s.key, { paceStr: e.target.value })}
                className="input"
                placeholder="1:52"
              />
            </Field>
            <Field label="심박 (bpm)">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={230}
                value={s.hr || ''}
                onChange={(e) => update(s.key, { hr: Number(e.target.value) || 0 })}
                className="input"
                placeholder="0"
              />
            </Field>
          </div>
        </div>
      ))}

      {available.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {available.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => add(d.key)}
              className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus size={13} />
              {d.label}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .input {
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
        .input:focus {
          border-color: var(--ring);
        }
      `}</style>
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
