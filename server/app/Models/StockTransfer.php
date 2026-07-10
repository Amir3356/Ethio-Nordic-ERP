<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockTransfer extends Model
{
    use HasFactory;

    protected $primaryKey = 'transfer_id';
    public $timestamps = true;

    protected $fillable = [
        'product_id',
        'batch_id',
        'from_warehouse_id',
        'to_warehouse_id',
        'quantity',
        'status',
        'requested_by',
        'approved_by',
        'transferred_by',
        'transfer_date',
        'reason',
    ];

    protected $casts = [
        'transfer_date' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }

    public function batch()
    {
        return $this->belongsTo(StockBatch::class, 'batch_id', 'batch_id');
    }

    public function fromWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id', 'warehouse_id');
    }

    public function toWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id', 'warehouse_id');
    }
}
