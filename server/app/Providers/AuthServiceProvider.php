<?php

namespace App\Providers;

use App\Services\Auth\AccountActivationService;
use App\Services\Auth\AuthenticationService;
use App\Services\Auth\DeviceInfoService;
use App\Services\Auth\GeoLocationService;
use App\Services\Auth\LoginActivityService;
use App\Services\Auth\PasswordService;
use App\Services\Auth\RecoveryCodeService;
use App\Services\Auth\SessionService;
use App\Services\Auth\TwoFactorService;
use App\Services\Token\TokenRefreshService;
use App\Services\Token\TokenStateService;
use App\Services\User\UserActivationService;
use App\Services\User\UserBulkActionService;
use App\Services\User\UserEmailService;
use App\Services\User\UserPasswordService;
use App\Services\User\UserPermissionService;
use App\Services\User\UserQueryService;
use App\Services\User\UserReportService;
use App\Services\User\UserService;
use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Auth services
        $this->app->singleton(DeviceInfoService::class);
        $this->app->singleton(GeoLocationService::class);
        $this->app->singleton(LoginActivityService::class);
        $this->app->singleton(TwoFactorService::class);
        $this->app->singleton(RecoveryCodeService::class);
        $this->app->singleton(AccountActivationService::class);
        $this->app->singleton(AuthenticationService::class);
        $this->app->singleton(PasswordService::class);
        $this->app->singleton(SessionService::class);
        $this->app->singleton(TokenStateService::class);
        $this->app->singleton(TokenRefreshService::class);

        // User services
        $this->app->singleton(UserEmailService::class);
        $this->app->singleton(UserQueryService::class);
        $this->app->singleton(UserService::class);
        $this->app->singleton(UserActivationService::class);
        $this->app->singleton(UserPasswordService::class);
        $this->app->singleton(UserPermissionService::class);
        $this->app->singleton(UserBulkActionService::class);
        $this->app->singleton(UserReportService::class);
    }
}
