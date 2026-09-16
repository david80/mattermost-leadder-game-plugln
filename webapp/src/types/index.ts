export interface LadderLine {
  level: number;
  column: number;
}

export interface PathPoint {
  level: number;
  column: number;
}

export interface MatchResult {
  participant_index: number;
  participant_name: string;
  result_index: number;
  result_label: string;
  path: PathPoint[];
}

export interface LadderGame {
  id: string;
  channel_id: string;
  creator_id: string;
  creator_name: string;
  title: string;
  participants: string[];
  results: string[];
  total_levels: number;
  lines: LadderLine[];
  matches: MatchResult[];
  created_at: number;
}

export interface ChannelMember {
  user_id: string;
  username: string;
  nickname?: string;
  first_name?: string;
  last_name?: string;
}
