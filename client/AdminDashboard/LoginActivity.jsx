import { useState, useEffect } from 'react';
import { loginActivityService, userService } from '../services/api';
import { Download, BarChart2, CheckCircle, XCircle, Users, ClipboardList, Monitor, Smartphone, Tablet } from 'lucide-react';
import './LoginActivity.css';

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '—';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

function getDeviceIcon(device) {
  if (!device) return <Monitor size={16} />;
  const lower = device.toLowerCase();
  if (lower.includes('iphone') || lower.includes('android') && lower.includes('mobile')) return <Smartphone size={16} />;
  if (lower.includes('ipad') || lower.includes('tablet')) return <Tablet size={16} />;
  return <Monitor size={16} />;
}

const PAGE_SIZE = 15;

export default function LoginActivity() {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({ total: 0, successful: 0, failed: 0, unique_users: 0 });
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    user_id: '',
    status: '',
    ip_address: '',
    date_from: '',
    date_to: '',
  });
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailActivities, setDetailActivities] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const loadAll = async () => {
      setLoading(true);
      try {
        const params = { page, per_page: PAGE_SIZE };
        if (filters.user_id) params.user_id = filters.user_id;
        if (filters.status) params.status = filters.status;
        if (filters.ip_address) params.ip_address = filters.ip_address;
        if (filters.date_from) params.date_from = filters.date_from;
        if (filters.date_to) params.date_to = filters.date_to;

        const [actRes, statsRes, onlineRes] = await Promise.all([
          loginActivityService.getAll(params),
          loginActivityService.getStats(params),
          loginActivityService.getOnlineUsers(),
        ]);

        if (!cancelled) {
          const actData = actRes.data;
          setActivities(actData.data || actData || []);
          setTotalPages(actData.last_page || actData.meta?.last_page || 1);

          const sData = statsRes.data.data || statsRes.data || {};
          setStats({
            total: sData.total || 0,
            successful: sData.successful || sData.success || 0,
            failed: sData.failed || 0,
            unique_users: sData.unique_users || 0,
          });

          setOnlineUsers(onlineRes.data.data || onlineRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load activity:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadAll();
    return () => { cancelled = true; };
  }, [page, filters]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await userService.getAll({ per_page: 200 });
        setUsers(res.data.data || res.data || []);
      } catch (err) {
        console.error('Failed to load users:', err);
      }
    };
    loadUsers();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ user_id: '', status: '', ip_address: '', date_from: '', date_to: '' });
    setPage(1);
  };

  const openDetail = async (userId) => {
    if (!userId) return;
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const res = await loginActivityService.getUserActivity(userId);
      const data = res.data.data || res.data || [];
      setDetailActivities(data);
    } catch (err) {
      console.error('Failed to load user activity:', err);
      setDetailActivities([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ['User', 'Email', 'IP Address', 'Device', 'Browser', 'OS', 'Status', 'Time'];
    const rows = activities.map((a) => [
      a.user?.name || '',
      a.user?.email || '',
      a.ip_address || '',
      a.device || '',
      a.browser || '',
      a.os || '',
      a.status || '',
      a.created_at || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `login-activity-${formatDate(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <div className="la-container">
      <div className="la-header">
        <h1 className="la-title">Login Activity</h1>
        <button className="la-btn la-btn-outline" onClick={handleExport}>
          <Download size={16} /> Export
        </button>
      </div>

      <div className="la-stats">
        <div className="la-stat-card">
          <BarChart2 className="la-stat-icon" size={24} />
          <div className="la-stat-info">
            <span className="la-stat-value">{stats.total}</span>
            <span className="la-stat-label">Total Logins</span>
          </div>
        </div>
        <div className="la-stat-card la-stat-success">
          <CheckCircle className="la-stat-icon" size={24} />
          <div className="la-stat-info">
            <span className="la-stat-value">{stats.successful}</span>
            <span className="la-stat-label">Successful</span>
          </div>
        </div>
        <div className="la-stat-card la-stat-danger">
          <XCircle className="la-stat-icon" size={24} />
          <div className="la-stat-info">
            <span className="la-stat-value">{stats.failed}</span>
            <span className="la-stat-label">Failed</span>
          </div>
        </div>
        <div className="la-stat-card la-stat-info-card">
          <Users className="la-stat-icon" size={24} />
          <div className="la-stat-info">
            <span className="la-stat-value">{stats.unique_users}</span>
            <span className="la-stat-label">Unique Users</span>
          </div>
        </div>
      </div>

      <div className="la-filters">
        <div className="la-filter-row">
          <select
            className="la-filter-select"
            value={filters.user_id}
            onChange={(e) => handleFilterChange('user_id', e.target.value)}
          >
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <select
            className="la-filter-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
          <input
            type="text"
            className="la-filter-input"
            placeholder="Search IP address..."
            value={filters.ip_address}
            onChange={(e) => handleFilterChange('ip_address', e.target.value)}
          />
          <input
            type="date"
            className="la-filter-date"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
          />
          <input
            type="date"
            className="la-filter-date"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
          />
          {hasActiveFilters && (
            <button className="la-btn la-btn-ghost" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="la-table-wrap">
        {loading ? (
          <div className="la-loading">
            <p>Loading activity...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="la-empty">
            <ClipboardList className="la-empty-icon" size={48} />
            <h3>No login activity found</h3>
            <p>Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <>
            <table className="la-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>IP Address</th>
                  <th>Device</th>
                  <th>Browser</th>
                  <th>OS</th>
                  <th>Status</th>
                  <th>Login Time</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr
                    key={activity.id}
                    className="la-table-row"
                    onClick={() => activity.user?.id && openDetail(activity.user.id)}
                  >
                    <td>
                      <div className="la-user-cell">
                        <div className="la-user-avatar">
                          {(activity.user?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="la-user-info">
                          <span className="la-user-name">{activity.user?.name || 'Unknown'}</span>
                          <span className="la-user-email">{activity.user?.email || ''}</span>
                        </div>
                      </div>
                    </td>
                    <td className="la-mono">{activity.ip_address || '—'}</td>
                    <td>
                      <span className="la-device">
                        {getDeviceIcon(activity.device)} {activity.device || '—'}
                      </span>
                    </td>
                    <td>{activity.browser || '—'}</td>
                    <td>{activity.os || '—'}</td>
                    <td>
                      <span className={`la-status-badge la-status-${activity.status}`}>
                        {activity.status === 'success' ? 'Success' : activity.status === 'failed_2fa' ? 'Failed 2FA' : 'Failed'}
                      </span>
                    </td>
                    <td className="la-datetime">{formatDateTime(activity.created_at)}</td>
                    <td>{formatDuration(activity.duration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="la-pagination">
                <button
                  className="la-page-btn"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Prev
                </button>
                <span className="la-page-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="la-page-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="la-online-section">
        <h2 className="la-online-title">
          <span className="la-online-dot" /> Online Users ({onlineUsers.length})
        </h2>
        <div className="la-online-grid">
          {onlineUsers.length === 0 ? (
            <p className="la-online-empty">No users currently online.</p>
          ) : (
            onlineUsers.map((u) => (
              <div key={u.id || u.user_id} className="la-online-card">
                <div className="la-online-avatar">
                  {(u.name || u.user?.name || 'U').charAt(0).toUpperCase()}
                  <span className="la-online-indicator" />
                </div>
                <div className="la-online-info">
                  <span className="la-online-name">{u.name || u.user?.name || 'Unknown'}</span>
                  <span className="la-online-email">{u.email || u.user?.email || ''}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showDetailModal && (
        <div className="la-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="la-modal la-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="la-modal-header">
              <h2>User Login History</h2>
              <button className="la-modal-close" onClick={() => setShowDetailModal(false)}>
                &times;
              </button>
            </div>
            <div className="la-modal-body">
              {detailLoading ? (
                <div className="la-loading">
                  <p>Loading history...</p>
                </div>
              ) : detailActivities.length === 0 ? (
                <p className="la-empty-text">No activity recorded for this user.</p>
              ) : (
                <table className="la-table la-table-compact">
                  <thead>
                    <tr>
                      <th>IP Address</th>
                      <th>Device</th>
                      <th>Browser</th>
                      <th>OS</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailActivities.map((a) => (
                      <tr key={a.id}>
                        <td className="la-mono">{a.ip_address || '—'}</td>
                        <td>{getDeviceIcon(a.device)} {a.device || '—'}</td>
                        <td>{a.browser || '—'}</td>
                        <td>{a.os || '—'}</td>
                        <td>
                          <span className={`la-status-badge la-status-${a.status}`}>
                            {a.status === 'success' ? 'Success' : a.status === 'failed_2fa' ? 'Failed 2FA' : 'Failed'}
                          </span>
                        </td>
                        <td className="la-datetime">{formatDateTime(a.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="la-modal-footer">
              <button className="la-btn la-btn-secondary" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
