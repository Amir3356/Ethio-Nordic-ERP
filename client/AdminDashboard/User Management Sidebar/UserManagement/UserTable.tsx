import { User } from './types';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
}

export default function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  return (
    <div className="content-table-wrapper">
      <table className="content-table">
        <thead>
          <tr>
            <th>Full name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Roles</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id}>
                <td><span className="content-table-name">{user.full_name}</span></td>
                <td>{user.email}</td>
                <td>{user.department}</td>
                <td>{user.roles && user.roles.length > 0 ? user.roles.map((r) => r.name).join(', ') : 'No roles'}</td>
                <td>
                  <span className={`content-status ${user.is_active ? 'status-active' : 'status-inactive'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="content-actions">
                    <button type="button" className="content-btn-edit" onClick={() => onEdit(user)}>Edit</button>
                    <button
                      type="button"
                      className="content-btn-delete"
                      onClick={() => onDelete(user.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="content-empty">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
