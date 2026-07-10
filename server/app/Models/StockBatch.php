<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockBatch extends Model
{
    protected $primaryKey = 'batch_id';

    protected $fillable = [
        'product_id',
        'warehouse_id',
        'batch_number',
        'quantity_received',
        'available_quantity',
        'unit_cost',
        'manufacture_date',
        'expiry_date',
        'supplier_id',
        'receipt_reference',
        'batch_status',
    ];

    protected function casts(): array
    {
        return [
            'quantity_received' => 'decimal:2',
            'available_quantity' => 'decimal:2',
            'unit_cost' => 'decimal:2',
            'manufacture_date' => 'date',
            'expiry_date' => 'date',
            'supplier_id' => 'integer',
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

    public function stockLedger(): HasMany
    {
        return $this->hasMany(StockLedger::class, 'batch_id', 'batch_id');
    }

    public function isExpired(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }

    public function daysUntilExpiry(): ?int
    {
        if (!$this->expiry_date) {
            return null;
        }

        return (int) now()->diffInDays($this->expiry_date, false);
    }
}
