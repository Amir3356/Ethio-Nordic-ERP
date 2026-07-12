<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DamagedGood extends Model
{
    use \App\Traits\Auditable;

    protected $primaryKey = 'damaged_goods_id';

    public const UPDATED_AT = null;

    protected $fillable = [
        'product_id',
        'warehouse_id',
        'batch_id',
        'quantity',
        'damage_reason',
        'reported_by',
        'supporting_photos',
        'disposition_status',
        'approved_by',
        'disposal_date',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'reported_by' => 'integer',
            'approved_by' => 'integer',
            'disposal_date' => 'date',
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

    public function batch(): BelongsTo
    {
        return $this->belongsTo(StockBatch::class, 'batch_id', 'batch_id');
    }
}
