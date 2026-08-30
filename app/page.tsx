// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { parseGarminText, SwimSummary } from '@/lib/parser';
import { Share2, Copy, Edit3, Award, Heart, Flame } from 'lucide-react';

export default function SwimLogApp() {
  const [rawText, setRawText] = useState('');
  const [garminUrl, setGarminUrl] = useState('');
  const [summary, setSummary] = useState<SwimSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'paste' | 'manual'>('paste');

  // PWA Share Target으로 수신된 URL 처리 (?url=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sharedUrl = params.get('url') || params.get('text');
      if (sharedUrl) {
        setGarminUrl(sharedUrl);
      }
    }
  }, []);

  // 텍스트 변경 시 파싱 실행
  const handleTextChange = (text: string) => {
    setRawText(text);
    if (text.trim().length > 0) {
      const parsed = parseGarminText(text);
      setSummary(parsed);
    } else {
      setSummary(null);
    }
  };

  // 클립보드 자동 붙여넣기
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleTextChange(text);
    } catch (err) {
      alert('클립보드 접근 권한이 없거나 지원되지 않는 브라우저입니다. 직접 붙여넣어 주세요.');
    }
  };

  // 인스타 Web Share API 공유
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '오늘의 수영 기록 🏊‍♂️',
          text: `총 거리: ${summary?.totalDistance || 0}m | 시간: ${summary?.totalTimeDisplay || '0:00'} | 페이스: ${summary?.avgPace || "0'00\""}/100m`,
          url: window.location.href,
        });
      } catch (e) {
        console.log('공유 취소 또는 오류:', e);
      }
    } else {
      alert('이 브라우저는 웹 공유 기능을 지원하지 않습니다. 캡처 기능을 이용해 주세요.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 max-w-md mx-auto flex flex-col justify-between font-sans">
      {/* 헤더 */}
      <header className="py-4 border-b border-slate-800 text-center">
        <h1 className="text-xl font-bold tracking-tight text-cyan-400 flex items-center justify-center gap-2">
          🏊 SwimLog Garmin Card
        </h1>
        <p className="text-xs text-slate-400 mt-1">가민 기록을 감성 인스타 카드로 변환</p>
      </header>

      {/* 상단: 가민 공유 URL 수신 가이드 */}
      {garminUrl && (
        <section className="my-3 p-3 bg-slate-900 border border-cyan-500/30 rounded-xl text-xs">
          <p className="text-cyan-300 font-semibold mb-1">🔗 수신된 가민 링크:</p>
          <a href={garminUrl} target="_blank" rel="noreferrer" className="text-slate-300 underline truncate block">
            {garminUrl}
          </a>
          <p className="text-slate-400 mt-2">💡 링크 페이지 접속 후, [인터벌 표] 텍스트를 복사해 아래에 붙여넣어 주세요.</p>
        </section>
      )}

      {/* 탭 전환 (붙여넣기 vs 수동입력) */}
      <div className="flex bg-slate-900 rounded-lg p-1 my-3 border border-slate-800">
        <button
          onClick={() => setActiveTab('paste')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition ${activeTab === 'paste' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400'}`}
        >
          텍스트 붙여넣기
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition ${activeTab === 'manual' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400'}`}
        >
          수동 수정/입력
        </button>
      </div>

      {/* 입력 영역 */}
      {activeTab === 'paste' ? (
        <section className="flex-1 my-2">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-slate-300 font-medium">가민 텍스트 붙여넣기</label>
            <button
              onClick={handlePasteClipboard}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2.5 py-1 rounded-md flex items-center gap-1 border border-slate-700"
            >
              <Copy size={12} /> 클립보드 붙여넣기
            </button>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="가민 앱의 수영 세션/인터벌 텍스트 전체를 여기에 붙여넣으세요..."
            className="w-full h-32 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </section>
      ) : (
        <section className="flex-1 my-2 p-3 bg-slate-900 rounded-xl text-xs text-slate-300">
          <p className="mb-2 text-cyan-400 font-medium">✏️ 영법별 거리 및 심박수 수동 조정</p>
          <p className="text-slate-400">파싱 결과가 부정확할 경우 수치를 직접 조정할 수 있는 영역입니다.</p>
        </section>
      )}

      {/* 인스타 카드 결과 영역 */}
      {summary && summary.totalDistance > 0 ? (
        <section className="my-4 bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          {/* 카드 상단 헤더 */}
          <div className="flex justify-between items-end border-b border-slate-800 pb-3 mb-4">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">Swim Session</span>
              <h2 className="text-2xl font-black text-white mt-0.5">{summary.totalDistance.toLocaleString()}m</h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Total Time</span>
              <span className="text-lg font-bold text-slate-200">{summary.totalTimeDisplay}</span>
            </div>
          </div>

          {/* 주요 요약 지표 (평균 페이스, 심박수) */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <Flame className="text-cyan-400" size={18} />
              <div>
                <p className="text-[10px] text-slate-400">Avg Pace</p>
                <p className="text-xs font-bold text-white">{summary.avgPace} /100m</p>
              </div>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <Heart className="text-rose-400" size={18} />
              <div>
                <p className="text-[10px] text-slate-400">Avg Heart Rate</p>
                <p className="text-xs font-bold text-white">{summary.avgHr ? `${summary.avgHr} bpm` : '-'}</p>
              </div>
            </div>
          </div>

          {/* 영법별 분해 리스트 */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 mb-1">영법별 상세 기록</p>
            {Object.entries(summary.byStroke).map(([stroke, data]) => (
              <div key={stroke} className="flex justify-between items-center bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 text-xs">
                <span className="font-medium text-cyan-300">{stroke}</span>
                <div className="flex gap-3 text-slate-300 font-mono">
                  <span>{data.distance}m</span>
                  <span className="text-slate-500">|</span>
                  <span>{data.pace}/100m</span>
                  {data.avgHr && (
                    <>
                      <span className="text-slate-500">|</span>
                      <span className="text-rose-400">{data.avgHr}bpm</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 인스타 카드 푸터 */}
          <div className="mt-5 pt-3 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-500">
            <span>SwimLog Card</span>
            <span>@instagram_share</span>
          </div>
        </section>
      ) : (
        <div className="my-6 p-8 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
          가민 텍스트를 위에 붙여넣으면 영법별 거리, 페이스, 심박수 카드가 여기에 자동으로 생성됩니다.
        </div>
      )}

      {/* 인스타 공유 버튼 */}
      <button
        onClick={handleShare}
        disabled={!summary || summary.totalDistance === 0}
        className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg my-2"
      >
        <Share2 size={16} /> 인스타그램에 공유하기
      </button>
    </main>
  );
}
