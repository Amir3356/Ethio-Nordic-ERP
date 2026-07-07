export interface Session {
  id: string;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
  browser?: string;
  platform?: string;
  location?: string;
  created_at: string;
  last_used_at: string | null;
  last_activity_at?: string | null;
  expires_at?: string | null;
  is_current?: boolean;
}

export interface SessionStats {
  total_sessions: number;
  by_device: Record<string, number>;
  by_browser: Record<string, number>;
  by_platform: Record<string, number>;
  by_location?: Record<string, number>;
}
