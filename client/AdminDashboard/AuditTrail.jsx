import { useState, useEffect, useCallback } from 'react';
import api from '../context/api';

const auditLogService = {
  getAll: (params) => api.get('/audit-logs', { params }),
  getById: (id) => api.get(`/audit-logs/${id}`),
  getEntityHistory: (entityType, entityId) => api.get(`/audit-logs/entity/${entityType}/${entityId}`),
  getModuleHistory: (module) => api.get(`/audit-logs/module/${module}`),
  getUserHistory: (userId) => api.get(`/audit-logs/user/${userId}`),
};
import { ClipboardList, Clock, AlertTriangle, X } from 'lucide-react';
import './AuditTrail.css';

const MODULES = [
  { value: '', label: 'All Modules' },
  { value: 'users', label: 'Users' },
  { value: 'roles', label: 'Roles' },
  { value: 'permissions', label: 'Permissions' },
  { value: 'sessions', label: 'Sessions' },
  { value: 'login-activity', label: 'Login Activity' },
];

const ACTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'deleted', label: 'Deleted' },
  { value: 'approved', label: 'Approved' },
];

const PAGE_SIZES = [10, 25, 50, 100];

function formatTimestamp(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function getChangedFields(oldValues, newValues) {
  if (!oldValues || !newValues) return [];
  const oldObj = typeof oldValues === 'string' ? JSON.parse(oldValues) : oldValues;
  const newObj = typeof newValues === 'string' ? JSON.parse(newValues) : newValues;
  const fields = [];
  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
  for (const key of allKeys) {
    const oldVal = oldObj?.[key];
    const newVal = newObj?.[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      fields.push({
        field: key,
        oldValue: oldVal !== undefined ? String(oldVal) : '—',
        newValue: newVal !== undefined ? String(newVal) : '—',
      });
    }
  }
  return fields;
}

export default function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [entityHistoryModal, setEntityHistoryModal] = useState(null);
  const [entityHistoryData, setEntityHistoryData] = useState([]);
  const [entityHistoryLoading, setEntityHistoryLoading] = useState(false);

  const [filters, setFilters] = useState({
    user: '',
    module: '',
    action: '',
    search: '',
    dateFrom: '',
    dateTo: '',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    totalPages: 1,
    total: 0,
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        per_page: pagination.pageSize,
      };
      if (filters.user) params.user = filters.user;
      if (filters.module) params.module = filters.module;
      if (filters.action) params.action = filters.action;
      if (filters.search) params.search = filters.search;
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;

      const res = await auditLogService.getAll(params);
      const data = res.data;
      setLogs(data.data || data.logs || data || []);
      setPagination((prev) => ({
        ...prev,
        totalPages: data.last_page || data.total_pages || 1,
        total: data.total || 0,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({ user: '', module: '', action: '', search: '', dateFrom: '', dateTo: '' });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    setExpandedRow(null);
  };

  const handlePageSizeChange = (e) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: parseInt(e.target.value, 10),
      page: 1,
    }));
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleViewHistory = async (log) => {
    const entityType = log.module || log.entity_type;
    const entityId = log.entity_id || log.entity?.id;
    if (!entityType || !entityId) return;

    setEntityHistoryModal({
      title: `History: ${entityType} #${entityId}`,
      entityType,
      entityId,
    });
    setEntityHistoryLoading(true);
    try {
      const res = await auditLogService.getEntityHistory(entityType, entityId);
      setEntityHistoryData(res.data?.data || res.data || []);
    } catch (err) {
      setEntityHistoryData([]);
    } finally {
      setEntityHistoryLoading(false);
    }
  };

  const handleExport = () => {
    const params = {};
    if (filters.user) params.user = filters.user;
    if (filters.module) params.module = filters.module;
    if (filters.action) params.action = filters.action;
    if (filters.search) params.search = filters.search;
    if (filters.dateFrom) params.date_from = filters.dateFrom;
    if (filters.dateTo) params.date_to = filters.dateTo;

    const query = new URLSearchParams(params).toString();
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/audit-logs/export?${query}`;
    window.open(url, '_blank');
  };

  const totalPages = pagination.totalPages;
  const startItem = (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return (
    <div className="audit-trail-page">
      <div className="audit-trail-header">
        <h1>Audit Trail</h1>
        <div className="audit-trail-header-actions">
          <div className="date-range-inline">
            <label>From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
            <label>To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
          <button className="btn-export" onClick={handleExport}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {error && <div className="audit-trail-error"><AlertTriangle size={16} /> {error}</div>}

      <div className="audit-trail-filters">
        <div className="filter-group">
          <label>User</label>
          <input
            type="text"
            placeholder="Filter by user..."
            value={filters.user}
            onChange={(e) => handleFilterChange('user', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Module</label>
          <select
            value={filters.module}
            onChange={(e) => handleFilterChange('module', e.target.value)}
          >
            {MODULES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Action</label>
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          >
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group filter-group-search">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search logs..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        <div className="filter-group" style={{ justifyContent: 'flex-end' }}>
          <label>&nbsp;</label>
          <button
            className="btn-export"
            onClick={handleClearFilters}
            style={{ fontSize: '12px', padding: '8px 12px' }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="audit-trail-table-wrapper">
        {loading ? (
          <div className="audit-trail-loading">
            Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="audit-trail-empty">
            <ClipboardList className="empty-icon" size={48} />
            <h3>No audit logs found</h3>
            <p>Try adjusting your filters or date range.</p>
          </div>
        ) : (
          <>
            <table className="audit-trail-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Entity</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const isExpanded = expandedRow === log.id;
                  return (
                    <AuditLogRow
                      key={log.id}
                      log={log}
                      isExpanded={isExpanded}
                      onToggle={() => toggleRow(log.id)}
                      onViewHistory={() => handleViewHistory(log)}
                    />
                  );
                })}
              </tbody>
            </table>

            <div className="audit-trail-pagination">
              <div className="pagination-info">
                Showing <span>{startItem}</span>–<span>{endItem}</span> of <span>{pagination.total}</span> logs
              </div>
              <div className="pagination-buttons">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  ‹ Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 4) {
                    pageNum = i + 1;
                  } else if (pagination.page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = pagination.page - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      className={pagination.page === pageNum ? 'active' : ''}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  disabled={pagination.page >= totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next ›
                </button>
              </div>
              <div className="page-size-selector">
                <label>Show</label>
                <select value={pagination.pageSize} onChange={handlePageSizeChange}>
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <label>per page</label>
              </div>
            </div>
          </>
        )}
      </div>

      {entityHistoryModal && (
        <EntityHistoryModal
          title={entityHistoryModal.title}
          entries={entityHistoryData}
          loading={entityHistoryLoading}
          onClose={() => {
            setEntityHistoryModal(null);
            setEntityHistoryData([]);
          }}
        />
      )}
    </div>
  );
}

function AuditLogRow({ log, isExpanded, onToggle, onViewHistory }) {
  const changedFields = getChangedFields(log.old_values, log.new_values);

  return (
    <>
      <tr
        className={isExpanded ? 'expanded' : ''}
        onClick={onToggle}
      >
        <td className="col-timestamp">{formatTimestamp(log.created_at || log.timestamp)}</td>
        <td className="col-user">{log.user?.name || log.user_name || '—'}</td>
        <td>
          <span className={`action-badge ${log.action}`}>{log.action}</span>
        </td>
        <td className="col-module">{log.module || log.entity_type || '—'}</td>
        <td className="col-entity">{log.entity || log.entity_id || '—'}</td>
        <td className="col-description" title={log.description}>{log.description || '—'}</td>
        <td className="col-actions" onClick={(e) => e.stopPropagation()}>
          <button className="btn-view-details" onClick={onToggle}>
            {isExpanded ? '▾ Hide' : '▸ Details'}
          </button>
          <button className="btn-view-history" onClick={onViewHistory}>
            <Clock size={14} /> History
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="detail-row">
          <td colSpan="7">
            <div className="detail-panel">
              <div className="detail-panel-header">
                <h3>Change Details</h3>
                <button className="detail-panel-close" onClick={onToggle}><X size={16} /></button>
              </div>

              {changedFields.length > 0 ? (
                <div className="detail-section">
                  <div className="detail-section-title">Changed Fields</div>
                  <table className="diff-table">
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Old Value</th>
                        <th style={{ width: '40px' }}></th>
                        <th>New Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {changedFields.map((field) => (
                        <tr key={field.field}>
                          <td className="field-name">{field.field}</td>
                          <td className="old-value">{field.oldValue}</td>
                          <td className="diff-arrow">→</td>
                          <td className="new-value">{field.newValue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="detail-section">
                  <span className="no-changes-text">No field changes recorded for this entry.</span>
                </div>
              )}

              <div className="detail-section">
                <div className="detail-section-title">Metadata</div>
                <div className="detail-meta">
                  <div className="detail-meta-item">
                    <span className="detail-meta-label">IP Address</span>
                    <span className="detail-meta-value">{log.ip_address || log.ip || '—'}</span>
                  </div>
                  <div className="detail-meta-item">
                    <span className="detail-meta-label">User Agent</span>
                    <span className="detail-meta-value" style={{ maxWidth: '400px', wordBreak: 'break-all' }}>
                      {log.user_agent || '—'}
                    </span>
                  </div>
                  <div className="detail-meta-item">
                    <span className="detail-meta-label">Log ID</span>
                    <span className="detail-meta-value">{log.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function EntityHistoryModal({ title, entries, loading, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="entity-history-modal-overlay" onClick={onClose}>
      <div className="entity-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="entity-history-modal-header">
          <h2>{title}</h2>
          <button className="entity-history-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="entity-history-modal-body">
          {loading ? (
            <div className="audit-trail-loading">
              Loading entity history...
            </div>
          ) : entries.length === 0 ? (
            <div className="audit-trail-empty">
              <p>No history entries found for this entity.</p>
            </div>
          ) : (
            <div className="entity-history-timeline">
              {entries.map((entry) => {
                const changedFields = getChangedFields(entry.old_values, entry.new_values);
                return (
                  <div key={entry.id} className="entity-history-entry">
                    <div className="entity-history-entry-header">
                      <span className={`action-badge ${entry.action}`}>{entry.action}</span>
                      <div className="entity-history-entry-meta">
                        <span>{entry.user?.name || entry.user_name || '—'}</span>
                        <span>{formatTimestamp(entry.created_at || entry.timestamp)}</span>
                      </div>
                    </div>
                    <div className="entity-history-entry-changes">
                      {changedFields.length > 0 ? (
                        <table className="diff-table">
                          <thead>
                            <tr>
                              <th>Field</th>
                              <th>Old</th>
                              <th style={{ width: '30px' }}></th>
                              <th>New</th>
                            </tr>
                          </thead>
                          <tbody>
                            {changedFields.map((f) => (
                              <tr key={f.field}>
                                <td className="field-name">{f.field}</td>
                                <td className="old-value">{f.oldValue}</td>
                                <td className="diff-arrow">→</td>
                                <td className="new-value">{f.newValue}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <span className="no-changes-text">No field changes recorded.</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
