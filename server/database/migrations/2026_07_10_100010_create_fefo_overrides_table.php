<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fefo_overrides', function (Blueprint $table) {
            $table->id('override_id');
            $table->unsignedBigInteger('batch_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('warehouse_id');
            $table->unsignedBigInteger('original_batch_id');
            $table->unsignedBigInteger('overridden_batch_id');
            $table->text('reason');
            $table->unsignedBigInteger('overridden_by')->nullable();
            $table->timestamps();

            $table->foreign('batch_id')->references('batch_id')->on('stock_batches');
            $table->foreign('product_id')->references('product_id')->on('products');
            $table->foreign('warehouse_id')->references('warehouse_id')->on('warehouses');
            $table->foreign('original_batch_id')->references('batch_id')->on('stock_batches');
            $table->foreign('overridden_batch_id')->references('batch_id')->on('stock_batches');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fefo_overrides');
    }
};
