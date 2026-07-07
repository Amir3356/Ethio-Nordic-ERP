<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes, HasApiTokens, Auditable;

    protected $fillable = [
        'full_name',
        'email',
        'department',
        'password',
        'confirm_password',
        'is_active',
        'email_verified_at',
        'temp_password_expires_at',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'confirm_password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'temp_password_expires_at' => 'datetime',
            'last_login_at' => 'datetime',
            'is_active' => 'boolean',
            'password' => 'hashed',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    /**
     * Get the roles assigned to this user
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_user');
    }

    /**
     * Get login activities for this user
     */
    public function loginActivities()
    {
        return $this->hasMany(LoginActivity::class);
    }

    /**
     * Get the two-factor authentication secret for this user
     */
    public function twoFactorSecret()
    {
        return $this->hasOne(TwoFactorSecret::class);
    }

    /**
     * Get audit logs created by this user
     */
    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    /**
     * Get refresh tokens for this user
     */
    public function refreshTokens()
    {
        return $this->hasMany(RefreshToken::class);
    }

    // ==================== ROLE METHODS ====================

    /**
     * Check if user has a specific role
     */
    public function hasRole(string $slug): bool
    {
        return $this->roles()->where('slug', $slug)->exists();
    }

    /**
     * Check if user is an admin
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('admin') || $this->hasRole('super-admin');
    }

    // ==================== PERMISSION METHODS ====================

    /**
     * Get permissions assigned directly to this user (custom overrides)
     */
    public function directPermissions()
    {
        return $this->belongsToMany(Permission::class, 'user_permissions');
    }

    /**
     * Get all permissions for this user (roles + direct overrides combined)
     */
    public function permissions()
    {
        $rolePermissionIds = Permission::whereHas('roles', function ($query) {
            $query->whereIn('roles.id', $this->roles->pluck('id'));
        })->pluck('id');

        $directPermissionIds = $this->directPermissions()->pluck('permissions.id');

        return Permission::whereIn('id', $rolePermissionIds->concat($directPermissionIds)->unique());
    }

    /**
     * Check if user has a specific permission
     */
    public function hasPermission(string $permissionSlug): bool
    {
        return $this->permissions()->where('slug', $permissionSlug)->exists();
    }

    /**
     * Check if user has any of the given permissions
     */
    public function hasAnyPermission(array $permissions): bool
    {
        return $this->permissions()->whereIn('slug', $permissions)->exists();
    }

    /**
     * Check if user has all of the given permissions
     */
    public function hasAllPermissions(array $permissions): bool
    {
        return $this->permissions()->whereIn('slug', $permissions)->count() === count($permissions);
    }

    // ==================== TWO-FACTOR AUTHENTICATION ====================

    /**
     * Check if user has 2FA enabled
     */
    public function hasTwoFactorEnabled(): bool
    {
        return $this->twoFactorSecret && $this->twoFactorSecret->is_enabled;
    }

    /**
     * Generate a new temporary password
     */
    public function generateTemporaryPassword(): string
    {
        $tempPassword = Str::random(12);
        $this->update([
            'password' => bcrypt($tempPassword),
            'temp_password_expires_at' => now()->addDays(7),
        ]);
        return $tempPassword;
    }

    /**
     * Check if temporary password has expired
     */
    public function hasExpiredTemporaryPassword(): bool
    {
        return $this->temp_password_expires_at && $this->temp_password_expires_at->isPast();
    }

    // ==================== ACCOUNT STATUS ====================

    /**
     * Activate user account
     */
    public function activate()
    {
        $this->update(['is_active' => true]);
    }

    /**
     * Deactivate user account
     */
    public function deactivate()
    {
        $this->update(['is_active' => false]);
        
        $this->tokens()->delete();
        $this->refreshTokens()->update(['is_revoked' => true]);
    }

    /**
     * Update last login timestamp
     */
    public function recordLogin()
    {
        $this->update(['last_login_at' => now()]);
    }

    // ==================== QUERY SCOPES ====================

    /**
     * Scope to get only active users
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get only inactive users
     */
    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    /**
     * Scope to filter by department
     */
    public function scopeByDepartment($query, string $department)
    {
        return $query->where('department', $department);
    }

    /**
     * Scope to get verified users
     */
    public function scopeVerified($query)
    {
        return $query->whereNotNull('email_verified_at');
    }

    /**
     * Scope to get unverified users
     */
    public function scopeUnverified($query)
    {
        return $query->whereNull('email_verified_at');
    }
}


