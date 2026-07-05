import { useState } from 'react';

const menuItems = [
  { id: 'users', label: 'Users' },
  { id: 'roles', label: 'Roles & Permissions' },
  { id: 'login-activity', label: 'Login Activity' },
  { id: 'audit-trail', label: 'Audit Trail' },
  { id: 'sessions', label: 'Sessions' },
];

export default function UserManagementSidebar() {
  const [active, setActive] = useState('users');

  return (
    <aside style={{ width: 260, background: '#1a1f36', color: '#fff', minHeight: '100vh', padding: '24px 0' }}>
      <nav>
        {menuItems.map((item) => (
          <a
            key={item.id}
            href={`/${item.id}`}
            onClick={(e) => { e.preventDefault(); setActive(item.id); }}
            style={{
              display: 'block',
              padding: '10px 20px',
              color: active === item.id ? '#fff' : '#9ca3af',
              background: active === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
              textDecoration: 'none',
              fontSize: 14,
              borderLeft: active === item.id ? '3px solid #4f46e5' : '3px solid transparent',
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
