<?php

namespace App\Providers;

use App\Models\AuditLog;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Observers\AuditObserver;
use Illuminate\Support\ServiceProvider;

class AuditServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        User::observe(AuditObserver::class);
        Role::observe(AuditObserver::class);
        Permission::observe(AuditObserver::class);
        AuditLog::observe(AuditObserver::class);
    }
}
