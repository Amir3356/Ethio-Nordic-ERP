<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_batches', function (Blueprint $table) {
            $table->id('batch_id');
            $table->foreignId('product_id')
                ->constrained('products', 'product_id')
                ->onDelete('cascade');
            $table->foreignId('warehouse_id')
                ->constrained('warehouses', 'warehouse_id')
                ->onDelete('cascade');
            $table->string('batch_number');
            $table->decimal('quantity_received', 12, 2)->default(0);
            $table->decimal('available_quantity', 12, 2)->default(0);
            $table->decimal('unit_cost', 12, 2)->default(0);
            $table->date('manufacture_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->string('receipt_reference')->nullable();
            $table->string('batch_status')->default('available');
            $table->timestamps();

            $table->index(['product_id', 'warehouse_id']);
            $table->index('batch_number');
            $table->index('batch_status');
            $table->index('expiry_date');
            $table->index('supplier_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_batches');
    }
};
