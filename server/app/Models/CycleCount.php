<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CycleCount extends Model
{
    use HasFactory;

    protected $primaryKey = 'cycle_count_id';
    public $timestamps = true;

    protected $fillable = [
        'warehouse_id',
        'product_id',
        'batch_id',
        'system_quantity',
        'counted_quantity',
        'variance',
        'counted_by',
        'count_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'count_date' => 'datetime',
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
}
