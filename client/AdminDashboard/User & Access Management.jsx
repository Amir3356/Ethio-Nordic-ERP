import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ShieldCheck, Search, CircleX, CircleCheck, X } from 'lucide-react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import './User & Access Management.css';

export default function UserAccessManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    department: '',
    role: 'Viewer',
    status: 'Active',
  });

  useEffect(() => {
    axios.get('/new user.json')
      .then((res) => setUsers(Array.isArray(res.data?.users) ? res.data.users : []))
      .catch((err) => console.error('Failed to load users:', err))
      .finally(() => setLoading(false));
  }, []);

  const safeUsers = Array.isArray(users) ? users : [];

  const filteredUsers = safeUsers.filter((u) =>
    String(u.name).toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

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

  const table = useReactTable({
    data: filteredUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleEditUser = (user) => {
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
  };

  const handleDeleteUser = (user) => {
    const shouldDelete = window.confirm(`Delete ${user.name}?`);

    if (!shouldDelete) {
      return;
    }

    setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.id !== user.id));
  };

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
      </main>
    </div>
  );
}
