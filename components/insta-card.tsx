'use client'

import { forwardRef } from 'react'
import { Waves } from 'lucide-react'
import {
  formatDuration,
  formatPace,
  STROKE_COLOR_HEX,
} from '@/utils/parser'

export type StrokeStat = {
  key: string
  label: string
  color: string
  distance: number
  timeSec: number
  paceSec: number
  hr: number
  laps: number
}

export type CardFormat = 'feed' | 'story'

type Props = {
  strokes: StrokeStat[]
  totalDistance: number
  totalTimeSec: number
  format: CardFormat
  dateLabel: string
}

const HEX: Record<string, string> = STROKE_COLOR_HEX

/**
 * 애플 건강 앱 스타일의 다크 감성 카드.
 * 내보내기 안정성을 위해 색상은 인라인 hex 로 지정한다.
 */
export const InstaCard = forwardRef<HTMLDivElement, Props>(function InstaCard(
  { strokes, totalDistance, totalTimeSec, format, dateLabel },
  ref,
) {
  const isStory = format === 'story'
  const width = 360
  const height = isStory ? 640 : 360

  const avgHr =
    strokes.filter((s) => s.hr > 0).length > 0
      ? Math.round(
          strokes.reduce((sum, s) => sum + s.hr * s.distance, 0) /
            strokes.reduce((sum, s) => sum + (s.hr > 0 ? s.distance : 0), 0),
        )
      : 0

  return (
    <div
      ref={ref}
      style={{
        width,
        height,
        backgroundColor: '#000000',
        color: '#ffffff',
        fontFamily:
          'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        padding: isStory ? '40px 32px' : '28px 26px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage:
          'radial-gradient(120% 80% at 100% 0%, rgba(74,163,240,0.18) 0%, rgba(0,0,0,0) 55%)',
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              backgroundColor: 'rgba(74,163,240,0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Waves size={15} color={HEX.free} strokeWidth={2.4} />
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.14em',
              color: '#8e8e93',
            }}
          >
            SWIM
          </span>
        </div>
        <span style={{ fontSize: 12, color: '#8e8e93', fontWeight: 500 }}>
          {dateLabel}
        </span>
      </div>

      {/* 총합 히어로 */}
      <div style={{ marginTop: isStory ? 44 : 22 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: isStory ? 72 : 58,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: HEX.free,
            }}
          >
            {totalDistance.toLocaleString()}
          </span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: '#8e8e93',
            }}
          >
            m
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 22,
            marginTop: 16,
          }}
        >
          <Metric label="총 시간" value={formatDuration(totalTimeSec)} />
          <Metric
            label="평균 심박"
            value={avgHr > 0 ? `${avgHr}` : '—'}
            unit={avgHr > 0 ? 'bpm' : ''}
            accent="#f0604a"
          />
          <Metric label="영법" value={`${strokes.length}`} unit="종" />
        </div>
      </div>

      {/* 영법별 블록 */}
      <div
        style={{
          marginTop: isStory ? 40 : 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flex: 1,
        }}
      >
        {strokes.map((s) => {
          const c = HEX[s.color] || HEX.free
          return (
            <div
              key={s.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 16,
                padding: isStory ? '14px 16px' : '11px 14px',
              }}
            >
              <div
                style={{
                  width: 4,
                  alignSelf: 'stretch',
                  minHeight: 34,
                  borderRadius: 999,
                  backgroundColor: c,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#ffffff',
                  }}
                >
                  {s.label}
                </div>
                <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 2 }}>
                  {s.distance.toLocaleString()}m
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 64 }}>
                <div style={{ fontSize: 10, color: '#8e8e93' }}>페이스</div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#ffffff',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {s.paceSec > 0 ? `${formatPace(s.paceSec)}` : '—'}
                  <span style={{ fontSize: 9, color: '#8e8e93' }}>/100m</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 52 }}>
                <div style={{ fontSize: 10, color: '#8e8e93' }}>심박</div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: s.hr > 0 ? c : '#8e8e93',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {s.hr > 0 ? s.hr : '—'}
                  <span style={{ fontSize: 9, color: '#8e8e93' }}> bpm</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 푸터 */}
      <div
        style={{
          marginTop: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 10,
          color: '#5a5a5f',
        }}
      >
        <span>Garmin Connect</span>
        <span style={{ letterSpacing: '0.1em' }}>SWIMCARD</span>
      </div>
    </div>
  )
})

function Metric({
  label,
  value,
  unit = '',
  accent = '#ffffff',
}: {
  label: string
  value: string
  unit?: string
  accent?: string
}) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#8e8e93', fontWeight: 500 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: accent,
          marginTop: 3,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
        {unit && (
          <span style={{ fontSize: 12, color: '#8e8e93', fontWeight: 600 }}>
            {' '}
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}
