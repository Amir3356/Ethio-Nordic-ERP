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
     */
    public function approve(): void
    {
        $oldValues = $this->getAttributes();
        // Mark as approved — adjust the field name to match your schema
        $this->update(['status' => 'approved']);
        AuditObserver::logApprove($this, $oldValues, $this->fresh()->getAttributes());
    }
}
