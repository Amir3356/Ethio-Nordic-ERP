export interface Session {
  id: string;
  user?: { name?: string };
  last_used_at: string | null;
  created_at: string;
}
