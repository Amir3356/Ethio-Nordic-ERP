<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Audit observer registration is handled automatically by the Auditable trait.
        //
        // To enable auditing on ANY model (current or future), add:
        //     use App\Traits\Auditable;
        // to the model class.
        //
        // The AuditObserver auto-detects the module from:
        //   1. Model's $auditModule property (custom override)
        //   2. AuditObserver::$moduleMap by class basename
        //   3. 'General' fallback
        //
        // Supported actions: create, update, delete, approve, restore, force_delete
        //
        // Immutability layers:
        //   Layer 1: AuditLog model — blocks update/delete/forceDelete at Eloquent level
        //   Layer 2: PostgreSQL triggers — blocks UPDATE/DELETE at database level
        //   Layer 3: Route middleware — blocks PUT/PATCH/DELETE HTTP methods on /api/audit-logs
        //   Layer 4: Database permissions — REVOKE UPDATE, DELETE on audit_logs table
    }
}
