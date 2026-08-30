'use client'

import { useState } from 'react'
import { ClipboardPaste, ListChecks, SlidersHorizontal, Waves } from 'lucide-react'
import { StrokeEditor, type EditableStroke } from './stroke-editor'
import { STROKE_COLOR_HEX } from '@/utils/parser'

const HEX: Record<string, string> = STROKE_COLOR_HEX

type Props = {
  rawText: string
  onRawText: (v: string) => void
  strokes: EditableStroke[]
  onStrokesChange: (s: EditableStroke[]) => void
  matched: boolean
}

export function BottomSection({
  rawText,
  onRawText,
  strokes,
  onStrokesChange,
  matched,
}: Props) {
  const [tab, setTab] = useState<'summary' | 'edit'>('summary')
  const [pasteMsg, setPasteMsg] = useState<string | null>(null)

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text && text.trim()) {
        onRawText(text)
        setPasteMsg(null)
      } else {
        setPasteMsg('클립보드가 비어 있어요.')
      }
    } catch {
      setPasteMsg('클립보드 접근이 차단됐어요. 직접 붙여넣어 주세요.')
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold">
          2
        </span>
        <h2 className="text-sm font-semibold">인터벌 표 붙여넣기</h2>
      </div>

      <textarea
        value={rawText}
        onChange={(e) => onRawText(e.target.value)}
        placeholder={
          '가민 인터벌 표 텍스트를 여기에 붙여넣으세요.\n예)\n1  100m  1:52  자유형  145 bpm\n2  100m  2:10  평영    138 bpm'
        }
        rows={5}
        className="w-full resize-y rounded-xl border border-border bg-background p-3 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-ring"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      />

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={handlePaste}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <ClipboardPaste size={14} />
          클립보드 자동 붙여넣기
        </button>
        {rawText && (
          <button
            type="button"
            onClick={() => onRawText('')}
            className="rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            지우기
          </button>
        )}
      </div>
      {pasteMsg && (
        <p className="mt-2 text-xs text-destructive">{pasteMsg}</p>
      )}

      {/* 상태 배지 */}
      <div className="mt-3 flex items-center gap-2 text-xs">
        <Waves size={13} className="text-muted-foreground" />
        {rawText ? (
          matched ? (
            <span className="text-muted-foreground">
              {strokes.length}개 영법을 인식했어요. 수치는 아래 탭에서 수정할 수 있어요.
            </span>
          ) : (
            <span className="text-destructive">
              영법을 인식하지 못했어요. [직접 수정] 탭에서 값을 입력하세요.
            </span>
          )
        ) : (
          <span className="text-muted-foreground">
            표를 붙여넣으면 자동으로 집계됩니다.
          </span>
        )}
      </div>

      {/* 서브 탭 */}
      <div className="mt-4 flex gap-1 rounded-xl bg-secondary/60 p-1">
        <TabButton
          active={tab === 'summary'}
          onClick={() => setTab('summary')}
          icon={ListChecks}
          label="자동 집계"
        />
        <TabButton
          active={tab === 'edit'}
          onClick={() => setTab('edit')}
          icon={SlidersHorizontal}
          label="직접 수정"
        />
      </div>

      <div className="mt-3">
        {tab === 'summary' ? (
          <SummaryView strokes={strokes} />
        ) : (
          <StrokeEditor strokes={strokes} onChange={onStrokesChange} />
        )}
      </div>
    </section>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ size?: number }>
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  )
}

function SummaryView({ strokes }: { strokes: EditableStroke[] }) {
  if (strokes.length === 0) {
    return (
      <p className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
        아직 집계된 데이터가 없어요.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      {strokes.map((s) => (
        <div
          key={s.key}
          className="flex items-center gap-3 rounded-xl bg-secondary/40 p-3"
        >
          <span
            className="h-8 w-1 rounded-full"
            style={{ backgroundColor: HEX[s.color] }}
            aria-hidden
          />
          <span className="w-14 text-sm font-semibold">{s.label}</span>
          <div className="ml-auto flex items-center gap-4 text-right text-xs">
            <Cell label="거리" value={`${s.distance.toLocaleString()}m`} />
            <Cell label="페이스" value={s.paceStr} />
            <Cell
              label="심박"
              value={s.hr > 0 ? `${s.hr}` : '—'}
              highlight={HEX[s.color]}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function Cell({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: string
}) {
  return (
    <div className="min-w-12">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div
        className="text-sm font-semibold tabular-nums"
        style={highlight ? { color: highlight } : undefined}
      >
        {value}
      </div>
    </div>
  )
}
