export interface AccessReview {
  id: number;
  full_name: string;
  email: string;
  roles: string[];
  last_login: string | null;
  days_since_login: number;
}
