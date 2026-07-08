export interface Session {
  id: string;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  device_type?: string;
  location?: string;
  is_current?: boolean;
}
