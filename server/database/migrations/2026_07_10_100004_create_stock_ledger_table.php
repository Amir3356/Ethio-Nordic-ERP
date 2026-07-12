<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_ledger', function (Blueprint $table) {
            $table->id('ledger_id');
            $table->foreignId('product_id')
                ->constrained('products', 'product_id')
                ->onDelete('cascade');
            $table->foreignId('warehouse_id')
                ->constrained('warehouses', 'warehouse_id')
                ->onDelete('cascade');
            $table->foreignId('batch_id')
                ->constrained('stock_batches', 'batch_id')
                ->onDelete('cascade');
            $table->string('movement_type');
            $table->decimal('quantity', 12, 2);
            $table->decimal('balance_after', 12, 2)->default(0);
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('notes', 500)->nullable();
            $table->timestamp('transaction_date')->useCurrent();
            $table->unsignedBigInteger('created_by')->nullable();

            $table->index(['product_id', 'warehouse_id']);
            $table->index('batch_id');
            $table->index('movement_type');
            $table->index('transaction_date');
            $table->index('reference_id');
            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_ledger');
    }
};
