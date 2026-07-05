<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "View Users", "Create Purchase Order"
            $table->string('slug')->unique(); // e.g., "users.view", "purchase_orders.create"
            $table->string('module'); // e.g., "User Management", "Procurement"
            $table->string('action'); // e.g., "view", "create", "edit", "delete", "approve", "export"
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permissions');
    }
};
