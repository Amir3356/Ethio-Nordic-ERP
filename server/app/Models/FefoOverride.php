<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FefoOverride extends Model
{
    use HasFactory;

    protected $primaryKey = 'override_id';
    public $timestamps = true;

    protected $fillable = [
        'batch_id',
        'product_id',
        'warehouse_id',
        'original_batch_id',
        'overridden_batch_id',
        'reason',
        'overridden_by',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id', 'warehouse_id');
    }

    public function batch()
    {
        return $this->belongsTo(StockBatch::class, 'batch_id', 'batch_id');
    }

    public function originalBatch()
    {
        return $this->belongsTo(StockBatch::class, 'original_batch_id', 'batch_id');
    }

    public function overriddenBatch()
    {
        return $this->belongsTo(StockBatch::class, 'overridden_batch_id', 'batch_id');
    }
}
