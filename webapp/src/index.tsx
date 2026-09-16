import React, { useState, useEffect } from 'react';
import { PLUGIN_ID } from './manifest';
import { LadderModal } from './components/LadderModal';

declare global {
  interface Window {
    registerPlugin: (id: string, plugin: any) => void;
  }
}

const LadderIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ verticalAlign: 'middle' }}
  >
    <path d="M6 3v18M18 3v18M6 7h12M6 12h12M6 17h12" />
  </svg>
);

const LadderRoot: React.FC<{ store: any }> = ({ store }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [targetChannelId, setTargetChannelId] = useState('');

  useEffect(() => {
    const handleOpen = (e: any) => {
      const state = store.getState();
      const currentChannelId =
        e.detail?.channelId ||
        state.entities?.channels?.currentChannelId ||
        '';
      setTargetChannelId(currentChannelId);
      setModalOpen(true);
    };

    window.addEventListener('ladder-game-open-modal', handleOpen);
    return () => {
      window.removeEventListener('ladder-game-open-modal', handleOpen);
    };
  }, [store]);

  return (
    <LadderModal
      visible={modalOpen}
      channelId={targetChannelId}
      onClose={() => setModalOpen(false)}
    />
  );
};

class Plugin {
  initialize(registry: any, store: any) {
    // Register Root Modal Component
    registry.registerRootComponent(() => <LadderRoot store={store} />);

    // Register Channel Header Button (Older Mattermost or channel header plugin dropdown)
    if (registry.registerChannelHeaderButtonAction) {
      registry.registerChannelHeaderButtonAction(
        <LadderIcon />,
        () => {
          const state = store.getState();
          const currentChannelId = state.entities?.channels?.currentChannelId || '';
          window.dispatchEvent(
            new CustomEvent('ladder-game-open-modal', {
              detail: { channelId: currentChannelId },
            })
          );
        },
        '사다리 게임',
        '사다리 게임 시작하기'
      );
    }

    // Register App Bar Component (Modern Mattermost v6/v7/v8/v9/v10 Right-Hand App Bar)
    if (registry.registerAppBarComponent) {
      const iconDataUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2338BDF8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v18M18 3v18M6 7h12M6 12h12M6 17h12"/></svg>`;
      registry.registerAppBarComponent(
        iconDataUrl,
        () => {
          const state = store.getState();
          const currentChannelId = state.entities?.channels?.currentChannelId || '';
          window.dispatchEvent(
            new CustomEvent('ladder-game-open-modal', {
              detail: { channelId: currentChannelId },
            })
          );
        },
        '사다리 게임 시작하기'
      );
    }

    // Listen for WebSocket event from server /ladder command
    registry.registerWebSocketEventHandler(
      `custom_${PLUGIN_ID}_open_modal`,
      (msg: any) => {
        const channelId = msg.data?.channel_id;
        window.dispatchEvent(
          new CustomEvent('ladder-game-open-modal', {
            detail: { channelId },
          })
        );
      }
    );
  }

  uninitialize() {
    // Cleanup if needed
  }
}

window.registerPlugin(PLUGIN_ID, new Plugin());
