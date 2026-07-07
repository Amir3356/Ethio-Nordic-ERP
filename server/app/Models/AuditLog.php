<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    /**
     * Audit records are immutable — block all mass assignment.
     * Only created via AuditObserver::create() which bypasses this.
     */
    protected $guarded = ['*'];

    protected $fillable = [];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    /**
     * Audit records are immutable — block fill (mass assignment).
     */
    public function fill(array $attributes): static
    {
        if ($this->exists) {
            \Log::warning('Attempted to fill an existing audit log record.', ['id' => $this->getKey()]);
            return $this;
        }
        return parent::fill($attributes);
    }

    /**
     * Audit records are immutable — prevent any updates.
     */
    public function update(array $attributes = [], array $options = []): bool
    {
        \Log::warning('Attempted to update an audit log record.', ['id' => $this->getKey()]);
        return false;
    }

    /**
     * Audit records are immutable — prevent deletion.
     */
    public function delete(): bool
    {
        \Log::warning('Attempted to delete an audit log record.', ['id' => $this->getKey()]);
        return false;
    }

    /**
     * Audit records are immutable — prevent force deletion.
     */
    public function forceDelete(): bool
    {
        \Log::warning('Attempted to force delete an audit log record.', ['id' => $this->getKey()]);
        return false;
    }

    /**
     * Audit records are immutable — prevent save (both insert and update paths).
     */
    public function save(array $options = []): bool
    {
        if ($this->exists) {
            \Log::warning('Attempted to save (update) an existing audit log record.', ['id' => $this->getKey()]);
            return false;
        }
        return parent::save($options);
    }

    /**
     * Audit records are immutable — prevent query-builder bulk deletions and updates.
     */
    public function newQuery()
    {
        $query = parent::newQuery();

        // Block bulk delete
        $query->macro('delete', function () {
            \Log::warning('Attempted bulk delete on audit_logs table.');
            return 0;
        });

        // Block bulk update
        $query->macro('update', function () {
            \Log::warning('Attempted bulk update on audit_logs table.');
            return 0;
        });

        // Block truncate
        $query->macro('truncate', function () {
            \Log::warning('Attempted truncate on audit_logs table.');
            return false;
        });

        return $query;
    }

    /**
     * Audit records are immutable — prevent force fill on existing records.
     */
    public function forceFill(array $attributes): static
    {
        if ($this->exists) {
            \Log::warning('Attempted to forceFill an existing audit log record.', ['id' => $this->getKey()]);
            return $this;
        }
        return parent::forceFill($attributes);
    }

    // ==================== READ-ONLY RELATIONSHIPS ====================

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

    // ==================== READ-ONLY SCOPES ====================

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

    // ==================== HELPER METHODS ====================

    /**
     * Get a human-readable description of the change
     */
    public function getChangeDescription(): string
    {
        return "{$this->user_email} performed {$this->action} on {$this->model_type} (ID: {$this->model_id}) in {$this->module} module";
    }
}
