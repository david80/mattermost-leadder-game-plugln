import React, { useState, useEffect } from 'react';
import { LadderClient } from '../utils/client';

interface Props {
  channelId: string;
  onStartGame: (params: {
    title: string;
    participants: string[];
    results: string[];
    density: string;
  }) => void;
  isLoading: boolean;
}

export const MemberSelector: React.FC<Props> = ({ channelId, onStartGame, isLoading }) => {
  const [title, setTitle] = useState('사다리 타기');
  const [density, setDensity] = useState('normal');
  const [participants, setParticipants] = useState<string[]>(['참가자 1', '참가자 2', '참가자 3']);
  const [results, setResults] = useState<string[]>(['당첨', '꽝', '꽝']);
  const [newMemberName, setNewMemberName] = useState('');
  const [channelMembers, setChannelMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Load channel members on mount or channel change
  useEffect(() => {
    if (!channelId) return;
    setLoadingMembers(true);
    LadderClient.fetchChannelUsers(channelId)
      .then((users) => {
        setChannelMembers(users);
      })
      .finally(() => setLoadingMembers(false));
  }, [channelId]);

  // Adjust results length when participants length changes
  const updateParticipants = (newParticipants: string[]) => {
    setParticipants(newParticipants);
    const pLen = newParticipants.length;
    if (results.length < pLen) {
      const added = Array.from({ length: pLen - results.length }, (_, i) => `결과 ${results.length + i + 1}`);
      setResults([...results, ...added]);
    } else if (results.length > pLen) {
      setResults(results.slice(0, pLen));
    }
  };

  const handleAddParticipant = () => {
    const trimmed = newMemberName.trim();
    if (!trimmed) return;
    if (participants.includes(trimmed)) {
      alert('이미 추가된 참가자입니다.');
      return;
    }
    updateParticipants([...participants, trimmed]);
    setNewMemberName('');
  };

  const handleRemoveParticipant = (index: number) => {
    if (participants.length <= 2) {
      alert('최소 2명의 참가자가 필요합니다.');
      return;
    }
    updateParticipants(participants.filter((_, i) => i !== index));
  };

  const handleAddChannelMember = (name: string) => {
    if (participants.includes(name)) return;
    updateParticipants([...participants, name]);
  };

  const handleAddAllChannelMembers = () => {
    const names = channelMembers.map((m) => m.name);
    if (names.length < 2) {
      alert('채널 멤버가 부족합니다.');
      return;
    }
    updateParticipants(names);
  };

  const handleResultChange = (index: number, val: string) => {
    const updated = [...results];
    updated[index] = val;
    setResults(updated);
  };

  // Preset Handlers
  const applyPresetCoffee = () => {
    const pLen = participants.length;
    const newRes = Array.from({ length: pLen }, (_, i) => (i === 0 ? '☕ 커피 쏘기!' : '통과'));
    // Shuffle preset
    setResults(newRes.sort(() => Math.random() - 0.5));
    setTitle('☕ 커피 쏘기 사다리');
  };

  const applyPresetLunch = () => {
    const pLen = participants.length;
    const newRes = Array.from({ length: pLen }, (_, i) => (i === 0 ? '🍱 점심 쏘기!' : '통과'));
    setResults(newRes.sort(() => Math.random() - 0.5));
    setTitle('🍱 점심 쏘기 사다리');
  };

  const applyPresetWinLose = () => {
    const pLen = participants.length;
    const newRes = Array.from({ length: pLen }, (_, i) => (i === 0 ? '🎉 당첨' : '꽝'));
    setResults(newRes.sort(() => Math.random() - 0.5));
    setTitle('🎉 당첨 뽑기');
  };

  const applyPresetRanking = () => {
    const pLen = participants.length;
    const newRes = Array.from({ length: pLen }, (_, i) => `${i + 1}등`);
    setResults(newRes);
    setTitle('🥇 순서 정하기');
  };

  const handleStart = () => {
    if (participants.length < 2) {
      alert('참가자는 최소 2명 이상이어야 합니다.');
      return;
    }
    if (participants.some((p) => !p.trim())) {
      alert('빈 참가자 이름이 있습니다.');
      return;
    }
    if (results.some((r) => !r.trim())) {
      alert('빈 결과 항목이 있습니다.');
      return;
    }
    onStartGame({
      title: title.trim() || '사다리 타기',
      participants,
      results,
      density,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Title & Density */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 240px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
            게임 제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 오늘의 커피 쏘기"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #334155',
              backgroundColor: '#0F172A',
              color: '#F8FAFC',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ width: '140px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
            가로줄 밀도
          </label>
          <select
            value={density}
            onChange={(e) => setDensity(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #334155',
              backgroundColor: '#0F172A',
              color: '#F8FAFC',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          >
            <option value="low">적음</option>
            <option value="normal">보통</option>
            <option value="high">많음</option>
          </select>
        </div>
      </div>

      {/* Channel Members Quick Add */}
      {channelMembers.length > 0 && (
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: '#0F172A',
            borderRadius: '8px',
            border: '1px solid #1E293B',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8' }}>
              👥 채널 멤버 간편 추가 ({channelMembers.length}명)
            </span>
            <button
              onClick={handleAddAllChannelMembers}
              style={{
                background: 'none',
                border: 'none',
                color: '#38BDF8',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 6px',
              }}
            >
              전체 추가하기
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '80px', overflowY: 'auto' }}>
            {channelMembers.map((m) => {
              const isAdded = participants.includes(m.name);
              return (
                <button
                  key={m.id}
                  onClick={() => handleAddChannelMember(m.name)}
                  disabled={isAdded}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '14px',
                    fontSize: '12px',
                    border: '1px solid',
                    borderColor: isAdded ? '#334155' : '#2563EB',
                    backgroundColor: isAdded ? '#1E293B' : '#1D4ED8',
                    color: isAdded ? '#64748B' : '#FFFFFF',
                    cursor: isAdded ? 'default' : 'pointer',
                  }}
                >
                  {isAdded ? `✓ ${m.name}` : `+ ${m.name}`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Participants & Results Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Left: Participants */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>
              참가자 ({participants.length}명)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()}
              placeholder="직접 이름 입력 후 추가"
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleAddParticipant}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              추가
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '220px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {participants.map((p, idx) => (
              <div
                key={`p-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                }}
              >
                <span style={{ fontSize: '13px', color: '#F8FAFC' }}>
                  <span style={{ color: '#94A3B8', marginRight: '6px', fontSize: '11px' }}>{idx + 1}.</span>
                  {p}
                </span>
                <button
                  onClick={() => handleRemoveParticipant(idx)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#EF4444',
                    fontSize: '14px',
                    cursor: 'pointer',
                    padding: '0 4px',
                  }}
                  title="삭제"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Results */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>
              결과 항목 ({results.length}개)
            </span>
          </div>

          {/* Preset Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
            <button
              onClick={applyPresetCoffee}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: '#1E293B',
                color: '#E2E8F0',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              ☕ 커피 1명
            </button>
            <button
              onClick={applyPresetLunch}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: '#1E293B',
                color: '#E2E8F0',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              🍱 점심 1명
            </button>
            <button
              onClick={applyPresetWinLose}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: '#1E293B',
                color: '#E2E8F0',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              🎉 당첨/꽝
            </button>
            <button
              onClick={applyPresetRanking}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: '#1E293B',
                color: '#E2E8F0',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              🥇 순위
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '220px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {results.map((r, idx) => (
              <div key={`r-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94A3B8', width: '20px', textAlign: 'right' }}>
                  {idx + 1}.
                </span>
                <input
                  type="text"
                  value={r}
                  onChange={(e) => handleResultChange(idx, e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    backgroundColor: '#1E293B',
                    color: '#F8FAFC',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '10px',
          border: 'none',
          backgroundColor: isLoading ? '#475569' : '#2563EB',
          color: '#FFFFFF',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
          transition: 'all 0.2s',
          marginTop: '10px',
        }}
        onMouseOver={(e) => {
          if (!isLoading) e.currentTarget.style.backgroundColor = '#1D4ED8';
        }}
        onMouseOut={(e) => {
          if (!isLoading) e.currentTarget.style.backgroundColor = '#2563EB';
        }}
      >
        {isLoading ? '사다리 생성 중...' : '🪜 사다리 타기 시작!'}
      </button>
    </div>
  );
};
