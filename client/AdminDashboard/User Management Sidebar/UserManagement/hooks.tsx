import { useState, useEffect, useCallback } from 'react';
import { userAPI, roleAPI } from '../../../services/api';
import { User, Role, NewUser, EditUser, FormErrors, EditFormErrors } from './types';
import { validateNewUser, validateEditUser } from './validation';

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editUser, setEditUser] = useState<EditUser | null>(null);
  const [newUserErrors, setNewUserErrors] = useState<FormErrors>({});
  const [editUserErrors, setEditUserErrors] = useState<EditFormErrors>({});
  const [newUser, setNewUser] = useState<NewUser>({
    name: '',
    email: '',
    department: '',
    roles: [],
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAll({ per_page: 100 });
      const payload = response.data?.data;
      setUsers(Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []);
      setError('');
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await roleAPI.getAll();
      const payload = response.data?.data;
      setRoles(Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const handleCreateUser = async (): Promise<boolean> => {
    const { isValid, errors } = validateNewUser(newUser);
    setNewUserErrors(errors);
    if (!isValid) return false;

    try {
      setLoading(true);
      const email = newUser.email;
      const response = await userAPI.create({
        full_name: newUser.name,
        email: newUser.email,
        department: newUser.department,
        role_ids: newUser.roles,
      });
      const emailSent = response.data?.data?.email_sent;
      setShowNewUserForm(false);
      setNewUser({ name: '', email: '', department: '', roles: [] });
      setNewUserErrors({});
      await fetchUsers();
      if (emailSent) {
        setError('');
        alert(`User created successfully. An activation email was sent to ${email}, and the new user will be prompted to set a password and enroll in 2FA.`);
      } else {
        alert('User created but activation email could not be sent. Check logs for details.');
      }
      return true;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to create user');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;

    try {
      setLoading(true);
      const response = await userAPI.delete(userId);
      await fetchUsers();
      setError('');
      alert(response.data?.message || 'User deleted successfully.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = axiosErr.response?.data?.message || axiosErr.message || 'Failed to delete user';
      setError(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditUser({
      id: user.id,
      full_name: user.full_name || '',
      email: user.email || '',
      department: user.department || '',
      roles: user.roles ? user.roles.map((r) => r.id) : [],
    });
    setEditUserErrors({});
    setShowEditForm(true);
  };

  const handleUpdateUser = async (): Promise<boolean> => {
    const { isValid, errors } = validateEditUser(editUser);
    setEditUserErrors(errors);
    if (!isValid) return false;

    try {
      setLoading(true);
      await userAPI.update(editUser.id, {
        full_name: editUser.full_name,
        email: editUser.email,
        department: editUser.department,
        role_ids: editUser.roles,
      });
      setShowEditForm(false);
      setEditUser(null);
      setEditUserErrors({});
      await fetchUsers();
      setError('');
      return true;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to update user');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const openNewUserForm = () => {
    setNewUserErrors({});
    setShowNewUserForm(true);
  };

  const closeNewUserForm = () => {
    setNewUserErrors({});
    setShowNewUserForm(false);
  };

  const closeEditForm = () => {
    setEditUserErrors({});
    setShowEditForm(false);
    setEditUser(null);
  };

  return {
    users,
    roles,
    search,
    setSearch,
    loading,
    error,
    setError,
    showNewUserForm,
    showEditForm,
    editUser,
    newUserErrors,
    editUserErrors,
    newUser,
    setNewUser,
    setEditUser,
    setNewUserErrors,
    setEditUserErrors,
    filteredUsers,
    handleCreateUser,
    handleDeleteUser,
    handleEditUser,
    handleUpdateUser,
    openNewUserForm,
    closeNewUserForm,
    closeEditForm,
  };
}
