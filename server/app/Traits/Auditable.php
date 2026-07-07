<?php

namespace App\Traits;

use App\Observers\AuditObserver;

trait Auditable
{
    /**
     * Boot the Auditable trait — auto-register the observer.
     */
    public static function bootAuditable(): void
    {
        static::observe(AuditObserver::class);
    }

    /**
     * Log an approve action for this model.
     *
     * This captures the before state, applies the approval,
     * then logs the audit entry with both snapshots.
     */
    public function approve(): void
    {
        $oldValues = $this->getAttributes();

        // Mark as approved — adjust the field name to match your schema
        $this->update(['status' => 'approved']);

        $fresh = $this->fresh();
        $newValues = $fresh ? $fresh->getAttributes() : $this->getAttributes();

        AuditObserver::logApprove($this, $oldValues, $newValues);
    }

    /**
     * Log a custom audit action for this model.
     *
     * Use this for domain-specific actions like 'submit', 'verify', 'dispatch', etc.
     *
     * @param string $action The action name (e.g., 'submit', 'verify', 'dispatch')
     * @param array|null $oldValues Before snapshot
     * @param array|null $newValues After snapshot
     */
    public function logAuditAction(string $action, ?array $oldValues = null, ?array $newValues = null): void
    {
        AuditObserver::logCustom($this, $action, $oldValues, $newValues);
    }
}
