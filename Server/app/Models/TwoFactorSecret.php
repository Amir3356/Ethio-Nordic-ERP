<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TwoFactorSecret extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'secret',
        'recovery_codes',
        'enabled',
    ];

    protected $hidden = [
        'secret',
        'recovery_codes',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
