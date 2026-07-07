export interface AuditLog {
  id: number;
  email: string;
  full_name: string;
  action: string;
  model_type: string;
  model_id: number;
  before_data: Record<string, unknown>;
  after_data: Record<string, unknown>;
  created_at: string;
}
