<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Training extends Model
{
    protected $primaryKey = 'training_id';

    protected $fillable = [
        'employee_id',
        'training_name',
        'provider',
        'training_date',
        'duration_days',
        'certification',
        'cert_expiry',
        'status',
        'cost_etb',
    ];

    protected function casts(): array
    {
        return [
            'training_date' => 'date',
            'cert_expiry' => 'date',
            'cost_etb' => 'decimal:2',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }
}
