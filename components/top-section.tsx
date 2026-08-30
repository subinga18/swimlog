'use client'

import { useState } from 'react'
import {
  ExternalLink,
  Link2,
  HelpCircle,
  X,
  MousePointerClick,
  Copy,
  ClipboardCheck,
} from 'lucide-react'

type Props = {
  garminUrl: string | null
  sharedTitle: string | null
}

export function TopSection({ garminUrl, sharedTitle }: Props) {
  const [guideOpen, setGuideOpen] = useState(false)

  return (
    <section className="rounded-2xl border border-border bg-card/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold">
          1
        </span>
        <h2 className="text-sm font-semibold">가민 링크 수신</h2>
      </div>

      {garminUrl ? (
        <div className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3">
          <Link2 size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            {sharedTitle && (
              <p className="truncate text-sm font-medium">{sharedTitle}</p>
            )}
            <p className="truncate text-xs text-muted-foreground">
              {garminUrl}
            </p>
          </div>
        </div>
      ) : (
        <p className="rounded-xl bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground">
          가민 커넥트 앱의 활동에서{' '}
          <span className="font-medium text-foreground">[공유하기]</span> →{' '}
          <span className="font-medium text-foreground">SwimCard</span> 를 선택하면
          링크가 여기로 전달돼요. 또는 아래에 표 텍스트를 바로 붙여넣어도 됩니다.
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={garminUrl || 'https://connect.garmin.com'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <ExternalLink size={14} />
          가민 열어 표 복사
        </a>
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-semibold transition-colors hover:bg-secondary"
        >
          <HelpCircle size={14} />
          복사 방법 보기
        </button>
      </div>

      {guideOpen && <CopyGuideDialog onClose={() => setGuideOpen(false)} />}
    </section>
  )
}

function CopyGuideDialog({ onClose }: { onClose: () => void }) {
  const steps = [
    {
      icon: ExternalLink,
      title: '가민 웹사이트 열기',
      desc: '위의 [가민 열어 표 복사] 버튼으로 활동 페이지를 엽니다.',
    },
    {
      icon: MousePointerClick,
      title: '인터벌 표 전체 드래그',
      desc: '랩(인터벌) 표의 첫 셀부터 마지막 셀까지 길게 눌러 전체를 드래그해 선택합니다.',
    },
    {
      icon: Copy,
      title: '복사하기',
      desc: '선택 영역을 복사(길게 눌러 복사 / Ctrl·Cmd+C)합니다.',
    },
    {
      icon: ClipboardCheck,
      title: '돌아와서 붙여넣기',
      desc: 'SwimCard 로 돌아와 아래 입력창의 [클립보드 붙여넣기]를 누르면 자동 집계됩니다.',
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="표 복사 방법 안내"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-border bg-card p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold">표 텍스트 복사하는 방법</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>
        <ol className="flex flex-col gap-3">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                <s.icon size={16} className="text-foreground" />
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {i + 1}. {s.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          알겠어요
        </button>
      </div>
    </div>
  )
}
