import React, { useState } from 'react';
import { MemberSelector } from './MemberSelector';
import { LadderCanvas } from './LadderCanvas';
import { LadderGame } from '../types';
import { LadderClient } from '../utils/client';

interface Props {
  visible: boolean;
  channelId: string;
  onClose: () => void;
}

export const LadderModal: React.FC<Props> = ({ visible, channelId, onClose }) => {
  const [currentGame, setCurrentGame] = useState<LadderGame | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [shareComment, setShareComment] = useState('');

  if (!visible) return null;

  const handleStartGame = async (params: {
    title: string;
    participants: string[];
    results: string[];
    density: string;
  }) => {
    setIsLoading(true);
    setPublishSuccess(false);
    try {
      const game = await LadderClient.createGame({
        channel_id: channelId,
        title: params.title,
        participants: params.participants,
        results: params.results,
        density: params.density,
      });
      setCurrentGame(game);
    } catch (err: any) {
      alert(err.message || '사다리 게임 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!currentGame) return;
    setIsPublishing(true);
    try {
      await LadderClient.postGameResult(currentGame.id, shareComment);
      setPublishSuccess(true);
      setTimeout(() => {
        setPublishSuccess(false);
      }, 3000);
    } catch (err: any) {
      alert(err.message || '채널 공유에 실패했습니다.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReset = () => {
    setCurrentGame(null);
    setPublishSuccess(false);
    setShareComment('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: currentGame ? '840px' : '640px',
          maxHeight: '90vh',
          backgroundColor: '#0F172A',
          borderRadius: '16px',
          border: '1px solid #1E293B',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#1E293B',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>🪜</span>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#F8FAFC' }}>
              {currentGame ? currentGame.title : '사다리 타기 게임 설정'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#94A3B8')}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
            backgroundColor: '#0F172A',
          }}
        >
          {!currentGame ? (
            <MemberSelector
              channelId={channelId}
              onStartGame={handleStartGame}
              isLoading={isLoading}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <LadderCanvas game={currentGame} />

              {/* Share Options */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={shareComment}
                    onChange={(e) => setShareComment(e.target.value)}
                    placeholder="채널에 함께 남길 코멘트 (선택사항, 예: 축하드립니다!)"
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #475569',
                      backgroundColor: '#0F172A',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: publishSuccess ? '#10B981' : '#2563EB',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: isPublishing ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    {publishSuccess ? '✓ 채널 공유 완료!' : isPublishing ? '공유 중...' : '📢 채널에 공유'}
                  </button>
                </div>
              </div>

              {/* Bottom Nav */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={handleReset}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #475569',
                    backgroundColor: 'transparent',
                    color: '#94A3B8',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                  onMouseOut={(e) => (e.currentTarget.style.color = '#94A3B8')}
                >
                  ← 다시 설정하기
                </button>
                <button
                  onClick={onClose}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#334155',
                    color: '#F8FAFC',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
