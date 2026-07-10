<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->id('adjustment_id');
            $table->foreignId('product_id')
                ->constrained('products', 'product_id')
                ->onDelete('cascade');
            $table->foreignId('warehouse_id')
                ->constrained('warehouses', 'warehouse_id')
                ->onDelete('cascade');
            $table->foreignId('batch_id')
                ->constrained('stock_batches', 'batch_id')
                ->onDelete('cascade');
            $table->string('adjustment_type');
            $table->decimal('quantity', 12, 2);
            $table->string('reason_code')->nullable();
            $table->text('description')->nullable();
            $table->string('supporting_document')->nullable();
            $table->string('status')->default('pending');
            $table->unsignedBigInteger('requested_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('status');
            $table->index(['product_id', 'warehouse_id']);
            $table->index('requested_by');
            $table->index('approved_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_adjustments');
    }
};
