import { useState, useEffect, useCallback } from 'react';
import { userService, roleService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Search, AlertTriangle, UserCircle, Pencil, Lock, Unlock, Key, Trash2 } from 'lucide-react';
import './UserManagement.css';

const ITEMS_PER_PAGE = 10;

export default function UserManagement() {
  const { canPerform } = useAuth();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkBar, setShowBulkBar] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [detailPermissions, setDetailPermissions] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role_ids: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const canManage = canPerform('users', 'manage');
  const canCreate = canPerform('users', 'create');
  const canEdit = canPerform('users', 'edit');
  const canDelete = canPerform('users', 'delete');

  useEffect(() => {
    fetchMetaData();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [search, filterRole, filterStatus, currentPage]);

  const fetchMetaData = async () => {
    try {
      const rolesRes = await roleService.getAll();
      if (rolesRes.status === 'fulfilled' || rolesRes.data) {
        const rData = rolesRes.data?.data || rolesRes.data;
        setRoles(Array.isArray(rData) ? rData : rData.roles || []);
      }
    } catch {
      // non-critical
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        per_page: ITEMS_PER_PAGE,
      };
      if (search) params.search = search;
      if (filterRole) params.role_id = filterRole;
      if (filterStatus) params.is_active = filterStatus === 'active';

      const res = await userService.getAll(params);
      const data = res.data.data || res.data;
      setUsers(Array.isArray(data) ? data : data.users || []);
      setTotalPages(data.last_page || data.total_pages || Math.ceil((data.total || 0) / ITEMS_PER_PAGE) || 1);
      setTotalCount(data.total || data.count || (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setFilterRole('');
    setFilterStatus('');
    setCurrentPage(1);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(users.map((u) => u.id));
      setSelectedIds(allIds);
      setShowBulkBar(allIds.size > 0);
    } else {
      setSelectedIds(new Set());
      setShowBulkBar(false);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      setShowBulkBar(next.size > 0);
      return next;
    });
  };

  const openAddModal = () => {
    setFormData({ name: '', email: '', phone: '', role_ids: [] });
    setFormErrors({});
    setShowAddModal(true);
  };

  const openEditModal = (user) => {
    setCurrentUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role_ids: user.roles ? user.roles.map((r) => r.id) : [],
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setCurrentUser(user);
    setShowDeleteModal(true);
  };

  const openDetailModal = async (user) => {
    setDetailUser(user);
    setShowDetailModal(true);
    try {
      const res = await userService.getPermissions(user.id);
      const pData = res.data.data || res.data;
      setDetailPermissions(Array.isArray(pData) ? pData : pData.permissions || []);
    } catch {
      setDetailPermissions([]);
    }
  };

  const handleFormChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleRoleToggle = (roleId) => {
    setFormData((prev) => {
      const ids = prev.role_ids.includes(roleId)
        ? prev.role_ids.filter((id) => id !== roleId)
        : [...prev.role_ids, roleId];
      return { ...prev, role_ids: ids };
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (showEditModal && currentUser) {
        await userService.update(currentUser.id, formData);
      } else {
        await userService.create(formData);
      }
      setShowAddModal(false);
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed';
      setFormErrors({ submit: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser) return;
    setSubmitting(true);
    try {
      await userService.delete(currentUser.id);
      setShowDeleteModal(false);
      setCurrentUser(null);
      fetchUsers();
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.message || 'Delete failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      if (user.is_active) {
        await userService.deactivate(user.id);
      } else {
        await userService.activate(user.id);
      }
      fetchUsers();
    } catch {
      // silently fail
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.size === 0) return;
    try {
      await userService.bulkAction({
        action,
        user_ids: Array.from(selectedIds),
      });
      setSelectedIds(new Set());
      setShowBulkBar(false);
      fetchUsers();
    } catch {
      // silently fail
    }
  };

  const getRoleName = (role) => role.name || role.title || 'Unknown';

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="um">
      {/* Header */}
      <div className="um-header">
        <div className="um-header-left">
          <h1 className="um-title">User Management</h1>
          <span className="um-count">{totalCount} users</span>
        </div>
        {canCreate && (
          <button className="um-btn um-btn--primary" onClick={openAddModal}>
            <span className="um-btn-icon">+</span>
            Add User
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="um-filters">
        <div className="um-search-wrapper">
          <Search size={18} className="um-search-icon" />
          <input
            type="text"
            className="um-search"
            placeholder="Search users..."
            value={search}
            onChange={handleSearch}
          />
        </div>
        <select
          className="um-filter-select"
          value={filterRole}
          onChange={handleFilterChange(setFilterRole)}
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          className="um-filter-select"
          value={filterStatus}
          onChange={handleFilterChange(setFilterStatus)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
            {(search || filterRole || filterStatus) && (
          <button className="um-btn um-btn--ghost" onClick={resetFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Bulk Action Bar */}
      {showBulkBar && selectedIds.size > 0 && (
        <div className="um-bulk-bar">
          <span className="um-bulk-count">{selectedIds.size} selected</span>
          {canManage && (
            <>
              <button
                className="um-btn um-btn--outline um-btn--sm"
                onClick={() => handleBulkAction('activate')}
              >
                Activate Selected
              </button>
              <button
                className="um-btn um-btn--outline um-btn--danger um-btn--sm"
                onClick={() => handleBulkAction('deactivate')}
              >
                Deactivate Selected
              </button>
            </>
          )}
          <button
            className="um-btn um-btn--ghost um-btn--sm"
            onClick={() => {
              setSelectedIds(new Set());
              setShowBulkBar(false);
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Table */}
      <div className="um-table-wrapper">
        {loading ? (
          <div className="um-loading">
            <div className="um-spinner">
              <div className="um-spinner-ring"></div>
              <div className="um-spinner-ring"></div>
              <div className="um-spinner-ring"></div>
            </div>
            <p>Loading users...</p>
          </div>
        ) : error ? (
          <div className="um-error">
            <AlertTriangle className="um-error-icon" size={48} />
            <p>{error}</p>
            <button className="um-btn um-btn--primary um-btn--sm" onClick={fetchUsers}>
              Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="um-empty">
            <UserCircle className="um-empty-icon" size={48} />
            <p>No users found</p>
        {(search || filterRole || filterStatus) && (
              <button className="um-btn um-btn--ghost" onClick={resetFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <table className="um-table">
            <thead>
              <tr>
                <th className="um-th-check">
                  <input
                    type="checkbox"
                    className="um-checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.size === users.length && users.length > 0}
                  />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Last Login</th>
                <th className="um-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={selectedIds.has(user.id) ? 'um-row-selected' : ''}>
                  <td className="um-td-check">
                    <input
                      type="checkbox"
                      className="um-checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={() => handleSelectOne(user.id)}
                    />
                  </td>
                  <td>
                    <div className="um-user-cell">
                      <div className="um-user-avatar">
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="um-user-name">{user.name}</span>
                    </div>
                  </td>
                  <td className="um-td-email">{user.email}</td>
                  <td>
                    <div className="um-role-badges">
                      {(user.roles || []).length === 0 && (
                        <span className="um-role-badge um-role-badge--none">No roles</span>
                      )}
                      {(user.roles || []).slice(0, 2).map((role) => (
                        <span key={role.id} className="um-role-badge">
                          {getRoleName(role)}
                        </span>
                      ))}
                      {(user.roles || []).length > 2 && (
                        <span className="um-role-badge um-role-badge--more">
                          +{user.roles.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`um-status-badge ${
                        user.is_active ? 'um-status-badge--active' : 'um-status-badge--inactive'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="um-td-time">{formatTime(user.last_login_at || user.last_login)}</td>
                  <td className="um-td-actions">
                    <div className="um-actions">
                      {canEdit && (
                        <button
                          className="um-action-btn"
                          title="Edit"
                          onClick={() => openEditModal(user)}
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      {canManage && (
                        <button
                          className={`um-action-btn ${
                            user.is_active ? 'um-action-btn--warn' : 'um-action-btn--success'
                          }`}
                          title={user.is_active ? 'Deactivate' : 'Activate'}
                          onClick={() => handleToggleActive(user)}
                        >
                          {user.is_active ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                      )}
                      <button
                        className="um-action-btn"
                        title="View Permissions"
                        onClick={() => openDetailModal(user)}
                      >
                        <Key size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="um-pagination">
          <button
            className="um-page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
          >
            «
          </button>
          <button
            className="um-page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            ‹
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let page;
            if (totalPages <= 7) {
              page = i + 1;
            } else if (currentPage <= 4) {
              page = i + 1;
            } else if (currentPage >= totalPages - 3) {
              page = totalPages - 6 + i;
            } else {
              page = currentPage - 3 + i;
            }
            return (
              <button
                key={page}
                className={`um-page-btn ${currentPage === page ? 'um-page-btn--active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            );
          })}
          <button
            className="um-page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            ›
          </button>
          <button
            className="um-page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
          >
            »
          </button>
          <span className="um-page-info">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="um-modal-overlay" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
          <div className="um-modal" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h2 className="um-modal-title">
                {showEditModal ? 'Edit User' : 'Add New User'}
              </h2>
              <button
                className="um-modal-close"
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
              >
                ×
              </button>
            </div>
            <div className="um-modal-body">
              {formErrors.submit && (
                <div className="um-form-error-banner">{formErrors.submit}</div>
              )}
              <div className="um-form-group">
                <label className="um-label">Full Name *</label>
                <input
                  type="text"
                  className={`um-input ${formErrors.name ? 'um-input--error' : ''}`}
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={handleFormChange('name')}
                />
                {formErrors.name && <span className="um-field-error">{formErrors.name}</span>}
              </div>
              <div className="um-form-group">
                <label className="um-label">Email *</label>
                <input
                  type="email"
                  className={`um-input ${formErrors.email ? 'um-input--error' : ''}`}
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={handleFormChange('email')}
                />
                {formErrors.email && <span className="um-field-error">{formErrors.email}</span>}
              </div>
              <div className="um-form-group">
                <label className="um-label">Phone</label>
                <input
                  type="tel"
                  className="um-input"
                  placeholder="+251 9XX XXX XXX"
                  value={formData.phone}
                  onChange={handleFormChange('phone')}
                />
              </div>
              <div className="um-form-group">
                <label className="um-label">Roles</label>
                <div className="um-role-checkboxes">
                  {roles.length === 0 ? (
                    <span className="um-no-roles">No roles available</span>
                  ) : (
                    roles.map((role) => (
                      <label key={role.id} className="um-role-checkbox">
                        <input
                          type="checkbox"
                          className="um-checkbox"
                          checked={formData.role_ids.includes(role.id)}
                          onChange={() => handleRoleToggle(role.id)}
                        />
                        <span className="um-role-checkbox-label">{role.name}</span>
                        {role.description && (
                          <span className="um-role-checkbox-desc">{role.description}</span>
                        )}
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="um-modal-footer">
              <button
                className="um-btn um-btn--ghost"
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
              >
                Cancel
              </button>
              <button
                className="um-btn um-btn--primary"
                onClick={handleSave}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : showEditModal ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentUser && (
        <div className="um-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="um-modal um-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h2 className="um-modal-title">Confirm Deletion</h2>
              <button className="um-modal-close" onClick={() => setShowDeleteModal(false)}>
                ×
              </button>
            </div>
            <div className="um-modal-body">
              {formErrors.submit && (
                <div className="um-form-error-banner">{formErrors.submit}</div>
              )}
              <div className="um-delete-content">
                <Trash2 className="um-delete-icon" size={48} />
                <p>
                  Are you sure you want to delete <strong>{currentUser.name}</strong>?
                </p>
                <p className="um-delete-warning">This action cannot be undone.</p>
              </div>
            </div>
            <div className="um-modal-footer">
              <button className="um-btn um-btn--ghost" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button
                className="um-btn um-btn--danger"
                onClick={handleDelete}
                disabled={submitting}
              >
                {submitting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showDetailModal && detailUser && (
        <div className="um-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="um-modal um-modal--lg" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h2 className="um-modal-title">User Details</h2>
              <button className="um-modal-close" onClick={() => setShowDetailModal(false)}>
                ×
              </button>
            </div>
            <div className="um-modal-body">
              <div className="um-detail-section">
                <div className="um-detail-avatar-lg">
                  {(detailUser.name || 'U').charAt(0).toUpperCase()}
                </div>
                <h3 className="um-detail-name">{detailUser.name}</h3>
                <p className="um-detail-email">{detailUser.email}</p>
              </div>

                <div className="um-detail-grid">
                <div className="um-detail-item">
                  <span className="um-detail-label">Phone</span>
                  <span className="um-detail-value">{detailUser.phone || '—'}</span>
                </div>
                <div className="um-detail-item">
                  <span className="um-detail-label">Status</span>
                  <span
                    className={`um-status-badge ${
                      detailUser.is_active ? 'um-status-badge--active' : 'um-status-badge--inactive'
                    }`}
                  >
                    {detailUser.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="um-detail-item">
                  <span className="um-detail-label">Last Login</span>
                  <span className="um-detail-value">
                    {formatTime(detailUser.last_login_at || detailUser.last_login)}
                  </span>
                </div>
              </div>

              <div className="um-detail-section">
                <h4 className="um-detail-section-title">Roles</h4>
                <div className="um-role-badges">
                  {(detailUser.roles || []).length === 0 ? (
                    <span className="um-text-muted">No roles assigned</span>
                  ) : (
                    detailUser.roles.map((role) => (
                      <span key={role.id} className="um-role-badge">
                        {getRoleName(role)}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="um-detail-section">
                <h4 className="um-detail-section-title">Permissions</h4>
                {detailPermissions.length === 0 ? (
                  <span className="um-text-muted">No permissions found</span>
                ) : (
                  <div className="um-permissions-list">
                    {detailPermissions.map((perm, idx) => (
                      <span key={perm.id || idx} className="um-permission-tag">
                        {perm.name || perm.slug || perm}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="um-modal-footer">
              <button className="um-btn um-btn--ghost" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
              {canEdit && (
                <button
                  className="um-btn um-btn--primary"
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(detailUser);
                  }}
                >
                  Edit User
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
