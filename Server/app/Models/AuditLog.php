<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'user_name',
        'action',
        'module',
        'entity_type',
        'entity_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'json',
            'new_values' => 'json',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getEntity(): ?Model
    {
        if ($this->entity_type && $this->entity_id) {
            $entityClass = $this->entity_type;

            return $entityClass::find($this->entity_id);
        }

        return null;
    }

    public function scopeForModule(Builder $query, string $module): Builder
    {
        return $query->where('module', $module);
    }

    public function scopeForAction(Builder $query, string $action): Builder
    {
        return $query->where('action', $action);
    }

    public function scopeForEntity(Builder $query, string $entityType, int $entityId): Builder
    {
        return $query->where('entity_type', $entityType)->where('entity_id', $entityId);
    }
}
