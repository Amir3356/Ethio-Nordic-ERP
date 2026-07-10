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
use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    public function register(): void
    {
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
    }
}
