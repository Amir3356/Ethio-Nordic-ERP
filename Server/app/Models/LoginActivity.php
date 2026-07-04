<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginActivity extends Model
{
    use HasFactory;

    protected $table = 'login_activity';

    protected $fillable = [
        'user_id',
        'email',
        'ip_address',
        'user_agent',
        'device_name',
        'device_type',
        'browser',
        'os',
        'geolocation',
        'status',
        'failure_reason',
        'login_at',
        'logout_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'login_at' => 'datetime',
            'logout_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeSuccessful(Builder $query): Builder
    {
        return $query->where('status', 'success');
    }

    public function scopeFailed(Builder $query): Builder
    {
        return $query->where('status', 'failed');
    }

    public function scopeRecent(Builder $query, int $days = 30): Builder
    {
        return $query->where('login_at', '>=', now()->subDays($days));
    }
}
