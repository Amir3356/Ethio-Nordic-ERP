<?php

namespace App\Observers;

use App\Services\Audit\AuditDataFilter;
use App\Services\Audit\AuditLogger;
use App\Services\Audit\AuditModuleResolver;
use Illuminate\Database\Eloquent\Model;

class AuditObserver
{
    protected AuditLogger $logger;

    public function __construct()
    {
        $this->logger = app(AuditLogger::class);
    }

    /**
     * Handle the model "created" event.
     */
    public function created(Model $model): void
    {
        if ($this->shouldAudit($model)) {
            $this->logger->log($model, 'create', null, $this->logger->getAuditableAttributes($model));
        }
    }

    /**
     * Handle the model "updated" event.
     */
    public function updated(Model $model): void
    {
        if ($this->shouldAudit($model)) {
            $original = $this->logger->getAuditableAttributes($model->getOriginal());
            $changes = $this->logger->getAuditableAttributes($model->getChanges());

            if (!empty($changes)) {
                $this->logger->log($model, 'update', $original, $changes);
            }
        }
    }

    /**
     * Handle the model "deleted" event.
     */
    public function deleted(Model $model): void
    {
        if ($this->shouldAudit($model)) {
            $this->logger->log($model, 'delete', $this->logger->getAuditableAttributes($model->getAttributes()), null);
        }
    }

    /**
     * Handle the model "restored" event (for soft deletes).
     */
    public function restored(Model $model): void
    {
        if ($this->shouldAudit($model)) {
            $this->logger->log($model, 'restore', null, $this->logger->getAuditableAttributes($model));
        }
    }

    /**
     * Handle the model "force deleted" event.
     */
    public function forceDeleted(Model $model): void
    {
        if ($this->shouldAudit($model)) {
            $this->logger->log($model, 'force_delete', $this->logger->getAuditableAttributes($model->getAttributes()), null);
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

        $observer->logger->log($model, 'approve', $oldValues, $newValues);
    }

    /**
     * Log a custom action (called manually from controllers/services).
     */
    public static function logCustom(Model $model, string $action, ?array $oldValues = null, ?array $newValues = null): void
    {
        $observer = new self();
        if (!$observer->shouldAudit($model)) {
            return;
        }

        $observer->logger->log($model, $action, $oldValues, $newValues);
    }

    /**
     * Determine if the model should be audited.
     */
    protected function shouldAudit(Model $model): bool
    {
        $excludedModels = config('audit.excluded_models', []);

        if (in_array(get_class($model), $excludedModels)) {
            return false;
        }

        if (property_exists($model, 'auditEnabled') && !$model->auditEnabled) {
            return false;
        }

        return true;
    }
}
