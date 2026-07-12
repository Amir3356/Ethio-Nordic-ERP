<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_reviews', function (Blueprint $table) {
            $table->id('review_id');
            $table->foreignId('employee_id')->constrained('employees', 'employee_id')->cascadeOnDelete();
            $table->string('review_period'); // e.g. H1-2026, Q2-2026
            $table->decimal('self_assessment_score', 5, 2)->nullable();
            $table->decimal('manager_score', 5, 2)->nullable();
            $table->decimal('final_score', 5, 2)->nullable();
            $table->string('rating')->nullable(); // exceeds_expectations, meets_expectations, needs_improvement, unsatisfactory
            $table->text('strengths')->nullable();
            $table->text('improvements')->nullable();
            $table->text('goals')->nullable();
            $table->foreignId('reviewer_id')->nullable()->constrained('employees', 'employee_id')->nullOnDelete();
            $table->date('review_date')->nullable();
            $table->string('status')->default('draft'); // draft, self_assessment_done, manager_review_done, completed
            $table->timestamps();

            $table->index(['employee_id', 'review_period']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_reviews');
    }
};
