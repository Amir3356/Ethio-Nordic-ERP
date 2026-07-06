export interface UserData {
  full_name: string;
  email: string;
  department: string;
  role_ids: number[];
}

export interface PaginationParams {
  per_page?: number;
  sort?: string;
  page?: number;
}
