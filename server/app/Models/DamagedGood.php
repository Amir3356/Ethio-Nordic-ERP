<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DamagedGood extends Model
{
    protected $fillable = [
        'product_id',
        'warehouse_id',
        'batch_id',
        'quantity',
        'damage_type',
        'description',
        'photos',
        'status',
        'reported_by',
        'reported_at',
        'reviewed_by',
        'reviewed_at',
        'write_off_amount',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'photos' => 'array',
            'reported_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'write_off_amount' => 'decimal:2',
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

    public function batch(): BelongsTo
    {
        return $this->belongsTo(StockBatch::class);
    }
}
