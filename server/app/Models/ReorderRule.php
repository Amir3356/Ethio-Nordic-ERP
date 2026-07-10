<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReorderRule extends Model
{
    protected $fillable = [
        'product_id',
        'warehouse_id',
        'min_stock',
        'reorder_level',
        'auto_reorder',
        'preferred_supplier',
        'lead_time_days',
    ];

    protected function casts(): array
    {
        return [
            'min_stock' => 'decimal:2',
            'reorder_level' => 'decimal:2',
            'auto_reorder' => 'boolean',
            'lead_time_days' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }
}
