import { useState, useEffect, useCallback, useRef } from 'react';
import { userAPI, roleAPI } from '../../../services';
import { User, Role, Permission, NewUser, EditUser, FormErrors, EditFormErrors } from './types';
import { validateNewUser, validateEditUser } from './validation';

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Record<string, Permission[]>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editUser, setEditUser] = useState<EditUser | null>(null);
  const [newUserErrors, setNewUserErrors] = useState<FormErrors>({});
  const [editUserErrors, setEditUserErrors] = useState<EditFormErrors>({});
  const submittingRef = useRef(false);
  const [newUser, setNewUser] = useState<NewUser>({
    name: '',
    email: '',
    department: '',
    roles: [],
    permissions: [],
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

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await userAPI.getAllPermissionsGrouped();
      const payload = response.data?.data;
      setAllPermissions(payload || {});
    } catch (err) {
      console.error('Failed to load permissions:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchPermissions();
  }, [fetchUsers, fetchRoles, fetchPermissions]);

  const handleCreateUser = async (): Promise<boolean> => {
    if (submittingRef.current) return false;
    submittingRef.current = true;

    const { isValid, errors } = validateNewUser(newUser);
    setNewUserErrors(errors);
    if (!isValid) { submittingRef.current = false; return false; }

    try {
      setLoading(true);
      setSuccess('');
      const response = await userAPI.create({
        full_name: newUser.name,
        email: newUser.email,
        department: newUser.department,
        role_ids: newUser.roles,
        permission_ids: newUser.permissions,
      });
      const emailSent = response.data?.data?.email_sent;
      setShowNewUserForm(false);
      setNewUser({ name: '', email: '', department: '', roles: [], permissions: [] });
      setNewUserErrors({});
      await fetchUsers();
      setSuccess('User created successfully.' + (emailSent ? ' Activation email sent.' : ''));
      return true;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to create user');
      return false;
    } finally {
      setLoading(false);
      submittingRef.current = false;
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
      permissions: user.direct_permissions ? user.direct_permissions.map((p) => p.id) : [],
    });
    setEditUserErrors({});
    setShowEditForm(true);
  };

  const handleUpdateUser = async (): Promise<boolean> => {
    if (submittingRef.current) return false;
    submittingRef.current = true;

    const { isValid, errors } = validateEditUser(editUser);
    setEditUserErrors(errors);
    if (!isValid) { submittingRef.current = false; return false; }

    try {
      setLoading(true);
      await userAPI.update(editUser.id, {
        full_name: editUser.full_name,
        email: editUser.email,
        department: editUser.department,
        role_ids: editUser.roles,
        permission_ids: editUser.permissions,
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
      submittingRef.current = false;
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
    allPermissions,
    search,
    setSearch,
    loading,
    error,
    setError,
    success,
    setSuccess,
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
