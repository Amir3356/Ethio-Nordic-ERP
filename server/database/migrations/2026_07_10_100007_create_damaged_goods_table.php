<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('damaged_goods', function (Blueprint $table) {
            $table->id('damaged_goods_id');
            $table->foreignId('product_id')
                ->constrained('products', 'product_id')
                ->onDelete('cascade');
            $table->foreignId('warehouse_id')
                ->constrained('warehouses', 'warehouse_id')
                ->onDelete('cascade');
            $table->foreignId('batch_id')
                ->constrained('stock_batches', 'batch_id')
                ->onDelete('cascade');
            $table->decimal('quantity', 12, 2);
            $table->string('damage_reason');
            $table->unsignedBigInteger('reported_by')->nullable();
            $table->string('supporting_photos')->nullable();
            $table->string('disposition_status')->default('pending');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->date('disposal_date')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('disposition_status');
            $table->index(['product_id', 'warehouse_id']);
            $table->index('reported_by');
            $table->index('approved_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('damaged_goods');
    }
};
