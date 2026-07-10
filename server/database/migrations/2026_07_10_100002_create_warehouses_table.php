<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id('warehouse_id');
            $table->string('warehouse_code')->unique();
            $table->string('warehouse_name');
            $table->string('location');
            $table->string('warehouse_type')->default('main');
            $table->decimal('capacity', 12, 2)->default(0);
            $table->string('status')->default('active');
            $table->timestamps();

            $table->index('status');
            $table->index('warehouse_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warehouses');
    }
};
