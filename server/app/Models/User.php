<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    use Notifiable, SoftDeletes;

    protected $fillable = [
        'full_name',
        'email',
        'department',
        'phone',
        'password',
        'is_active',
        'activation_token',
        'activation_token_expires_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
            'temp_password_expires_at' => 'datetime',
            'activation_token_expires_at' => 'datetime',
        ];
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_role');
    }

    public function loginActivities(): HasMany
    {
        return $this->hasMany(LoginActivity::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function twoFactorSecret(): HasOne
    {
        return $this->hasOne(TwoFactorSecret::class);
    }

    public function hasRole(string $roleSlug): bool
    {
        return $this->roles()->where('slug', $roleSlug)->exists();
    }

    public function hasPermission(string $permissionSlug): bool
    {
        return $this->roles()
            ->whereHas('permissions', function ($query) use ($permissionSlug) {
                $query->where('slug', $permissionSlug);
            })
            ->exists();
    }

    public function getAllPermissions()
    {
        return Permission::whereHas('roles', function ($query) {
            $query->whereIn('id', $this->roles->pluck('id'));
        })->get();
    }

    public function canPerform(string $module, string $action): bool
    {
        return $this->roles()
            ->whereHas('permissions', function ($query) use ($module, $action) {
                $query->where('module', $module)->where('action', $action);
            })
            ->exists();
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function generateTempPassword(): string
    {
        $tempPassword = strtoupper(bin2hex(random_bytes(4)));
        $this->update([
            'password' => $tempPassword,
            'temp_password_expires_at' => now()->addHours(24),
        ]);
        return $tempPassword;
    }

    public function generateActivationToken(): string
    {
        $token = Str::random(64);
        $this->update([
            'activation_token' => $token,
            'activation_token_expires_at' => now()->addHours(48),
        ]);
        return $token;
    }
}
