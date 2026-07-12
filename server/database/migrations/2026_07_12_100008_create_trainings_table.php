<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trainings', function (Blueprint $table) {
            $table->id('training_id');
            $table->foreignId('employee_id')->constrained('employees', 'employee_id')->cascadeOnDelete();
            $table->string('training_name');
            $table->string('provider')->nullable();
            $table->date('training_date')->nullable();
            $table->integer('duration_days')->default(0);
            $table->string('certification')->nullable();
            $table->date('cert_expiry')->nullable();
            $table->string('status')->default('completed'); // completed, scheduled, cancelled
            $table->decimal('cost_etb', 12, 2)->default(0);
            $table->timestamps();

            $table->index('status');
            $table->index('cert_expiry');
            $table->index('employee_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trainings');
    }
};
