<?php

namespace App\Observers;

use App\Services\Audit\AuditDataFilter;
use App\Services\Audit\AuditLogger;
use App\Services\Audit\AuditModuleResolver;
use Illuminate\Database\Eloquent\Model;

class AuditObserver
{
    protected AuditLogger $logger;

    /**
     * When true, no audit log entries are written at all. Used to silence
     * bootstrap operations (e.g. database seeding) that aren't real user
     * activity.
     */
    protected static bool $disabled = false;

    public function __construct()
    {
        $this->logger = app(AuditLogger::class);
    }

    /**
     * Run a callback with auditing turned off, restoring the previous state
     * afterwards even if the callback throws.
     */
    public static function withoutAuditing(callable $callback): mixed
    {
        $previous = static::$disabled;
        static::$disabled = true;

        try {
            return $callback();
        } finally {
            static::$disabled = $previous;
        }
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
            $changes = $this->logger->getAuditableAttributes($model->getChanges());

            if (empty($changes) || $this->isIgnorableUpdate($model, $changes)) {
                return;
            }

            $original = $this->logger->getAuditableAttributes($model->getOriginal());
            $this->logger->log($model, 'update', $original, $changes);
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
     * Determine if an update only touches fields configured as noise for this
     * model (e.g. login timestamp bumps) and should therefore be skipped.
     */
    protected function isIgnorableUpdate(Model $model, array $changes): bool
    {
        $ignoredFields = config('audit.ignored_update_fields.' . get_class($model), []);

        if (empty($ignoredFields)) {
            return false;
        }

        $meaningfulChanges = array_diff(array_keys($changes), $ignoredFields, ['updated_at']);

        return empty($meaningfulChanges);
    }

    /**
     * Determine if the model should be audited.
     */
    protected function shouldAudit(Model $model): bool
    {
        if (static::$disabled) {
            return false;
        }

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
