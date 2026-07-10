<?php

namespace App\Providers;

use App\Services\User\UserActivationService;
use App\Services\User\UserBulkActionService;
use App\Services\User\UserEmailService;
use App\Services\User\UserPasswordService;
use App\Services\User\UserPermissionService;
use App\Services\User\UserQueryService;
use App\Services\User\UserReportService;
use App\Services\User\UserService;
use Illuminate\Support\ServiceProvider;

class UserServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(UserService::class);
        $this->app->singleton(UserQueryService::class);
        $this->app->singleton(UserActivationService::class);
        $this->app->singleton(UserPasswordService::class);
        $this->app->singleton(UserPermissionService::class);
        $this->app->singleton(UserBulkActionService::class);
        $this->app->singleton(UserEmailService::class);
        $this->app->singleton(UserReportService::class);
    }
}
