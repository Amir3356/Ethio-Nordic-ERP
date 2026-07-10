<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReorderRule extends Model
{
    protected $primaryKey = 'reorder_rule_id';

    protected $fillable = [
        'product_id',
        'warehouse_id',
        'minimum_stock_level',
        'reorder_point',
        'reorder_quantity',
        'alert_enabled',
        'auto_purchase_request',
    ];

    protected function casts(): array
    {
        return [
            'minimum_stock_level' => 'decimal:2',
            'reorder_point' => 'decimal:2',
            'reorder_quantity' => 'decimal:2',
            'alert_enabled' => 'boolean',
            'auto_purchase_request' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id', 'warehouse_id');
    }
}
