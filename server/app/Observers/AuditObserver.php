<?php

namespace App\Observers;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AuditObserver
{
    /**
     * Models that should not be audited
     */
    protected array $excludedModels = [
        'App\Models\AuditLog',
        'App\Models\LoginActivity',
        'App\Models\PersonalAccessToken',
    ];

    /**
     * Attributes that should not be logged in the audit trail
     */
    protected array $hiddenAttributes = [
        'password',
        'remember_token',
        'secret',
        'recovery_codes',
        'two_factor_secret',
    ];

    /**
     * Handle the model "created" event.
     */
    public function created(Model $model): void
    {
        if ($this->shouldAudit($model)) {
            $this->logAudit($model, 'create', null, $this->getAuditableAttributes($model));
        }
    }

    /**
     * Handle the model "updated" event.
     */
    public function updated(Model $model): void
    {
        if ($this->shouldAudit($model)) {
            $original = $this->getAuditableAttributes($model->getOriginal());
            $changes = $this->getAuditableAttributes($model->getChanges());

            // Only log if there are actual changes
            if (!empty($changes)) {
                $this->logAudit($model, 'update', $original, $changes);
            }
        }
    }

    /**
     * Handle the model "deleted" event.
     */
    public function deleted(Model $model): void
    {
        if ($this->shouldAudit($model)) {
            $this->logAudit($model, 'delete', $this->getAuditableAttributes($model->getAttributes()), null);
        }
    }

    /**
     * Handle the model "restored" event (for soft deletes).
     */
    public function restored(Model $model): void
    {
        if ($this->shouldAudit($model)) {
            $this->logAudit($model, 'restore', null, $this->getAuditableAttributes($model));
        }
    }

    /**
     * Handle the model "force deleted" event.
     */
    public function forceDeleted(Model $model): void
    {
        if ($this->shouldAudit($model)) {
            $this->logAudit($model, 'force_delete', $this->getAuditableAttributes($model->getAttributes()), null);
        }
    }

    /**
     * Log an approve action (called manually from controllers/services).
     */
    public static function logApprove(Model $model, ?array $oldValues = null, ?array $newValues = null): void
    {
        $observer = new self();
        if (!$observer->shouldAudit($model)) {
            return;
        }

        $observer->logAudit($model, 'approve', $oldValues, $newValues);
    }

    /**
     * Determine if the model should be audited
     */
    protected function shouldAudit(Model $model): bool
    {
        $modelClass = get_class($model);

        // Don't audit excluded models
        if (in_array($modelClass, $this->excludedModels)) {
            return false;
        }

        // Check if model has auditing disabled
        if (property_exists($model, 'auditEnabled') && !$model->auditEnabled) {
            return false;
        }

        return true;
    }

    /**
     * Log the audit trail
     */
    protected function logAudit(Model $model, string $action, ?array $oldValues, ?array $newValues): void
    {
        try {
            $user = Auth::user();
            $request = request();

            AuditLog::create([
                'user_id' => $user?->id,
                'user_email' => $user?->email ?? 'system',
                'full_name' => $user?->full_name ?? 'System',
                'action' => $action,
                'module' => $this->getModuleName($model),
                'model_type' => get_class($model),
                'model_id' => $model->getKey(),
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'ip_address' => $request?->ip(),
                'user_agent' => $request?->userAgent(),
            ]);
        } catch (\Exception $e) {
            // Log error but don't break the application flow
            \Log::error('Audit logging failed: ' . $e->getMessage(), [
                'model' => get_class($model),
                'action' => $action,
                'model_id' => $model->getKey(),
            ]);
        }
    }

    /**
     * Get the module name from the model
     */
    protected function getModuleName(Model $model): string
    {
        // Check if model has a custom module name
        if (property_exists($model, 'auditModule')) {
            return $model->auditModule;
        }

        // Extract module name from model class name
        $className = class_basename($model);

        // Map common model names to modules
        $moduleMap = [
            'User' => 'User Management',
            'Role' => 'User Management',
            'Permission' => 'User Management',
            'TwoFactorSecret' => 'Security',
            // Add more mappings as needed for other modules
        ];

        return $moduleMap[$className] ?? 'General';
    }

    /**
     * Filter attributes to include only auditable ones
     */
    protected function getAuditableAttributes(array|Model $data): array
    {
        if ($data instanceof Model) {
            $data = $data->getAttributes();
        }

        // Remove hidden attributes
        foreach ($this->hiddenAttributes as $hidden) {
            unset($data[$hidden]);
        }

        return $data;
    }
}
