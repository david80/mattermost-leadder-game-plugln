import { PLUGIN_ID } from '../manifest';
import { LadderGame } from '../types';

export class LadderClient {
  static async createGame(payload: {
    channel_id: string;
    title: string;
    participants: string[];
    results: string[];
    density: string;
  }): Promise<LadderGame> {
    const response = await fetch(`/plugins/${PLUGIN_ID}/api/v1/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '사다리 게임 생성에 실패했습니다.');
    }

    return response.json();
  }

  static async postGameResult(gameId: string, comment?: string): Promise<void> {
    const response = await fetch(`/plugins/${PLUGIN_ID}/api/v1/games/${gameId}/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ comment: comment || '' }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '결과 공유에 실패했습니다.');
    }
  }

  static async fetchChannelUsers(channelId: string): Promise<Array<{ id: string; name: string }>> {
    try {
      // 1. Fetch channel members
      const membersRes = await fetch(`/api/v4/channels/${channelId}/members?page=0&per_page=60`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (!membersRes.ok) return [];
      const members: Array<{ user_id: string }> = await membersRes.json();
      const userIds = members.map((m) => m.user_id);

      if (userIds.length === 0) return [];

      // 2. Fetch user profiles
      const usersRes = await fetch(`/api/v4/users/ids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(userIds),
      });
      if (!usersRes.ok) return [];

      const users: Array<{
        id: string;
        username: string;
        nickname?: string;
        first_name?: string;
        last_name?: string;
        is_bot?: boolean;
      }> = await usersRes.json();

      return users
        .filter((u) => !u.is_bot)
        .map((u) => {
          let name = u.nickname || '';
          if (!name && (u.first_name || u.last_name)) {
            name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
          }
          if (!name) {
            name = u.username;
          }
          return { id: u.id, name };
        });
    } catch (e) {
      console.warn('Failed to fetch channel members:', e);
      return [];
    }
  }
}
