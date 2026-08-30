'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { toBlob } from 'html-to-image'
import { Share2, Square, RectangleVertical, Download, Loader2 } from 'lucide-react'
import { InstaCard, type CardFormat, type StrokeStat } from './insta-card'

type Props = {
  strokes: StrokeStat[]
  totalDistance: number
  totalTimeSec: number
  dateLabel: string
}

export function CardSection({
  strokes,
  totalDistance,
  totalTimeSec,
  dateLabel,
}: Props) {
  const [format, setFormat] = useState<CardFormat>('feed')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const cardRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  const hasData = strokes.length > 0 && totalDistance > 0

  const CARD_W = 360
  const cardH = format === 'story' ? 640 : 360

  // 미리보기 영역 너비에 맞춰 고정 크기 카드를 축소한다(내보내기 해상도는 유지).
  const measure = () => {
    const w = stageRef.current?.clientWidth ?? CARD_W
    setScale(Math.min(1, w / CARD_W))
  }
  useLayoutEffect(measure, [])
  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const capture = async () => {
    if (!cardRef.current) return null
    return toBlob(cardRef.current, {
      pixelRatio: 3,
      backgroundColor: '#000000',
      cacheBust: true,
    })
  }

  const handleShare = async () => {
    if (!hasData) return
    setBusy(true)
    setMsg(null)
    try {
      const blob = await capture()
      if (!blob) throw new Error('capture failed')
      const file = new File([blob], `swimcard-${format}.png`, {
        type: 'image/png',
      })

      if (
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: 'SwimCard',
          text: `오늘의 수영 ${totalDistance.toLocaleString()}m 🏊`,
        })
      } else {
        downloadBlob(blob, file.name)
        setMsg('시스템 공유를 지원하지 않아 이미지를 저장했어요. 인스타그램에 직접 올려주세요.')
      }
    } catch (e) {
      const err = e as Error
      if (err?.name !== 'AbortError') {
        setMsg('공유에 실패했어요. 다시 시도해 주세요.')
      }
    } finally {
      setBusy(false)
    }
  }

  const handleDownload = async () => {
    if (!hasData) return
    setBusy(true)
    setMsg(null)
    try {
      const blob = await capture()
      if (!blob) throw new Error('capture failed')
      downloadBlob(blob, `swimcard-${format}.png`)
    } catch {
      setMsg('이미지 저장에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold">
          3
        </span>
        <h2 className="text-sm font-semibold">감성 카드 & 공유</h2>
      </div>

      {/* 포맷 토글 */}
      <div className="mb-4 flex gap-1 rounded-xl bg-secondary/60 p-1">
        <FormatButton
          active={format === 'feed'}
          onClick={() => setFormat('feed')}
          icon={Square}
          label="피드 1:1"
        />
        <FormatButton
          active={format === 'story'}
          onClick={() => setFormat('story')}
          icon={RectangleVertical}
          label="스토리 9:16"
        />
      </div>

      {/* 미리보기 */}
      <div
        ref={stageRef}
        className="flex justify-center overflow-hidden rounded-2xl bg-background/60 p-4"
      >
        {hasData ? (
          <div
            style={{
              width: CARD_W * scale,
              height: cardH * scale,
            }}
          >
            <div
              className="overflow-hidden rounded-2xl"
              style={{
                width: CARD_W,
                height: cardH,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                boxShadow: '0 20px 60px -15px rgba(0,0,0,0.9)',
              }}
            >
              <InstaCard
                ref={cardRef}
                strokes={strokes}
                totalDistance={totalDistance}
                totalTimeSec={totalTimeSec}
                format={format}
                dateLabel={dateLabel}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-center text-sm text-muted-foreground">
            데이터를 입력하면
            <br />
            카드 미리보기가 나타나요.
          </div>
        )}
      </div>

      {/* 액션 */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleShare}
          disabled={!hasData || busy}
          className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {busy ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Share2 size={16} />
          )}
          인스타그램 공유하기
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={!hasData || busy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-3 text-sm font-semibold transition-colors hover:bg-secondary disabled:opacity-40"
        >
          <Download size={15} />
          저장
        </button>
      </div>
      {msg && (
        <p className="mt-2 text-center text-xs text-muted-foreground">{msg}</p>
      )}
    </section>
  )
}

function FormatButton({
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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
