<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TwoFactorSecret extends Model
{
    protected $fillable = [
        'user_id',
        'secret',
        'recovery_codes',
        'enabled',
        'enabled_at',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'enabled_at' => 'datetime',
            'recovery_codes' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
