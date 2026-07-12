<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerformanceReview extends Model
{
    use \App\Traits\Auditable;

    protected $primaryKey = 'review_id';

    protected $fillable = [
        'employee_id',
        'review_period',
        'self_assessment_score',
        'manager_score',
        'final_score',
        'rating',
        'strengths',
        'improvements',
        'goals',
        'reviewer_id',
        'review_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'self_assessment_score' => 'decimal:2',
            'manager_score' => 'decimal:2',
            'final_score' => 'decimal:2',
            'review_date' => 'date',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'reviewer_id', 'employee_id');
    }
}
