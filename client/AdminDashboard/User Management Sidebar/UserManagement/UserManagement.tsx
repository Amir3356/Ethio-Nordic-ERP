import { useUserManagement } from './hooks';
import UserSearch from './UserSearch';
import UserTable from './UserTable';
import UserForm from './UserForm';
import UserModal from './UserModal';
import { ToastContainer, useToast } from '../../components/Toast';
import './UserManagement.css';

export default function UserManagement() {
  const {
    roles,
    allPermissions,
    search,
    setSearch,
    loading,
    error,
    setError,
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

  const toast = useToast();

  const onSubmitCreate = async () => {
    const result = await handleCreateUser();
    if (result.success) {
      toast.success(result.message);
      closeNewUserForm();
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  const onSubmitEdit = async () => {
    const result = await handleUpdateUser();
    if (result.success) {
      toast.success(result.message);
      closeEditForm();
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  return (
    <section className="content-section" id="users">
      <ToastContainer toasts={toast.toasts} onDismiss={toast.removeToast} />

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

      {showNewUserForm && (
        <UserModal title="New User" onClose={closeNewUserForm}>
          <UserForm
            mode="create"
            newUser={newUser}
            editUser={null}
            roles={roles}
            allPermissions={allPermissions}
            newUserErrors={newUserErrors}
            editUserErrors={{}}
            loading={loading}
            onNewUserChange={setNewUser}
            onEditUserChange={() => {}}
            onNewUserErrorsChange={setNewUserErrors}
            onEditUserErrorsChange={() => {}}
            onSubmit={onSubmitCreate}
            onCancel={closeNewUserForm}
          />
        </UserModal>
      )}

      {showEditForm && editUser && (
        <UserModal title="Edit User" onClose={closeEditForm}>
          <UserForm
            mode="edit"
            newUser={{ name: '', email: '', department: '', roles: [], permissions: [] }}
            editUser={editUser}
            roles={roles}
            allPermissions={allPermissions}
            newUserErrors={{}}
            editUserErrors={editUserErrors}
            loading={loading}
            onNewUserChange={() => {}}
            onEditUserChange={setEditUser}
            onNewUserErrorsChange={() => {}}
            onEditUserErrorsChange={setEditUserErrors}
            onSubmit={onSubmitEdit}
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
