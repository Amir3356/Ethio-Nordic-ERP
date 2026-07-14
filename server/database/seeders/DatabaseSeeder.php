<?php

namespace Database\Seeders;

use App\Observers\AuditObserver;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        AuditObserver::withoutAuditing(function () {
            $this->call([
                RolePermissionSeeder::class,
                AdminUserSeeder::class,
            ]);
        });
    }
}
