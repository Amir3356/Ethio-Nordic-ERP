import { useState, useEffect } from 'react';
import { Users, Monitor, Shield, AlertTriangle } from 'lucide-react';
import { dashboardService, loginActivityService, auditLogService } from '../../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loginActivity, setLoginActivity] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, loginRes, auditRes, onlineRes] = await Promise.allSettled([
        dashboardService.getStats(),
        loginActivityService.getAll({ limit: 5 }),
        auditLogService.getAll({ limit: 5 }),
        loginActivityService.getOnlineUsers(),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.data || statsRes.value.data);
      }
      if (loginRes.status === 'fulfilled') {
        const loginData = loginRes.value.data.data || loginRes.value.data;
        setLoginActivity(Array.isArray(loginData) ? loginData : loginData.activities || []);
      }
      if (auditRes.status === 'fulfilled') {
        const auditData = auditRes.value.data.data || auditRes.value.data;
        setAuditLogs(Array.isArray(auditData) ? auditData : auditData.logs || []);
      }
      if (onlineRes.status === 'fulfilled') {
        const onlineData = onlineRes.value.data.data || onlineRes.value.data;
        setOnlineUsers(Array.isArray(onlineData) ? onlineData : onlineData.users || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  const formatFullTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">
          <div className="dashboard-spinner">
            <div className="dashboard-spinner-ring"></div>
            <div className="dashboard-spinner-ring"></div>
            <div className="dashboard-spinner-ring"></div>
          </div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-error">
          <AlertTriangle className="dashboard-error-icon" size={48} />
          <h3>Failed to load dashboard</h3>
          <p>{error}</p>
          <button className="dashboard-retry-btn" onClick={fetchDashboardData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      key: 'totalUsers',
      icon: <Users size={24} />,
      label: 'Total Users',
      value: stats?.total_users ?? stats?.totalUsers ?? 0,
      link: '/users',
      linkText: 'View All',
      variant: 'users',
    },
    {
      key: 'activeSessions',
      icon: <Monitor size={24} />,
      label: 'Active Sessions',
      value: stats?.active_sessions ?? stats?.activeSessions ?? 0,
      link: null,
      variant: 'sessions',
    },
    {
      key: 'totalRoles',
      icon: <Shield size={24} />,
      label: 'Total Roles',
      value: stats?.total_roles ?? stats?.totalRoles ?? 0,
      link: '/roles',
      linkText: 'View All',
      variant: 'roles',
    },
    {
      key: 'failedLogins',
      icon: <AlertTriangle size={24} />,
      label: 'Failed Logins (24h)',
      value: stats?.failed_logins_24h ?? stats?.failedLogins24h ?? 0,
      link: '/login-activity',
      linkText: 'View Details',
      variant: 'warning',
      isWarning: (stats?.failed_logins_24h ?? stats?.failedLogins24h ?? 0) > 0,
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <button className="dashboard-refresh-btn" onClick={fetchDashboardData} title="Refresh">
          ↻
        </button>
      </div>

      <div className="dashboard-stats-grid">
        {statCards.map((card) => (
          <div
            key={card.key}
            className={`dashboard-stat-card dashboard-stat-card--${card.variant}${
              card.isWarning ? ' dashboard-stat-card--alert' : ''
            }`}
          >
            <div className="dashboard-stat-icon">{card.icon}</div>
            <div className="dashboard-stat-content">
              <span className="dashboard-stat-label">{card.label}</span>
              <span className="dashboard-stat-value">{card.value}</span>
            </div>
            {card.link && (
              <a href={card.link} className="dashboard-stat-link">
                {card.linkText || 'View'} →
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="dashboard-activity-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2 className="dashboard-card-title">Recent Login Activity</h2>
            <a href="/login-activity" className="dashboard-card-link">
              View All →
            </a>
          </div>
          <div className="dashboard-card-body">
            {loginActivity.length === 0 ? (
              <div className="dashboard-empty">No recent login activity</div>
            ) : (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>IP Address</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {loginActivity.slice(0, 5).map((entry, idx) => (
                    <tr key={entry.id || idx}>
                      <td className="dashboard-table-user">
                        <div className="dashboard-table-avatar">
                          {(entry.user?.name || entry.user_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span>{entry.user?.name || entry.user_name || 'Unknown'}</span>
                      </td>
                      <td className="dashboard-table-mono">{entry.ip_address || entry.ip || '—'}</td>
                      <td>
                        <span
                          className={`dashboard-badge ${
                            entry.status === 'success'
                              ? 'dashboard-badge--success'
                              : 'dashboard-badge--danger'
                          }`}
                        >
                          {entry.status === 'success' ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="dashboard-table-time">
                        {formatFullTime(entry.created_at || entry.timestamp)}
                        <span className="dashboard-table-time-relative">
                          {formatTime(entry.created_at || entry.timestamp)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2 className="dashboard-card-title">Recent Audit Logs</h2>
            <a href="/audit-trail" className="dashboard-card-link">
              View All →
            </a>
          </div>
          <div className="dashboard-card-body">
            {auditLogs.length === 0 ? (
              <div className="dashboard-empty">No recent audit logs</div>
            ) : (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Module</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.slice(0, 5).map((entry, idx) => (
                    <tr key={entry.id || idx}>
                      <td className="dashboard-table-user">
                        <div className="dashboard-table-avatar">
                          {(entry.user?.name || entry.user_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span>{entry.user?.name || entry.user_name || 'Unknown'}</span>
                      </td>
                      <td>
                        <span className="dashboard-action-text">{entry.action || '—'}</span>
                      </td>
                      <td>
                        <span className="dashboard-module-badge">{entry.module || '—'}</span>
                      </td>
                      <td className="dashboard-table-time">
                        {formatFullTime(entry.created_at || entry.timestamp)}
                        <span className="dashboard-table-time-relative">
                          {formatTime(entry.created_at || entry.timestamp)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-card dashboard-online-card">
        <div className="dashboard-card-header">
          <h2 className="dashboard-card-title">Online Users</h2>
          <span className="dashboard-online-count">{onlineUsers.length} online</span>
        </div>
        <div className="dashboard-card-body">
          {onlineUsers.length === 0 ? (
            <div className="dashboard-empty">No users currently online</div>
          ) : (
            <div className="dashboard-online-users">
              {onlineUsers.map((user, idx) => (
                <div key={user.id || idx} className="dashboard-online-user">
                  <div
                    className="dashboard-online-avatar"
                    title={user.name || user.email || 'User'}
                  >
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="dashboard-online-info">
                    <span className="dashboard-online-name">{user.name || 'Unknown'}</span>
                    <span className="dashboard-online-email">{user.email || ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
