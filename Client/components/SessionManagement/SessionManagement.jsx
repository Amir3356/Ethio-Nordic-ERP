import { useState, useEffect, useCallback } from 'react';
import { sessionService } from '../../services/api';
import { Monitor, Smartphone, Tablet, Users, AlertTriangle, X, XCircle, LogOut } from 'lucide-react';
import './SessionManagement.css';

const DEVICE_TYPES = [
  { value: '', label: 'All Devices' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'tablet', label: 'Tablet' },
];

const PAGE_SIZES = [10, 25, 50];

function getDeviceIcon(type) {
  switch (type) {
    case 'mobile': return <Smartphone size={16} />;
    case 'tablet': return <Tablet size={16} />;
    default: return <Monitor size={16} />;
  }
}

function getDeviceLabel(type) {
  switch (type) {
    case 'mobile': return 'Mobile';
    case 'tablet': return 'Tablet';
    default: return 'Desktop';
  }
}

function formatRelativeTime(ts) {
  if (!ts) return '—';
  const now = Date.now();
  const then = new Date(ts).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function SessionManagement() {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    user: '',
    deviceType: '',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    totalPages: 1,
    total: 0,
  });

  const [confirmModal, setConfirmModal] = useState(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        per_page: pagination.pageSize,
      };
      if (filters.user) params.user = filters.user;
      if (filters.deviceType) params.device_type = filters.deviceType;

      const res = await sessionService.getAll(params);
      const data = res.data;
      setSessions(data.data || data.sessions || data || []);
      setPagination((prev) => ({
        ...prev,
        totalPages: data.last_page || data.total_pages || 1,
        total: data.total || 0,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sessions.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await sessionService.getStats();
      setStats(res.data);
    } catch {
      // Stats are optional; don't block on failure
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (e) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: parseInt(e.target.value, 10),
      page: 1,
    }));
  };

  const handleRefresh = () => {
    fetchSessions();
    fetchStats();
  };

  const handleTerminateSession = (session) => {
    setConfirmModal({
      type: 'terminate',
      title: 'Terminate Session',
      message: `Are you sure you want to terminate the session for <strong>${session.user?.name || 'this user'}</strong> on <strong>${getDeviceIcon(session.device_type)} ${getDeviceLabel(session.device_type)}</strong> (${session.browser || 'Unknown Browser'})?`,
      sessionId: session.token_id || session.id,
      userId: session.user?.id,
      userName: session.user?.name,
    });
  };

  const handleForceLogout = (session) => {
    setConfirmModal({
      type: 'forceLogout',
      title: 'Force Logout User',
      message: `Are you sure you want to force logout <strong>${session.user?.name || 'this user'}</strong>? This will terminate <strong>all active sessions</strong> for this user across all devices.`,
      userId: session.user?.id,
      userName: session.user?.name,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    try {
      if (confirmModal.type === 'terminate') {
        await sessionService.delete(confirmModal.sessionId);
      } else if (confirmModal.type === 'forceLogout') {
        await sessionService.forceLogout(confirmModal.userId);
      }
      setConfirmModal(null);
      handleRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed. Please try again.');
      setConfirmModal(null);
    }
  };

  const totalPages = pagination.totalPages;
  const startItem = (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.page * pagination.pageSize, pagination.total);

  const totalSessions = stats?.total_sessions ?? stats?.total ?? sessions.length;
  const uniqueUsers = stats?.unique_users ?? 0;
  const desktopCount = stats?.desktop ?? stats?.by_device?.desktop ?? 0;
  const mobileCount = stats?.mobile ?? stats?.by_device?.mobile ?? 0;
  const tabletCount = stats?.tablet ?? stats?.by_device?.tablet ?? 0;
  const maxBar = Math.max(desktopCount, mobileCount, tabletCount, 1);

  return (
    <div className="session-management-page">
      <div className="session-management-header">
        <h1>Session Management</h1>
        <button className="btn-refresh" onClick={handleRefresh}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Refresh
        </button>
      </div>

      {error && <div className="session-error"><AlertTriangle size={16} /> {error}</div>}

      <div className="session-stats-row">
        <div className="session-stat-card">
          <Monitor className="session-stat-icon total" size={24} />
          <div className="session-stat-info">
            <span className="session-stat-value">{totalSessions}</span>
            <span className="session-stat-label">Total Active Sessions</span>
          </div>
        </div>
        <div className="session-stat-card">
          <Users className="session-stat-icon unique" size={24} />
          <div className="session-stat-info">
            <span className="session-stat-value">{uniqueUsers}</span>
            <span className="session-stat-label">Unique Users</span>
          </div>
        </div>
        <div className="session-stat-card">
          <Monitor className="session-stat-icon desktop" size={24} />
          <div className="session-stat-info">
            <span className="session-stat-value">{desktopCount}</span>
            <span className="session-stat-label">Desktop Sessions</span>
          </div>
        </div>
        <div className="session-stat-card">
          <Smartphone className="session-stat-icon mobile" size={24} />
          <div className="session-stat-info">
            <span className="session-stat-value">{mobileCount}</span>
            <span className="session-stat-label">Mobile Sessions</span>
          </div>
        </div>
      </div>

      <div className="session-filters">
        <div className="session-filter-group session-filter-search">
          <label>User</label>
          <input
            type="text"
            placeholder="Filter by user name or email..."
            value={filters.user}
            onChange={(e) => handleFilterChange('user', e.target.value)}
          />
        </div>
        <div className="session-filter-group">
          <label>Device Type</label>
          <select
            value={filters.deviceType}
            onChange={(e) => handleFilterChange('deviceType', e.target.value)}
          >
            {DEVICE_TYPES.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="session-table-wrapper">
        {loading ? (
          <div className="session-loading">
            <div className="spinner-small"></div>
            Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="session-empty">
            <Monitor className="empty-icon" size={48} />
            <h3>No active sessions found</h3>
            <p>No sessions match your current filters.</p>
          </div>
        ) : (
          <>
            <table className="session-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Device</th>
                  <th>Browser</th>
                  <th>OS</th>
                  <th>IP Address</th>
                  <th>Last Activity</th>
                  <th>Token</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id || session.token_id}>
                    <td>
                      <div className="session-user-cell">
                        <span className="session-user-name">{session.user?.name || session.user_name || '—'}</span>
                        <span className="session-user-email">{session.user?.email || session.user_email || ''}</span>
                      </div>
                    </td>
                    <td>
                      <span className="session-device-text">
                        <span className="session-device-icon">{getDeviceIcon(session.device_type)}</span>
                        {getDeviceLabel(session.device_type)}
                      </span>
                    </td>
                    <td className="session-browser">{session.browser || '—'}</td>
                    <td className="session-os">{session.os || '—'}</td>
                    <td className="session-ip">{session.ip_address || session.ip || '—'}</td>
                    <td className="session-activity" title={session.last_activity || session.updated_at}>
                      {formatRelativeTime(session.last_activity || session.updated_at)}
                    </td>
                    <td className="session-token-name" title={session.token_name || session.name}>
                      {session.token_name || session.name || '—'}
                    </td>
                    <td className="session-actions-cell">
                      <button
                        className="btn-terminate"
                        onClick={() => handleTerminateSession(session)}
                      >
                        <XCircle size={14} /> Terminate
                      </button>
                      <button
                        className="btn-force-logout"
                        onClick={() => handleForceLogout(session)}
                      >
                        <LogOut size={14} /> Force Logout
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="session-pagination">
              <div className="session-pagination-info">
                Showing <span>{startItem}</span>–<span>{endItem}</span> of <span>{pagination.total}</span> sessions
              </div>
              <div className="session-pagination-buttons">
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
              <div className="session-pagination-page-size">
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

      <div className="session-chart-section">
        <h3 className="session-chart-title">Sessions by Device Type</h3>
        <div className="session-chart">
          <div className="session-chart-bar-group">
            <div
              className="session-chart-bar desktop"
              style={{ height: `${(desktopCount / maxBar) * 100}%` }}
            >
              <span className="session-chart-bar-value">{desktopCount}</span>
            </div>
            <span className="session-chart-bar-label"><Monitor size={14} /> Desktop</span>
          </div>
          <div className="session-chart-bar-group">
            <div
              className="session-chart-bar mobile"
              style={{ height: `${(mobileCount / maxBar) * 100}%` }}
            >
              <span className="session-chart-bar-value">{mobileCount}</span>
            </div>
            <span className="session-chart-bar-label"><Smartphone size={14} /> Mobile</span>
          </div>
          <div className="session-chart-bar-group">
            <div
              className="session-chart-bar tablet"
              style={{ height: `${(tabletCount / maxBar) * 100}%` }}
            >
              <span className="session-chart-bar-value">{tabletCount}</span>
            </div>
            <span className="session-chart-bar-label"><Tablet size={14} /> Tablet</span>
          </div>
        </div>
        <div className="session-chart-legend">
          <div className="session-chart-legend-item">
            <span className="session-chart-legend-dot desktop"></span>
            Desktop
          </div>
          <div className="session-chart-legend-item">
            <span className="session-chart-legend-dot mobile"></span>
            Mobile
          </div>
          <div className="session-chart-legend-item">
            <span className="session-chart-legend-dot tablet"></span>
            Tablet
          </div>
        </div>
      </div>

      {confirmModal && (
        <div className="confirm-modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-header">
              <h3>{confirmModal.title}</h3>
              <button className="confirm-modal-close" onClick={() => setConfirmModal(null)}><X size={16} /></button>
            </div>
            <div className="confirm-modal-body" dangerouslySetInnerHTML={{ __html: confirmModal.message }} />
            <div className="confirm-modal-footer">
              <button className="btn-cancel" onClick={() => setConfirmModal(null)}>Cancel</button>
              <button className="btn-confirm-terminate" onClick={handleConfirmAction}>
                {confirmModal.type === 'terminate' ? 'Terminate Session' : 'Force Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
