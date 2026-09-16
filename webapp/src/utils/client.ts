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
      // 1. Try Mattermost active users in channel API first
      const activeUsersRes = await fetch(`/api/v4/users?in_channel=${channelId}&active=true&per_page=100`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });

      let rawUsers: Array<{
        id: string;
        username: string;
        nickname?: string;
        first_name?: string;
        last_name?: string;
        is_bot?: boolean;
        delete_at?: number;
      }> = [];

      if (activeUsersRes.ok) {
        rawUsers = await activeUsersRes.json();
      } else {
        // Fallback: Fetch channel members and then user profiles
        const membersRes = await fetch(`/api/v4/channels/${channelId}/members?page=0&per_page=100`, {
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
        if (!membersRes.ok) return [];
        const members: Array<{ user_id: string }> = await membersRes.json();
        const userIds = members.map((m) => m.user_id);

        if (userIds.length === 0) return [];

        const usersRes = await fetch(`/api/v4/users/ids`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify(userIds),
        });
        if (!usersRes.ok) return [];
        rawUsers = await usersRes.json();
      }

      // Filter out bots and deactivated (delete_at > 0) users
      return rawUsers
        .filter((u) => !u.is_bot && (!u.delete_at || u.delete_at === 0))
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
