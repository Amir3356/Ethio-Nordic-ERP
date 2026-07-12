<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BankTransaction extends Model
{
    use \App\Traits\Auditable;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id', 'bank_account_id', 'date', 'description', 'type', 'amount',
        'balance_after', 'reference', 'reconciled', 'reconciled_date',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'reconciled_date' => 'date:Y-m-d',
            'amount' => 'decimal:2',
            'balance_after' => 'decimal:2',
            'reconciled' => 'boolean',
        ];
    }

    public function bankAccount()
    {
        return $this->belongsTo(ChartOfAccount::class, 'bank_account_id');
    }
}
