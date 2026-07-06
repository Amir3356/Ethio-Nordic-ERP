export interface Role {
  id: number;
  name: string;
}

export interface Permission {
  id: number;
  name: string;
  slug: string;
  module: string;
  action: string;
  description?: string;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  department: string;
  is_active: boolean;
  roles: Role[];
  direct_permissions?: Permission[];
}

export interface NewUser {
  name: string;
  email: string;
  department: string;
  roles: number[];
  permissions: number[];
}

export interface EditUser {
  id: number;
  full_name: string;
  email: string;
  department: string;
  roles: number[];
  permissions: number[];
}

export interface FormErrors {
  name?: string;
  email?: string;
  department?: string;
  roles?: string;
  permissions?: string;
}

export interface EditFormErrors {
  full_name?: string;
  email?: string;
  department?: string;
  roles?: string;
  permissions?: string;
}
