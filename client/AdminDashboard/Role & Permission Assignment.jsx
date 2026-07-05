import { useState, useEffect } from 'react';
import { roleService } from './New user create';
import api from '../context/api';

const permissionService = {
  getAll: () => api.get('/permissions'),
  getById: (id) => api.get(`/permissions/${id}`),
  getByModule: (module) => api.get(`/permissions/module/${module}`),
};
import { Shield, Key, User, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import './Role & Permission Assignment.css';

const MODULES = ['users', 'roles', 'login-activity', 'sessions', 'audit-logs', 'dashboard'];
const ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'export'];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function RoleManagement() {
  const [activeTab, setActiveTab] = useState('roles');
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRole, setDeletingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', permissions: [] });
  const [nameAuto, setNameAuto] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [rolesRes, permsRes] = await Promise.all([roleService.getAll(), permissionService.getAll()]);
        if (!cancelled) {
          setRoles(rolesRes.data.data || rolesRes.data || []);
          setPermissions(permsRes.data.data || permsRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const reloadRoles = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([roleService.getAll(), permissionService.getAll()]);
      setRoles(rolesRes.data.data || rolesRes.data || []);
      setPermissions(permsRes.data.data || permsRes.data || []);
    } catch (err) {
      console.error('Failed to reload data:', err);
    }
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: nameAuto ? slugify(name) : prev.slug,
    }));
  };

  const handleSlugChange = (e) => {
    setNameAuto(false);
    setFormData((prev) => ({ ...prev, slug: e.target.value }));
  };

  const togglePerm = (permSlug) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permSlug);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permSlug)
          : [...prev.permissions, permSlug],
      };
    });
  };

  const toggleModuleAll = (mod) => {
    const modulePerms = ACTIONS.map((a) => `${mod}.${a}`);
    setFormData((prev) => {
      const allSelected = modulePerms.every((p) => prev.permissions.includes(p));
      return {
        ...prev,
        permissions: allSelected
          ? prev.permissions.filter((p) => !modulePerms.includes(p))
          : [...new Set([...prev.permissions, ...modulePerms])],
      };
    });
  };

  const openAddModal = () => {
    setEditingRole(null);
    setFormData({ name: '', slug: '', description: '', permissions: [] });
    setNameAuto(true);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name || '',
      slug: role.slug || '',
      description: role.description || '',
      permissions: (role.permissions || []).map((p) => p.slug || p),
    });
    setNameAuto(false);
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Role name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingRole) {
        await roleService.update(editingRole.id, formData);
      } else {
        await roleService.create(formData);
      }
      setShowModal(false);
      reloadRoles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save role.');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (role) => {
    setDeletingRole(role);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingRole) return;
    setSaving(true);
    try {
      await roleService.delete(deletingRole.id);
      setShowDeleteModal(false);
      setDeletingRole(null);
      reloadRoles();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rm-container">
      <div className="rm-header">
        <h1 className="rm-title">Role Management</h1>
        <div className="rm-tabs">
          <button
            className={`rm-tab ${activeTab === 'roles' ? 'rm-tab-active' : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            Roles
          </button>
          <button
            className={`rm-tab ${activeTab === 'permissions' ? 'rm-tab-active' : ''}`}
            onClick={() => setActiveTab('permissions')}
          >
            Permissions
          </button>
        </div>
        {activeTab === 'roles' && (
          <button className="rm-btn rm-btn-primary" onClick={openAddModal}>
            + Add Role
          </button>
        )}
      </div>

      {activeTab === 'roles' && (
        <div className="rm-content">
          {loading ? (
            <div className="rm-loading">
              <p>Loading roles...</p>
            </div>
          ) : roles.length === 0 ? (
            <div className="rm-empty">
              <Shield className="rm-empty-icon" size={48} />
              <h3>No roles found</h3>
              <p>Create your first role to get started.</p>
            </div>
          ) : (
            <div className="rm-grid">
              {roles.map((role) => (
                <div key={role.id} className="rm-card">
                  <div className="rm-card-header">
                    <h3 className="rm-card-name">{role.name}</h3>
                    {role.is_system && <span className="rm-badge rm-badge-system">System</span>}
                  </div>
                  <p className="rm-card-desc">{role.description || 'No description provided.'}</p>
                  <div className="rm-card-badges">
                    <span className="rm-badge rm-badge-perm">
                      <Key size={14} /> {role.permissions?.length || 0} permissions
                    </span>
                    <span className="rm-badge rm-badge-users">
                      <User size={14} /> {role.users_count || role.users?.length || 0} users
                    </span>
                  </div>
                  <div className="rm-card-actions">
                    <button
                      className="rm-icon-btn rm-icon-edit"
                      onClick={() => openEditModal(role)}
                      title="Edit role"
                    >
                      <Pencil size={16} />
                    </button>
                    {!role.is_system && (
                      <button
                        className="rm-icon-btn rm-icon-delete"
                        onClick={() => openDeleteModal(role)}
                        title="Delete role"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="rm-content">
          {loading ? (
            <div className="rm-loading">
              <p>Loading permissions...</p>
            </div>
          ) : (
            <div className="rm-perm-table-wrap">
              {MODULES.map((mod) => {
                const modPerms = permissions.filter((p) => {
                  const parts = (p.slug || '').split('.');
                  return parts[0] === mod;
                });
                if (modPerms.length === 0) return null;
                return (
                  <div key={mod} className="rm-perm-group">
                    <h3 className="rm-perm-group-title">{mod.replace(/-/g, ' ')}</h3>
                    <table className="rm-perm-table">
                      <thead>
                        <tr>
                          <th>Permission Name</th>
                          <th>Action</th>
                          <th>Assigned Roles</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modPerms.map((perm) => {
                          const action = (perm.slug || '').split('.')[1] || '—';
                          const assignedCount = roles.filter(
                            (r) => r.permissions && r.permissions.some((p) => (p.slug || p) === perm.slug)
                          ).length;
                          return (
                            <tr key={perm.id}>
                              <td className="rm-perm-name">{perm.name || perm.slug}</td>
                              <td>
                                <span className={`rm-action-badge rm-action-${action}`}>
                                  {action}
                                </span>
                              </td>
                              <td>{assignedCount} role{assignedCount !== 1 ? 's' : ''}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="rm-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rm-modal-header">
              <h2>{editingRole ? 'Edit Role' : 'Add Role'}</h2>
              <button className="rm-modal-close" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>
            <div className="rm-modal-body">
              {error && <div className="rm-error">{error}</div>}
              <div className="rm-form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Content Manager"
                  className="rm-input"
                />
              </div>
              <div className="rm-form-group">
                <label>Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={handleSlugChange}
                  placeholder="auto-generated"
                  className="rm-input"
                />
              </div>
              <div className="rm-form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this role..."
                  className="rm-textarea"
                  rows={3}
                />
              </div>
              <div className="rm-form-group">
                <label>Permissions</label>
                <div className="rm-perm-groups">
                  {MODULES.map((mod) => {
                    const modulePerms = ACTIONS.map((a) => `${mod}.${a}`);
                    const allSelected = modulePerms.every((p) => formData.permissions.includes(p));
                    const someSelected = modulePerms.some((p) => formData.permissions.includes(p));
                    return (
                      <div key={mod} className="rm-perm-module">
                        <div className="rm-perm-module-header">
                          <label className="rm-checkbox-label">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={(el) => {
                                if (el) el.indeterminate = someSelected && !allSelected;
                              }}
                              onChange={() => toggleModuleAll(mod)}
                            />
                            <span className="rm-perm-module-name">{mod.replace(/-/g, ' ')}</span>
                          </label>
                        </div>
                        <div className="rm-perm-actions">
                          {ACTIONS.map((action) => {
                            const slug = `${mod}.${action}`;
                            return (
                              <label key={action} className="rm-checkbox-label rm-checkbox-action">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.includes(slug)}
                                  onChange={() => togglePerm(slug)}
                                />
                                <span>{action}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="rm-modal-footer">
              <button className="rm-btn rm-btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="rm-btn rm-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && deletingRole && (
        <div className="rm-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="rm-modal rm-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="rm-modal-header">
              <h2>Delete Role</h2>
              <button className="rm-modal-close" onClick={() => setShowDeleteModal(false)}>
                &times;
              </button>
            </div>
            <div className="rm-modal-body">
              <p>
                Are you sure you want to delete the role <strong>{deletingRole.name}</strong>?
              </p>
              {deletingRole.users_count > 0 && (
                <div className="rm-warning">
                  <AlertTriangle size={16} /> This role is assigned to {deletingRole.users_count} user(s). They will lose the
                  associated permissions.
                </div>
              )}
            </div>
            <div className="rm-modal-footer">
              <button className="rm-btn rm-btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="rm-btn rm-btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
