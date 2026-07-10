<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reorder_rules', function (Blueprint $table) {
            $table->id('reorder_rule_id');
            $table->foreignId('product_id')
                ->constrained('products', 'product_id')
                ->onDelete('cascade');
            $table->foreignId('warehouse_id')
                ->constrained('warehouses', 'warehouse_id')
                ->onDelete('cascade');
            $table->decimal('minimum_stock_level', 12, 2)->default(0);
            $table->decimal('reorder_point', 12, 2)->default(0);
            $table->decimal('reorder_quantity', 12, 2)->default(0);
            $table->boolean('alert_enabled')->default(true);
            $table->boolean('auto_purchase_request')->default(false);
            $table->timestamps();

            $table->unique(['product_id', 'warehouse_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reorder_rules');
    }
};
