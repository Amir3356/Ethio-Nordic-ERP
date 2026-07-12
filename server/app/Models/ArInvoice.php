<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ArInvoice extends Model
{
    use \App\Traits\Auditable;

    protected $table = 'ar_invoices';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id', 'customer_id', 'customer_name', 'invoice_no', 'invoice_date', 'due_date',
        'currency', 'amount', 'vat_amount', 'total_amount', 'status', 'payment_date', 'payment_ref',
    ];

    protected function casts(): array
    {
        return [
            'invoice_date' => 'date:Y-m-d',
            'due_date' => 'date:Y-m-d',
            'payment_date' => 'date:Y-m-d',
            'amount' => 'decimal:2',
            'vat_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
        ];
    }
}
