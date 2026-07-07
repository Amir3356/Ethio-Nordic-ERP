<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'user_email',
        'full_name',
        'action',
        'module',
        'model_type',
        'model_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    /**
     * Audit records are immutable — prevent any updates.
     */
    public function update(array $attributes = []): bool
    {
        return false;
    }

    /**
     * Audit records are immutable — prevent deletion.
     */
    public function delete(): bool
    {
        return false;
    }

    /**
     * Audit records are immutable — prevent force deletion.
     */
    public function forceDelete(): bool
    {
        return false;
    }

    /**
     * Audit records are immutable — prevent query-builder bulk deletions.
     */
    public function newQuery()
    {
        $query = parent::newQuery();

        // Wrap the query builder to block delete operations
        $query->macro('delete', function () {
            return 0;
        });

        return $query;
    }

    /**
     * Get the user who performed the action
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the auditable model
     */
    public function auditable()
    {
        return $this->morphTo('model');
    }

    /**
     * Scope to filter by module
     */
    public function scopeForModule($query, string $module)
    {
        return $query->where('module', $module);
    }

    /**
     * Scope to filter by action
     */
    public function scopeForAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope to filter by user
     */
    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter by date range
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Get a human-readable description of the change
     */
    public function getChangeDescription(): string
    {
        return "{$this->user_email} performed {$this->action} on {$this->model_type} (ID: {$this->model_id}) in {$this->module} module";
    }
}
