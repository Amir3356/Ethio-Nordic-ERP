<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('confirm_password')->after('password');
        });

        // Backfill existing users: set confirm_password = password (same hash)
        DB::table('users')
            ->whereNull('confirm_password')
            ->orWhere('confirm_password', '')
            ->update(['confirm_password' => DB::raw('password')]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('confirm_password');
        });
    }
};
