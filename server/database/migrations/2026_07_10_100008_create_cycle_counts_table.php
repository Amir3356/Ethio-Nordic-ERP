<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cycle_counts', function (Blueprint $table) {
            $table->id('cycle_count_id');
            $table->unsignedBigInteger('warehouse_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('batch_id');
            $table->decimal('system_quantity', 15, 4);
            $table->decimal('counted_quantity', 15, 4);
            $table->decimal('variance', 15, 4);
            $table->unsignedBigInteger('counted_by')->nullable();
            $table->timestamp('count_date');
            $table->string('status', 50)->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('warehouse_id')->references('warehouse_id')->on('warehouses');
            $table->foreign('product_id')->references('product_id')->on('products');
            $table->foreign('batch_id')->references('batch_id')->on('stock_batches');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cycle_counts');
    }
};
