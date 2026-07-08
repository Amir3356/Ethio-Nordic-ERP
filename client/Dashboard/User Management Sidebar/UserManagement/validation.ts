import { NewUser, EditUser, FormErrors, EditFormErrors } from './types';

export const validateNewUser = (newUser: NewUser): { isValid: boolean; errors: FormErrors } => {
  const errors: FormErrors = {};

  if (!newUser.name.trim()) {
    errors.name = 'Full name is required';
  }

  if (!newUser.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!newUser.department.trim()) {
    errors.department = 'Department is required';
  }

  if (newUser.roles.length === 0) {
    errors.roles = 'Please assign at least one role';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateEditUser = (editUser: EditUser | null): { isValid: boolean; errors: EditFormErrors } => {
  if (!editUser) return { isValid: false, errors: {} };

  const errors: EditFormErrors = {};

  if (!editUser.full_name.trim()) {
    errors.full_name = 'Full name is required';
  }

  if (!editUser.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editUser.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!editUser.department.trim()) {
    errors.department = 'Department is required';
  }

  if (editUser.roles.length === 0) {
    errors.roles = 'Please assign at least one role';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};
