<?php

namespace App\Observers;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditObserver
{
    public function creating(Model $model): void
    {
        $this->logEvent($model, 'created', null, $model->getAttributes());
    }

    public function updating(Model $model): void
    {
        $dirty = $model->getDirty();
        $original = $model->getOriginal();

        $changedAttributes = [];
        foreach ($dirty as $key => $newValue) {
            $changedAttributes[$key] = [
                'old' => $original[$key] ?? null,
                'new' => $newValue,
            ];
        }

        if (!empty($changedAttributes)) {
            $this->logEvent($model, 'updated', $original, $changedAttributes);
        }
    }

    public function deleting(Model $model): void
    {
        $this->logEvent($model, 'deleted', $model->getAttributes(), null);
    }

    private function logEvent(Model $model, string $action, ?array $oldValues, ?array $newValues): void
    {
        $user = Auth::user();

        AuditLog::create([
            'user_id' => $user?->id,
            'user_name' => $user?->full_name ?? 'System',
            'action' => $action,
            'module' => $this->guessModule($model),
            'entity_type' => get_class($model),
            'entity_id' => $model->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'description' => $this->buildDescription($model, $action),
        ]);
    }

    private function guessModule(Model $model): string
    {
        $classBasename = class_basename($model);

        return match ($classBasename) {
            'User' => 'users',
            'Role' => 'roles',
            'Permission' => 'permissions',
            'LoginActivity' => 'login-activity',
            'AuditLog' => 'audit-logs',
            default => strtolower($classBasename),
        };
    }

    private function buildDescription(Model $model, string $action): string
    {
        $entityName = class_basename($model);
        $key = $model->getKey();

        return "{$entityName} #{$key} was {$action}";
    }
}
