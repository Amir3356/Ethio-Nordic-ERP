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
        // To enable auditing on any model, add `use Auditable;` to the model class.
    }
}
