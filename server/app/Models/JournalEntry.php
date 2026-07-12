<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JournalEntry extends Model
{
    use \App\Traits\Auditable;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id', 'date', 'description', 'source_module', 'reference', 'status',
        'created_by', 'approved_by', 'total_debit', 'total_credit', 'currency', 'exchange_rate',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'total_debit' => 'decimal:2',
            'total_credit' => 'decimal:2',
            'exchange_rate' => 'decimal:4',
        ];
    }

    public function lines()
    {
        return $this->hasMany(JournalLine::class, 'journal_entry_id');
    }
}
