export interface Role {
  id: number;
  name: string;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  department: string;
  is_active: boolean;
  roles: Role[];
}

export interface NewUser {
  name: string;
  email: string;
  department: string;
  roles: number[];
}

export interface EditUser {
  id: number;
  full_name: string;
  email: string;
  department: string;
  roles: number[];
}

export interface FormErrors {
  name?: string;
  email?: string;
  department?: string;
  roles?: string;
}

export interface EditFormErrors {
  full_name?: string;
  email?: string;
  department?: string;
  roles?: string;
}
