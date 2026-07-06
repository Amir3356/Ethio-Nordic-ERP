export interface AuditLog {
  id: number;
  user_email: string;
  action: string;
  model_type: string;
  model_id: number;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  created_at: string;
}
