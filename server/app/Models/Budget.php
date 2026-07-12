<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Budget extends Model
{
    use \App\Traits\Auditable;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id', 'cost_center', 'account_id', 'category', 'period', 'budget_amount', 'actual_amount',
    ];

    protected function casts(): array
    {
        return ['budget_amount' => 'decimal:2', 'actual_amount' => 'decimal:2'];
    }

    public function account()
    {
        return $this->belongsTo(ChartOfAccount::class, 'account_id');
    }
}
