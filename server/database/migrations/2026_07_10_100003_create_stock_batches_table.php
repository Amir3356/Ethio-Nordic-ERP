<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('warehouse_id')->constrained()->onDelete('cascade');
            $table->string('batch_no');
            $table->decimal('quantity', 12, 2)->default(0);
            $table->decimal('unit_cost', 12, 2)->default(0);
            $table->date('manufacture_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->date('received_date');
            $table->enum('status', ['active', 'expiring_soon', 'expired', 'depleted'])->default('active');
            $table->timestamps();

            $table->index(['product_id', 'warehouse_id', 'status']);
            $table->index('expiry_date');
            $table->index('batch_no');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_batches');
    }
};
