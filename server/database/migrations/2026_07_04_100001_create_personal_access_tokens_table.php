<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('ip_address', 45)->nullable()->after('name');
            $table->text('user_agent')->nullable()->after('ip_address');
            $table->string('device_type')->nullable()->after('user_agent');
            $table->string('browser')->nullable()->after('device_type');
            $table->string('platform')->nullable()->after('browser');
            $table->string('location')->nullable()->after('platform');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('refresh_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('token', 128)->unique();
            $table->string('access_token_id')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('device_type')->nullable();
            $table->string('browser')->nullable();
            $table->string('platform')->nullable();
            $table->timestamp('expires_at');
            $table->timestamp('last_used_at')->nullable();
            $table->boolean('is_revoked')->default(false);
            $table->timestamps();

            $table->index('user_id');
            $table->index('token');
            $table->index(['is_revoked', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refresh_tokens');
        Schema::dropIfExists('personal_access_tokens');
    }
};
