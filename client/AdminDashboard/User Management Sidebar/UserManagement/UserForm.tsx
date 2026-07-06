import { Role, NewUser, EditUser, FormErrors, EditFormErrors } from './types';

interface UserFormProps {
  mode: 'create' | 'edit';
  newUser: NewUser;
  editUser: EditUser | null;
  roles: Role[];
  newUserErrors: FormErrors;
  editUserErrors: EditFormErrors;
  loading: boolean;
  onNewUserChange: (user: NewUser) => void;
  onEditUserChange: (user: EditUser) => void;
  onNewUserErrorsChange: (errors: FormErrors) => void;
  onEditUserErrorsChange: (errors: EditFormErrors) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function UserForm({
  mode,
  newUser,
  editUser,
  roles,
  newUserErrors,
  editUserErrors,
  loading,
  onNewUserChange,
  onEditUserChange,
  onNewUserErrorsChange,
  onEditUserErrorsChange,
  onSubmit,
  onCancel,
}: UserFormProps) {
  const user = mode === 'edit' ? editUser : newUser;
  const errors = mode === 'edit' ? editUserErrors : newUserErrors;

  const handleNameChange = (value: string) => {
    if (mode === 'create') {
      onNewUserChange({ ...newUser, name: value });
      onNewUserErrorsChange({ ...newUserErrors, name: undefined });
    } else if (editUser) {
      onEditUserChange({ ...editUser, full_name: value });
      onEditUserErrorsChange({ ...editUserErrors, full_name: undefined });
    }
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  const handleEmailChange = (value: string) => {
    if (mode === 'create') {
      onNewUserChange({ ...newUser, email: value });
      const error = validateEmail(value);
      onNewUserErrorsChange({ ...newUserErrors, email: error });
    } else if (editUser) {
      onEditUserChange({ ...editUser, email: value });
      const error = validateEmail(value);
      onEditUserErrorsChange({ ...editUserErrors, email: error });
    }
  };

  const handleDepartmentChange = (value: string) => {
    if (mode === 'create') {
      onNewUserChange({ ...newUser, department: value });
      onNewUserErrorsChange({ ...newUserErrors, department: undefined });
    } else if (editUser) {
      onEditUserChange({ ...editUser, department: value });
      onEditUserErrorsChange({ ...editUserErrors, department: undefined });
    }
  };

  const handleRoleToggle = (roleId: number) => {
    if (mode === 'create') {
      const updatedRoles = newUser.roles.includes(roleId)
        ? newUser.roles.filter((r) => r !== roleId)
        : [...newUser.roles, roleId];
      onNewUserChange({ ...newUser, roles: updatedRoles });
      onNewUserErrorsChange({ ...newUserErrors, roles: undefined });
    } else if (editUser) {
      const updatedRoles = editUser.roles.includes(roleId)
        ? editUser.roles.filter((r) => r !== roleId)
        : [...editUser.roles, roleId];
      onEditUserChange({ ...editUser, roles: updatedRoles });
      onEditUserErrorsChange({ ...editUserErrors, roles: undefined });
    }
  };

  const getNameValue = () => mode === 'create' ? newUser.name : editUser?.full_name || '';
  const getEmailValue = () => mode === 'create' ? newUser.email : editUser?.email || '';
  const getDepartmentValue = () => mode === 'create' ? newUser.department : editUser?.department || '';
  const getSelectedRoles = () => mode === 'create' ? newUser.roles : editUser?.roles || [];
  const getNameError = () => mode === 'create' ? newUserErrors.name : editUserErrors.full_name;

  return (
    <div className="content-form">
      <div className="content-form-row">
        <label className="content-form-field">
          <span>Full Name</span>
          <input
            type="text"
            value={getNameValue()}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Enter full name"
            className={getNameError() ? 'error' : ''}
          />
          {getNameError() && <span className="content-form-error">{getNameError()}</span>}
        </label>
        <label className="content-form-field">
          <span>Email</span>
          <input
            type="email"
            value={getEmailValue()}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="Enter email"
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="content-form-error">{errors.email}</span>}
        </label>
      </div>
      <div className="content-form-row">
        <label className="content-form-field">
          <span>Department</span>
          <input
            type="text"
            value={getDepartmentValue()}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            placeholder="Enter department"
            className={errors.department ? 'error' : ''}
          />
          {errors.department && <span className="content-form-error">{errors.department}</span>}
        </label>
      </div>
      <div className="content-form-row">
        <label className="content-form-field">
          <span>Assign Roles</span>
          <div className="content-checkbox-group">
            {roles.filter((role) => ['Warehouse Officer', 'Finance Manager', 'Regulatory Affairs Officer'].includes(role.name)).map((role) => (
              <label key={role.id} className="content-checkbox">
                <input
                  type="checkbox"
                  checked={getSelectedRoles().includes(role.id)}
                  onChange={() => handleRoleToggle(role.id)}
                />
                <span>{role.name}</span>
              </label>
            ))}
          </div>
          {errors.roles && <span className="content-form-error">{errors.roles}</span>}
        </label>
      </div>
      <div className="content-form-actions">
        <button type="button" className="content-btn-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="content-btn-submit"
          onClick={onSubmit}
          disabled={loading}
        >
          {loading ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create User' : 'Save Changes')}
        </button>
      </div>
    </div>
  );
}
