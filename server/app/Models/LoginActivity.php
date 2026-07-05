<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoginActivity extends Model
{
    use HasFactory;

    protected $table = 'login_activity';

    protected $fillable = [
        'user_id',
        'email',
        'ip_address',
        'user_agent',
        'device_type',
        'browser',
        'platform',
        'location',
        'status',
        'failure_reason',
        'login_at',
        'logout_at',
    ];

    protected function casts(): array
    {
        return [
            'login_at' => 'datetime',
            'logout_at' => 'datetime',
        ];
    }

    /**
     * Get the user associated with this login activity
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to get successful logins only
     */
    public function scopeSuccessful($query)
    {
        return $query->where('status', 'success');
    }

    /**
     * Scope to get failed login attempts
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope to get blocked login attempts
     */
    public function scopeBlocked($query)
    {
        return $query->where('status', 'blocked');
    }

    /**
     * Scope to filter by date range
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('login_at', [$startDate, $endDate]);
    }

    /**
     * Get login duration in minutes
     */
    public function getDurationInMinutes(): ?int
    {
        if (!$this->logout_at) {
            return null;
        }
        return $this->login_at->diffInMinutes($this->logout_at);
    }
}
