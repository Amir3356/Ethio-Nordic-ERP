<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RefreshToken extends Model
{
    use Auditable;

    protected $fillable = [
        'user_id',
        'token',
        'access_token_id',
        'ip_address',
        'user_agent',
        'device_type',
        'browser',
        'platform',
        'expires_at',
        'last_used_at',
        'is_revoked',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'last_used_at' => 'datetime',
            'is_revoked' => 'boolean',
        ];
    }

    protected $hidden = [
        'token',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isValid(): bool
    {
        return !$this->is_revoked && !$this->isExpired();
    }

    public function revoke(): void
    {
        $this->update(['is_revoked' => true]);
    }

    public function recordUsage(): void
    {
        $this->update(['last_used_at' => now()]);
    }

    public function scopeValid($query)
    {
        return $query->where('is_revoked', false)
                     ->where('expires_at', '>', now());
    }
}
