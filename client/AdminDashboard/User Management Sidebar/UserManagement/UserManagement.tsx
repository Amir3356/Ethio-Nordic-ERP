import { useUserManagement } from './hooks';
import UserSearch from './UserSearch';
import UserTable from './UserTable';
import UserForm from './UserForm';
import UserModal from './UserModal';
import './UserManagement.css';

export default function UserManagement() {
  const {
    roles,
    search,
    setSearch,
    loading,
    error,
    setError,
    success,
    setSuccess,
    showNewUserForm,
    showEditForm,
    editUser,
    newUserErrors,
    editUserErrors,
    newUser,
    setNewUser,
    setEditUser,
    setNewUserErrors,
    setEditUserErrors,
    filteredUsers,
    handleCreateUser,
    handleDeleteUser,
    handleEditUser,
    handleUpdateUser,
    openNewUserForm,
    closeNewUserForm,
    closeEditForm,
  } = useUserManagement();

  return (
    <section className="content-section" id="users">
      <div className="content-section-header content-section-header-centered">
        <h2 className="content-section-title-centered">User Management</h2>
        <button type="button" className="content-btn-new" onClick={openNewUserForm}>
          + New User
        </button>
      </div>

      {error && (
        <div className="content-error">
          <p>{error}</p>
          <button onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {success && (
        <div className="content-success">
          <p>{success}</p>
          <button onClick={() => setSuccess('')}>Dismiss</button>
        </div>
      )}

      {showNewUserForm && (
        <UserModal title="New User" onClose={closeNewUserForm}>
          <UserForm
            mode="create"
            newUser={newUser}
            editUser={null}
            roles={roles}
            newUserErrors={newUserErrors}
            editUserErrors={{}}
            loading={loading}
            onNewUserChange={setNewUser}
            onEditUserChange={() => {}}
            onNewUserErrorsChange={setNewUserErrors}
            onEditUserErrorsChange={() => {}}
            onSubmit={async () => {
              const success = await handleCreateUser();
              if (success) closeNewUserForm();
            }}
            onCancel={closeNewUserForm}
          />
        </UserModal>
      )}

      {showEditForm && editUser && (
        <UserModal title="Edit User" onClose={closeEditForm}>
          <UserForm
            mode="edit"
            newUser={{ name: '', email: '', department: '', roles: [] }}
            editUser={editUser}
            roles={roles}
            newUserErrors={{}}
            editUserErrors={editUserErrors}
            loading={loading}
            onNewUserChange={() => {}}
            onEditUserChange={setEditUser}
            onNewUserErrorsChange={() => {}}
            onEditUserErrorsChange={setEditUserErrors}
            onSubmit={async () => {
              const success = await handleUpdateUser();
              if (success) closeEditForm();
            }}
            onCancel={closeEditForm}
          />
        </UserModal>
      )}

      <UserSearch value={search} onChange={setSearch} />

      {loading && <p className="content-loading">Loading...</p>}

      <UserTable
        users={filteredUsers}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
      />
    </section>
  );
}
