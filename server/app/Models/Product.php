<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use \App\Traits\Auditable;

    protected $primaryKey = 'product_id';

    protected $fillable = [
        'product_code',
        'product_name',
        'description',
        'category_id',
        'unit_of_measure',
        'requires_batch_tracking',
        'requires_expiry_tracking',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'category_id' => 'integer',
            'requires_batch_tracking' => 'boolean',
            'requires_expiry_tracking' => 'boolean',
        ];
    }

    public function stockBatches(): HasMany
    {
        return $this->hasMany(StockBatch::class, 'product_id', 'product_id');
    }

    public function stockLedger(): HasMany
    {
        return $this->hasMany(StockLedger::class, 'product_id', 'product_id');
    }

    public function reorderRules(): HasMany
    {
        return $this->hasMany(ReorderRule::class, 'product_id', 'product_id');
    }
}
