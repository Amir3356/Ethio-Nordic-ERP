<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('user_email')->nullable(); // Preserve even if user deleted
            $table->string('action'); // create, update, delete, approve, etc.
            $table->string('module'); // Which ERP module
            $table->string('model_type'); // e.g., "App\Models\User"
            $table->unsignedBigInteger('model_id')->nullable();
            $table->json('old_values')->nullable(); // Before snapshot
            $table->json('new_values')->nullable(); // After snapshot
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['user_id', 'created_at']);
            $table->index(['model_type', 'model_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
