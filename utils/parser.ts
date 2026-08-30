// lib/parser.ts

export interface SwimInterval {
  stroke: string;     // 영법 (자유형, 평영 등)
  distance: number;   // 거리 (m)
  timeSeconds: number;// 소요 시간 (초)
  timeDisplay: string;// 표시용 시간 (예: 1:30)
  pace: string;       // 페이스 (분'초"/100m)
  hr?: number;        // 평균 심박수 (bpm)
}

export interface SwimSummary {
  totalDistance: number;
  totalTimeSeconds: number;
  totalTimeDisplay: string;
  avgPace: string;
  avgHr?: number;
  byStroke: {
    [strokeName: string]: {
      distance: number;
      timeSeconds: number;
      timeDisplay: string;
      pace: string;
      avgHr?: number;
      count: number;
    };
  };
}

// 초 단위 시간을 "00:00" 또는 "0:00" 형식으로 변환
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// 100m 당 페이스 계산 (분'초")
function calculatePace(distanceMeters: number, timeSeconds: number): string {
  if (!distanceMeters || distanceMeters === 0) return "0'00\"";
  const paceSecondsPer100m = (timeSeconds / distanceMeters) * 100;
  const m = Math.floor(paceSecondsPer100m / 60);
  const s = Math.round(paceSecondsPer100m % 60);
  return `${m}'${s < 10 ? '0' : ''}${s}"`;
}

export function parseGarminText(rawText: string): SwimSummary {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  
  const intervals: SwimInterval[] = [];
  
  // 영법 키워드 매핑
  const strokeKeywords = ['자유형', '평영', '배영', '접영', '혼영', '드릴', '킥보드', '혼합', 'Freestyle', 'Breaststroke', 'Backstroke', 'Butterfly', 'Mixed', 'Drill'];

  for (const line of lines) {
    // 1. 영법 찾기
    let detectedStroke = '기타/자유형';
    for (const kw of strokeKeywords) {
      if (line.includes(kw)) {
        if (kw === 'Freestyle') detectedStroke = '자유형';
        else if (kw === 'Breaststroke') detectedStroke = '평영';
        else if (kw === 'Backstroke') detectedStroke = '배영';
        else if (kw === 'Butterfly') detectedStroke = '접영';
        else if (kw === 'Mixed') detectedStroke = '혼영';
        else if (kw === 'Drill') detectedStroke = '드릴';
        else detectedStroke = kw;
        break;
      }
    }

    // 2. 거리 찾기 (예: 100 m, 100m, 50 m 등)
    const distMatch = line.match(/(\d+)\s*m/i) || line.match(/(\d+)\s*미터/);
    const distance = distMatch ? parseInt(distMatch[1], 10) : 0;

    // 3. 시간 찾기 (예: 1:30.5, 01:25, 45.2 등)
    const timeMatch = line.match(/(\d+):(\d+)(\.\d+)?/) || line.match(/(\d+)\s*분\s*(\d+)?\s*초?/);
    let timeSeconds = 0;
    if (timeMatch) {
      if (line.includes(':')) {
        timeSeconds = parseInt(timeMatch[1], 10) * 60 + parseFloat(timeMatch[2]);
      } else {
        timeSeconds = parseInt(timeMatch[1], 10) * 60 + (timeMatch[2] ? parseInt(timeMatch[2], 10) : 0);
      }
    }

    // 4. 심박수 찾기 (예: 145 bpm, 심박수 150, 140bpm 등)
    const hrMatch = line.match(/(\d{2,3})\s*bpm/i) || line.match(/심박수\s*:?\s*(\d{2,3})/i) || line.match(/Avg\s*HR\s*:?\s*(\d{2,3})/i);
    const hr = hrMatch ? parseInt(hrMatch[1], 10) : undefined;

    if (distance > 0 || timeSeconds > 0) {
      intervals.push({
        stroke: detectedStroke,
        distance: distance || 50, // 기본값 설정
        timeSeconds: timeSeconds,
        timeDisplay: formatTime(timeSeconds),
        pace: calculatePace(distance, timeSeconds),
        hr: hr
      });
    }
  }

  // 집계 계산
  let totalDist = 0;
  let totalSec = 0;
  let sumHr = 0;
  let hrCount = 0;

  const byStrokeMap: SwimSummary['byStroke'] = {};

  intervals.forEach(item => {
    totalDist += item.distance;
    totalSec += item.timeSeconds;
    if (item.hr) {
      sumHr += item.hr;
      hrCount++;
    }

    if (!byStrokeMap[item.stroke]) {
      byStrokeMap[item.stroke] = {
        distance: 0,
        timeSeconds: 0,
        timeDisplay: '0:00',
        pace: "0'00\"",
        avgHr: undefined,
        count: 0
      };
    }

    const st = byStrokeMap[item.stroke];
    st.distance += item.distance;
    st.timeSeconds += item.timeSeconds;
    st.count += 1;
    if (item.hr) {
      st.avgHr = st.avgHr ? Math.round((st.avgHr * (st.count - 1) + item.hr) / st.count) : item.hr;
    }
  });

  // 영법별 시간 및 페이스 최종 포맷팅
  Object.keys(byStrokeMap).forEach(key => {
    const st = byStrokeMap[key];
    st.timeDisplay = formatTime(st.timeSeconds);
    st.pace = calculatePace(st.distance, st.timeSeconds);
  });

  return {
    totalDistance: totalDist,
    totalTimeSeconds: totalSec,
    totalTimeDisplay: formatTime(totalSec),
    avgPace: calculatePace(totalDist, totalSec),
    avgHr: hrCount > 0 ? Math.round(sumHr / hrCount) : undefined,
    byStroke: byStrokeMap
  };
}
