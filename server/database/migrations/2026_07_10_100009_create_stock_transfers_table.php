<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id('transfer_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('batch_id');
            $table->unsignedBigInteger('from_warehouse_id');
            $table->unsignedBigInteger('to_warehouse_id');
            $table->decimal('quantity', 15, 4);
            $table->string('status', 50)->default('pending');
            $table->unsignedBigInteger('requested_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->unsignedBigInteger('transferred_by')->nullable();
            $table->timestamp('transfer_date')->nullable();
            $table->text('reason')->nullable();
            $table->timestamps();

            $table->foreign('product_id')->references('product_id')->on('products');
            $table->foreign('batch_id')->references('batch_id')->on('stock_batches');
            $table->foreign('from_warehouse_id')->references('warehouse_id')->on('warehouses');
            $table->foreign('to_warehouse_id')->references('warehouse_id')->on('warehouses');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transfers');
    }
};
