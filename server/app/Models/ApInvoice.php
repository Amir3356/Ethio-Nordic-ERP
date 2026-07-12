<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApInvoice extends Model
{
    use \App\Traits\Auditable;

    protected $table = 'ap_invoices';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id', 'supplier_id', 'supplier_name', 'invoice_no', 'po_ref', 'grn_ref',
        'invoice_date', 'due_date', 'currency', 'amount', 'amount_etb', 'vat_amount',
        'status', 'payment_date', 'payment_ref', 'matched_po', 'matched_grn',
    ];

    protected function casts(): array
    {
        return [
            'invoice_date' => 'date:Y-m-d',
            'due_date' => 'date:Y-m-d',
            'payment_date' => 'date:Y-m-d',
            'amount' => 'decimal:2',
            'amount_etb' => 'decimal:2',
            'vat_amount' => 'decimal:2',
            'matched_po' => 'boolean',
            'matched_grn' => 'boolean',
        ];
    }
}
