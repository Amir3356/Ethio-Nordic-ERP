<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_runs', function (Blueprint $table) {
            $table->id('payroll_run_id');
            $table->string('pay_period'); // e.g. 2026-07
            $table->date('pay_date');
            $table->decimal('total_gross', 14, 2)->default(0);
            $table->decimal('total_deductions', 14, 2)->default(0);
            $table->decimal('total_net', 14, 2)->default(0);
            $table->integer('employee_count')->default(0);
            $table->string('status')->default('draft'); // draft, pending_approval, approved, paid, cancelled
            $table->foreignId('prepared_by')->nullable()->constrained('employees', 'employee_id')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('employees', 'employee_id')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->unique('pay_period');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_runs');
    }
};
