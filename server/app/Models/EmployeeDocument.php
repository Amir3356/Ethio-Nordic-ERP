<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeDocument extends Model
{
    use \App\Traits\Auditable;

    protected $primaryKey = 'document_id';

    protected $fillable = [
        'employee_id',
        'document_type',
        'document_name',
        'file_path',
        'upload_date',
        'expiry_date',
        'status',
        'access_level',
        'file_size_kb',
    ];

    protected function casts(): array
    {
        return [
            'upload_date' => 'date',
            'expiry_date' => 'date',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }
}
