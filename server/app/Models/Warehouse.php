<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Warehouse extends Model
{
    protected $primaryKey = 'warehouse_id';

    protected $fillable = [
        'warehouse_code',
        'warehouse_name',
        'location',
        'warehouse_type',
        'capacity',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'capacity' => 'decimal:2',
        ];
    }

    public function stockBatches(): HasMany
    {
        return $this->hasMany(StockBatch::class, 'warehouse_id', 'warehouse_id');
    }
}
