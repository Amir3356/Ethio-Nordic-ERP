import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ShieldCheck, Search, CircleX, CircleCheck, X } from 'lucide-react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import './User & Access Management.css';

export default function UserAccessManagement() {
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionConfig, setSessionConfig] = useState({
    idleTimeoutMinutes: 15,
    refreshTokenRotation: true,
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    department: '',
    role: 'Viewer',
    status: 'Active',
  });

  useEffect(() => {
    axios.get('/User.json')
      .then((res) => setUsers(Array.isArray(res.data?.users) ? res.data.users : []))
      .catch((err) => console.error('Failed to load users:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    axios.get('/Session.json')
      .then((res) => {
        setSessions(Array.isArray(res.data?.sessions) ? res.data.sessions : []);
        setSessionConfig(res.data?.config || {
          idleTimeoutMinutes: 15,
          refreshTokenRotation: true,
        });
      })
      .catch((err) => console.error('Failed to load sessions:', err))
      .finally(() => setSessionLoading(false));
  }, []);

  useEffect(() => {
    axios.get('/Audit.json')
      .then((res) => setAuditLogs(Array.isArray(res.data?.auditLogs) ? res.data.auditLogs : []))
      .catch((err) => console.error('Failed to load audit logs:', err))
      .finally(() => setAuditLoading(false));
  }, []);

  const safeUsers = Array.isArray(users) ? users : [];
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const safeAuditLogs = Array.isArray(auditLogs) ? auditLogs : [];
  const safeSessionConfig = sessionConfig || {
    idleTimeoutMinutes: 15,
    refreshTokenRotation: true,
  };

  const filteredUsers = safeUsers.filter((u) =>
    String(u.name).toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  function handleEditUser(user) {
    const nextName = window.prompt('Edit user name', user.name);

    if (nextName === null) {
      return;
    }

    const trimmedName = nextName.trim();

    if (!trimmedName) {
      return;
    }

    setUsers((currentUsers) =>
      currentUsers.map((currentUser) =>
        currentUser.id === user.id ? { ...currentUser, name: trimmedName } : currentUser
      )
    );
  }

  function handleDeleteUser(user) {
    const shouldDelete = window.confirm(`Delete ${user.name}?`);

    if (!shouldDelete) {
      return;
    }

    setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.id !== user.id));
  }

  function handleTerminateSession(session) {
    const shouldTerminate = window.confirm(`Terminate session for ${session.user}?`);

    if (!shouldTerminate) {
      return;
    }

    setSessions((currentSessions) =>
      currentSessions.map((currentSession) =>
        currentSession.id === session.id
          ? { ...currentSession, status: 'Terminated', lastActive: 'Terminated now' }
          : currentSession
      )
    );
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Full Name',
      cell: (info) => String(info.getValue()),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: (info) => <span className="user-email">{info.getValue()}</span>,
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: (info) => info.getValue() || '—',
    },
    {
      accessorKey: 'role',
      header: 'Role',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info) => {
        const status = info.getValue();

        return (
          <span className={status === 'Active' ? 'user-status-active' : 'user-status-inactive'}>
            {status === 'Active' ? <CircleCheck size={14} /> : <CircleX size={14} />}
            <span>{status}</span>
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="user-actions">
          <button
            type="button"
            className="user-action-btn user-action-edit"
            onClick={() => handleEditUser(row.original)}
          >
            Edit
          </button>
          <button
            type="button"
            className="user-action-btn user-action-delete"
            onClick={() => handleDeleteUser(row.original)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ], []);

  const sessionColumns = useMemo(() => [
    {
      accessorKey: 'user',
      header: 'User',
      cell: (info) => String(info.getValue()),
    },
    {
      accessorKey: 'device',
      header: 'Device',
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'lastActive',
      header: 'Last Active',
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'status',
      header: 'Session Status',
      cell: (info) => {
        const status = info.getValue();

        return (
          <span className={status === 'Active' ? 'session-status-active' : 'session-status-idle'}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: 'tokenRotation',
      header: 'Refresh Token',
      cell: (info) => (info.getValue() ? 'Rotated on renewal' : 'Rotation pending'),
    },
    {
      id: 'sessionActions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="session-actions">
          <button
            type="button"
            className="session-terminate-btn"
            onClick={() => handleTerminateSession(row.original)}
            disabled={row.original.status === 'Terminated'}
          >
            Terminate
          </button>
        </div>
      ),
    },
  ], []);

  const auditColumns = useMemo(() => [
    {
      accessorKey: 'user',
      header: 'User',
      cell: (info) => String(info.getValue()),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: (info) => {
        const action = info.getValue();
        const actionClass = {
          'Created': 'audit-action-created',
          'Updated': 'audit-action-updated',
          'Deleted': 'audit-action-deleted',
          'Approved': 'audit-action-approved',
        };
        return (
          <span className={actionClass[action] || 'audit-action-default'}>
            {action}
          </span>
        );
      },
    },
    {
      accessorKey: 'module',
      header: 'Module',
    },
    {
      accessorKey: 'entity',
      header: 'Entity',
    },
    {
      accessorKey: 'entityId',
      header: 'Entity ID',
    },
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
    },
    {
      accessorKey: 'beforeSnapshot',
      header: 'Before',
      cell: (info) => info.getValue() || '—',
    },
    {
      accessorKey: 'afterSnapshot',
      header: 'After',
      cell: (info) => info.getValue() || '—',
    },
  ], []);

  const table = useReactTable({
    data: filteredUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const sessionTable = useReactTable({
    data: safeSessions,
    columns: sessionColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const auditTable = useReactTable({
    data: safeAuditLogs,
    columns: auditColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleNewUserChange = (field, value) => {
    setNewUser((currentUser) => ({
      ...currentUser,
      [field]: value,
    }));
  };

  const handleCreateUser = (event) => {
    event.preventDefault();

    const trimmedName = newUser.name.trim();
    const trimmedEmail = newUser.email.trim();

    if (!trimmedName || !trimmedEmail) {
      return;
    }

    const nextUser = {
      id: Date.now(),
      name: trimmedName,
      email: trimmedEmail,
      department: newUser.department.trim(),
      role: newUser.role,
      status: newUser.status,
    };

    setUsers((currentUsers) => [nextUser, ...currentUsers]);
    setNewUser({
      name: '',
      email: '',
      department: '',
      role: 'Viewer',
      status: 'Active',
    });
    setShowNewUserForm(false);
  };

  return (
    <div className="user-layout">
      <aside className="user-sidebar">
        <a href="/users" onClick={(e) => e.preventDefault()} className="user-sidebar-link">
          <ShieldCheck size={16} />
          User & Access Management
        </a>
      </aside>

      <main className="user-main">
        <div className="user-search-wrap">
          <Search size={16} className="user-search-icon" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="user-search"
          />
        </div>

        <div className="user-toolbar">
          <button
            type="button"
            className="user-new-btn"
            onClick={() => setShowNewUserForm(true)}
          >
            + New User
          </button>
        </div>

        {showNewUserForm && (
          <div className="user-modal-backdrop" onClick={() => setShowNewUserForm(false)}>
            <form className="user-modal" onSubmit={handleCreateUser} onClick={(event) => event.stopPropagation()}>
              <div className="user-modal-header">
                <div>
                  <h2 className="user-modal-title">New User</h2>
                </div>
                <button
                  type="button"
                  className="user-modal-close"
                  onClick={() => setShowNewUserForm(false)}
                  aria-label="Close modal"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="user-form-grid">
                <label className="user-form-field">
                  <span>Full Name</span>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(event) => handleNewUserChange('name', event.target.value)}
                    placeholder="Enter full name"
                  />
                </label>

                <label className="user-form-field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(event) => handleNewUserChange('email', event.target.value)}
                    placeholder="Enter email address"
                  />
                </label>

                <label className="user-form-field">
                  <span>Department</span>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(event) => handleNewUserChange('department', event.target.value)}
                    placeholder="Enter department"
                  />
                </label>

                <label className="user-form-field">
                  <span>Role</span>
                  <select
                    value={newUser.role}
                    onChange={(event) => handleNewUserChange('role', event.target.value)}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </label>

                <label className="user-form-field">
                  <span>Status</span>
                  <select
                    value={newUser.status}
                    onChange={(event) => handleNewUserChange('status', event.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
              </div>

              <div className="user-form-actions">
                <button type="button" className="user-form-cancel" onClick={() => setShowNewUserForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="user-form-submit">
                  Create User
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="user-table-wrapper">
            <table className="user-table">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id}>
                        <span className="user-th">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <section className="session-section">
          <div className="session-header">
            <div>
              <h2 className="session-title">Session Monitoring & Management</h2>
            </div>

            <div className="session-summary">
              <div className="session-summary-card">
                <span className="session-summary-label">Idle timeout</span>
                <strong>{`${safeSessionConfig.idleTimeoutMinutes} minutes`}</strong>
              </div>
              <div className="session-summary-card">
                <span className="session-summary-label">Refresh tokens</span>
                <strong>{safeSessionConfig.refreshTokenRotation ? 'Rotated on renewal' : 'Rotation disabled'}</strong>
              </div>
            </div>
          </div>

          {sessionLoading ? (
            <p>Loading session monitoring data...</p>
          ) : (
            <div className="session-table-wrapper">
              <table className="session-table">
                <thead>
                  {sessionTable.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id}>
                          <span className="user-th">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {sessionTable.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="audit-section">
          <div className="audit-header">
            <h2 className="audit-title">Audit Trail Logging</h2>
            <p className="audit-description">
              Every create, update, approve, or delete action across all 27 ERP modules is intercepted
              by a system-wide audit observer, which records the acting user, timestamp, the module/entity
              affected, and a before/after snapshot of the changed data. Audit records are immutable and
              cannot be edited or deleted, even by system administrators.
            </p>
          </div>

          {auditLoading ? (
            <p>Loading audit trail data...</p>
          ) : (
            <div className="audit-table-wrapper">
              <table className="audit-table">
                <thead>
                  {auditTable.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id}>
                          <span className="user-th">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {auditTable.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
