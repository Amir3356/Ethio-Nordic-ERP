<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('damaged_goods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('warehouse_id')->constrained()->onDelete('cascade');
            $table->foreignId('batch_id')->constrained('stock_batches')->onDelete('cascade');
            $table->decimal('quantity', 12, 2);
            $table->string('damage_type');
            $table->text('description')->nullable();
            $table->json('photos')->nullable();
            $table->enum('status', ['pending_review', 'approved', 'disposed'])->default('pending_review');
            $table->string('reported_by');
            $table->timestamp('reported_at');
            $table->string('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->decimal('write_off_amount', 12, 2)->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index(['product_id', 'warehouse_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('damaged_goods');
    }
};
