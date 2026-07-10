<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAdjustment extends Model
{
    protected $fillable = [
        'product_id',
        'warehouse_id',
        'batch_id',
        'quantity_before',
        'quantity_after',
        'adjustment_qty',
        'reason',
        'reason_code',
        'status',
        'requested_by',
        'approved_by',
        'requested_at',
        'approved_at',
        'financial_impact',
    ];

    protected function casts(): array
    {
        return [
            'quantity_before' => 'decimal:2',
            'quantity_after' => 'decimal:2',
            'adjustment_qty' => 'decimal:2',
            'requested_at' => 'datetime',
            'approved_at' => 'datetime',
            'financial_impact' => 'decimal:2',
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
