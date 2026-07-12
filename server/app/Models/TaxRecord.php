<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaxRecord extends Model
{
    use \App\Traits\Auditable;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id', 'tax_type', 'period', 'filing_date', 'output_vat', 'input_vat',
        'net_vat_payable', 'wht_collected', 'wht_paid', 'taxable_income',
        'tax_rate', 'tax_amount', 'status', 'payment_date', 'payment_ref', 'account_id',
    ];

    protected function casts(): array
    {
        return [
            'filing_date' => 'date:Y-m-d',
            'payment_date' => 'date:Y-m-d',
        ];
    }
}
