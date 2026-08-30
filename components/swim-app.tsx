'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Waves } from 'lucide-react'
import { TopSection } from './top-section'
import { BottomSection } from './bottom-section'
import { CardSection } from './card-section'
import type { EditableStroke } from './stroke-editor'
import type { StrokeStat } from './insta-card'
import { parseIntervals, formatPace, paceStrToSec } from '@/utils/parser'

type Props = {
  initialUrl: string | null
  initialText: string | null
  initialTitle: string | null
}

export function SwimApp({ initialUrl, initialText, initialTitle }: Props) {
  const [rawText, setRawText] = useState(initialText ?? '')
  const [editable, setEditable] = useState<EditableStroke[]>([])
  const lastSig = useRef<string>('__init__')

  const parsed = useMemo(() => parseIntervals(rawText), [rawText])

  // 원문이 바뀌면 파싱 결과로 편집 상태를 리셋한다(수동 수정은 유지되지 않음).
  useEffect(() => {
    if (lastSig.current === rawText) return
    lastSig.current = rawText
    setEditable(
      parsed.strokes.map((s) => ({
        key: s.key,
        label: s.label,
        color: s.color,
        distance: s.distance,
        paceStr: formatPace(s.paceSec),
        hr: s.hr,
      })),
    )
  }, [rawText, parsed])

  // 편집 상태 -> 카드용 통계로 변환
  const { cardStrokes, totalDistance, totalTimeSec } = useMemo(() => {
    const list: StrokeStat[] = editable
      .filter((s) => s.distance > 0)
      .map((s) => {
        const paceSec = paceStrToSec(s.paceStr)
        const timeSec = Math.round((paceSec / 100) * s.distance)
        return {
          key: s.key,
          label: s.label,
          color: s.color,
          distance: s.distance,
          paceSec,
          timeSec,
          hr: s.hr,
          laps: 0,
        }
      })
    return {
      cardStrokes: list,
      totalDistance: list.reduce((a, s) => a + s.distance, 0),
      totalTimeSec: list.reduce((a, s) => a + s.timeSec, 0),
    }
  }, [editable])

  const dateLabel = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
      d.getDate(),
    ).padStart(2, '0')}`
  }, [])

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-10 pt-6">
      <header className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Waves size={18} strokeWidth={2.4} />
        </span>
        <div>
          <h1 className="text-lg font-bold leading-tight">SwimCard</h1>
          <p className="text-xs text-muted-foreground">
            가민 수영 기록 · 인스타 감성 카드
          </p>
        </div>
      </header>

      <TopSection garminUrl={initialUrl} sharedTitle={initialTitle} />

      <BottomSection
        rawText={rawText}
        onRawText={setRawText}
        strokes={editable}
        onStrokesChange={setEditable}
        matched={parsed.matched}
      />

      <CardSection
        strokes={cardStrokes}
        totalDistance={totalDistance}
        totalTimeSec={totalTimeSec}
        dateLabel={dateLabel}
      />

      <footer className="pt-2 text-center text-[11px] text-muted-foreground/70">
        홈 화면에 추가하면 가민 [공유하기] 목록에 SwimCard가 나타납니다.
      </footer>
    </main>
  )
}
