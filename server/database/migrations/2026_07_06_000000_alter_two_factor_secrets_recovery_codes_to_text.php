<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('two_factor_secrets', function (Blueprint $table) {
            $table->text('recovery_codes')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('two_factor_secrets', function (Blueprint $table) {
            $table->string('recovery_codes')->nullable()->change();
        });
    }
};
