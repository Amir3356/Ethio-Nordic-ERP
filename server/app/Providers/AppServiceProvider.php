<?php

namespace App\Providers;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Observers\AuditObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Register Audit Observer for system-wide change logging
        User::observe(AuditObserver::class);
        Role::observe(AuditObserver::class);
        Permission::observe(AuditObserver::class);
        
        // Add more models to observe as you create them for other ERP modules
        // Example: PurchaseOrder::observe(AuditObserver::class);
    }
}
