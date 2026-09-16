import React, { useState, useEffect, useRef } from 'react';
import { LadderGame, MatchResult } from '../types';

interface Props {
  game: LadderGame;
  onSelectParticipant?: (index: number) => void;
}

const COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#F97316', // Orange
];

// Helper functions to safely access properties regardless of casing (snake_case vs camelCase vs PascalCase)
const getCol = (p: any): number => (p?.column !== undefined ? p.column : (p?.Column ?? 0));
const getLvl = (p: any): number => (p?.level !== undefined ? p.level : (p?.Level ?? 0));
const getPIdx = (m: any): number => (m?.participant_index !== undefined ? m.participant_index : (m?.ParticipantIndex ?? 0));
const getPName = (m: any): string => m?.participant_name || m?.ParticipantName || '';
const getRIdx = (m: any): number => (m?.result_index !== undefined ? m.result_index : (m?.ResultIndex ?? 0));
const getRLabel = (m: any): string => m?.result_label || m?.ResultLabel || '';
const getTotalLevels = (g: any): number => g?.total_levels || g?.TotalLevels || 20;

export const LadderCanvas: React.FC<Props> = ({ game }) => {
  const [activeParticipant, setActiveParticipant] = useState<number | null>(null);
  const [revealedResults, setRevealedResults] = useState<Record<number, boolean>>({});
  const [animatingParticipant, setAnimatingParticipant] = useState<number | null>(null);
  const [animProgress, setAnimProgress] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);

  const n = game.participants.length;
  const colWidth = Math.max(90, Math.min(130, 700 / n));
  const paddingX = 60;
  const paddingTop = 70;
  const paddingBottom = 70;
  const svgHeight = 440;
  const ladderHeight = svgHeight - paddingTop - paddingBottom;
  const svgWidth = paddingX * 2 + (n - 1) * colWidth;
  const totalLevels = getTotalLevels(game);

  const getColX = (col: number) => paddingX + col * colWidth;
  const getLevelY = (lvl: number) => paddingTop + (lvl / totalLevels) * ladderHeight;

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const startAnimation = (pIdx: number) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setActiveParticipant(pIdx);
    setAnimatingParticipant(pIdx);
    setAnimProgress(0);

    const startTime = performance.now();
    const duration = 1600; // 1.6 seconds smooth descent

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      setAnimProgress(progress);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        setAnimatingParticipant(null);
        setRevealedResults((prev) => ({ ...prev, [pIdx]: true }));
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  };

  const revealAll = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      setAnimatingParticipant(null);
    }
    setActiveParticipant(-1); // special indicator for all
    const allRevealed: Record<number, boolean> = {};
    for (let i = 0; i < n; i++) {
      allRevealed[i] = true;
    }
    setRevealedResults(allRevealed);
  };

  // Compute interpolated point along a match path based on progress (0 to 1)
  const getAnimatedPath = (match: MatchResult, progress: number) => {
    const pts = match.path || [];
    if (pts.length < 2) return '';

    let totalLen = 0;
    const segLens: number[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = { x: getColX(getCol(pts[i])), y: getLevelY(getLvl(pts[i])) };
      const p2 = { x: getColX(getCol(pts[i + 1])), y: getLevelY(getLvl(pts[i + 1])) };
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      segLens.push(dist);
      totalLen += dist;
    }

    const targetDist = totalLen * progress;
    let accumulated = 0;
    let currentD = `M ${getColX(getCol(pts[0]))} ${getLevelY(getLvl(pts[0]))}`;

    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = { x: getColX(getCol(pts[i])), y: getLevelY(getLvl(pts[i])) };
      const p2 = { x: getColX(getCol(pts[i + 1])), y: getLevelY(getLvl(pts[i + 1])) };
      const segLen = segLens[i];

      if (accumulated + segLen <= targetDist) {
        currentD += ` L ${p2.x} ${p2.y}`;
        accumulated += segLen;
      } else {
        const segRemain = targetDist - accumulated;
        const ratio = segLen > 0 ? segRemain / segLen : 0;
        const curX = p1.x + (p2.x - p1.x) * ratio;
        const curY = p1.y + (p2.y - p1.y) * ratio;
        currentD += ` L ${curX} ${curY}`;
        break;
      }
    }

    return currentD;
  };

  const getFullMatchPathD = (match: MatchResult) => {
    const pts = match.path || [];
    return pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getColX(getCol(p))} ${getLevelY(getLvl(p))}`)
      .join(' ');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: '#94A3B8' }}>
          💡 참가자 이름을 클릭하여 사다리를 타거나, 전체보기를 눌러보세요.
        </span>
        <button
          onClick={revealAll}
          style={{
            padding: '6px 14px',
            backgroundColor: '#1E293B',
            color: '#FFFFFF',
            borderRadius: '6px',
            border: '1px solid #334155',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#334155')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
        >
          ✨ 전체 결과 보기
        </button>
      </div>

      {/* SVG Canvas Container */}
      <div
        style={{
          width: '100%',
          overflowX: 'auto',
          backgroundColor: '#0F172A',
          borderRadius: '12px',
          padding: '16px 10px',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: svgWidth < 700 ? 'center' : 'flex-start',
        }}
      >
        <svg width={svgWidth} height={svgHeight} style={{ overflow: 'visible' }}>
          {/* Base Vertical Lines */}
          {Array.from({ length: n }).map((_, i) => (
            <line
              key={`vert-${i}`}
              x1={getColX(i)}
              y1={paddingTop}
              x2={getColX(i)}
              y2={paddingTop + ladderHeight}
              stroke="#334155"
              strokeWidth="4"
              strokeLinecap="round"
            />
          ))}

          {/* Base Horizontal Lines (Bridges) */}
          {(game.lines || []).map((line, idx) => {
            const col = getCol(line);
            const lvl = getLvl(line);
            return (
              <line
                key={`horiz-${idx}`}
                x1={getColX(col)}
                y1={getLevelY(lvl)}
                x2={getColX(col + 1)}
                y2={getLevelY(lvl)}
                stroke="#475569"
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })}

          {/* Full Paths for All if revealAll clicked */}
          {activeParticipant === -1 &&
            (game.matches || []).map((match, idx) => {
              const pIdx = getPIdx(match);
              return (
                <path
                  key={`full-path-${idx}`}
                  d={getFullMatchPathD(match)}
                  fill="none"
                  stroke={COLORS[pIdx % COLORS.length]}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
              );
            })}

          {/* Active Animated / Selected Path */}
          {activeParticipant !== null &&
            activeParticipant >= 0 &&
            game.matches &&
            game.matches[activeParticipant] && (
              <path
                d={
                  animatingParticipant === activeParticipant
                    ? getAnimatedPath(game.matches[activeParticipant], animProgress)
                    : getFullMatchPathD(game.matches[activeParticipant])
                }
                fill="none"
                stroke={COLORS[activeParticipant % COLORS.length]}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="drop-shadow(0 0 6px currentColor)"
              />
            )}

          {/* Top Participants Buttons / Labels */}
          {game.participants.map((name, i) => {
            const isSelected = activeParticipant === i || activeParticipant === -1;
            const color = COLORS[i % COLORS.length];
            const x = getColX(i);
            return (
              <g
                key={`participant-${i}`}
                transform={`translate(${x}, ${paddingTop - 25})`}
                onClick={() => startAnimation(i)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x="-42"
                  y="-22"
                  width="84"
                  height="34"
                  rx="17"
                  fill={isSelected ? color : '#1E293B'}
                  stroke={color}
                  strokeWidth="2"
                  filter={isSelected ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' : 'none'}
                />
                <text
                  x="0"
                  y="-1"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#FFFFFF"
                  fontSize="12"
                  fontWeight="600"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {name.length > 5 ? name.slice(0, 4) + '..' : name}
                </text>
              </g>
            );
          })}

          {/* Bottom Results Buttons / Labels */}
          {game.results.map((label, i) => {
            const isRevealed =
              activeParticipant === -1 ||
              (game.matches || []).some(
                (m) => getRIdx(m) === i && revealedResults[getPIdx(m)]
              );
            const matchedMatch = (game.matches || []).find((m) => getRIdx(m) === i);
            const matchColor =
              matchedMatch && isRevealed
                ? COLORS[getPIdx(matchedMatch) % COLORS.length]
                : '#334155';
            const x = getColX(i);
            const y = paddingTop + ladderHeight + 35;

            return (
              <g key={`result-${i}`} transform={`translate(${x}, ${y})`}>
                <rect
                  x="-44"
                  y="-20"
                  width="88"
                  height="36"
                  rx="8"
                  fill={isRevealed ? '#1E293B' : '#1E293B'}
                  stroke={isRevealed ? matchColor : '#475569'}
                  strokeWidth={isRevealed ? '2.5' : '1.5'}
                  filter={isRevealed ? `drop-shadow(0 0 8px ${matchColor})` : 'none'}
                />
                <text
                  x="0"
                  y="-1"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isRevealed ? '#F8FAFC' : '#94A3B8'}
                  fontSize="12"
                  fontWeight={isRevealed ? 'bold' : 'normal'}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {isRevealed ? (label.length > 6 ? label.slice(0, 5) + '..' : label) : '❓'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Matching Results Cards */}
      <div
        style={{
          width: '100%',
          marginTop: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '12px',
        }}
      >
        {(game.matches || []).map((m, idx) => {
          const pIdx = getPIdx(m);
          const pName = getPName(m) || `참가자 ${pIdx + 1}`;
          const rLabel = getRLabel(m) || `결과 ${getRIdx(m) + 1}`;
          const isRevealed = revealedResults[pIdx] || activeParticipant === -1;
          const color = COLORS[pIdx % COLORS.length];

          return (
            <div
              key={`match-card-${idx}`}
              onClick={() => startAnimation(pIdx)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: isRevealed ? '#1E293B' : '#0F172A',
                border: `1.5px solid ${isRevealed ? color : '#334155'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>
                  {pName}
                </span>
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: isRevealed ? '#38BDF8' : '#64748B',
                  marginTop: '2px',
                }}
              >
                {isRevealed ? `🎯 ${rLabel}` : '클릭하여 확인'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
