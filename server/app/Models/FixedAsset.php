<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FixedAsset extends Model
{
    use \App\Traits\Auditable;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id', 'asset_code', 'name', 'category', 'account_id', 'acquisition_date',
        'acquisition_cost', 'useful_life_years', 'depreciation_method', 'salvage_value',
        'accumulated_depreciation', 'status', 'location',
    ];

    protected function casts(): array
    {
        return [
            'acquisition_date' => 'date:Y-m-d',
            'acquisition_cost' => 'decimal:2',
            'salvage_value' => 'decimal:2',
            'accumulated_depreciation' => 'decimal:2',
        ];
    }

    public function account()
    {
        return $this->belongsTo(ChartOfAccount::class, 'account_id');
    }
}
